import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim()
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

function normalizar(texto: string) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const MASTER_PROMPT = `Eres el *Asistente Virtual de Almacén* de PROMET. 🏗️
Solo responde lo que se pregunta. Sé amable, preciso y breve.

REGLA DE FILTRADO:
✅ ACEPTA variaciones y modelos similares.
❌ IGNORA si el item no tiene relación.

FORMATO MATERIALES:
✅ [Producto] (Cód: [code])
📦 Stock: [X] | 📍 [Almacén]

FORMATO EQUIPOS/HERRAMIENTAS:
🔧 [Equipo] (S/N: [serial])
📌 Estado: [status] | Ubicación: [Almacen o Campo]
👤 Responsable: [Nombre (Actual o Último)]
🗓️ Calibración: [VIGENTE / VENCIDA / No requiere]
⏱️ Última actividad: [Acción + Fecha]

REGLAS:
- Saluda siempre identificándote (Ej: "¡Hola! Soy tu *Asistente Virtual de Almacén*.").
- Si buscas EPPs de un kit, lista los que SÍ encontraste y marca con ❌ los que falten.
- Para equipos, indica siempre quién fue la última persona en tenerlo si está en almacén.
- No des párrafos largos. Solo datos limpios con iconos.`;

/**
 * Robust Chat 
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null, jsonSchema: Schema | null = null) {
    const rawKey = (process.env.GOOGLE_GEMINI_KEY || '').trim();
    const key = rawKey.replace(/^y[\r\n\s]+/, '').replace(/^y/, '').trim();

    if (!key || key.length < 10) {
        return "❌ Error: La API KEY no está configurada correctamente en Vercel. Asegúrate de llamarla GOOGLE_GEMINI_KEY";
    }

    const genAI = new GoogleGenerativeAI(key);

    const fallbackModels = [
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-pro'
    ];

    let lastError = '';
    for (const modelName of fallbackModels) {
        try {
            const modelConfig: any = {
                model: modelName,
                systemInstruction: systemMsg || MASTER_PROMPT
            };

            if (jsonSchema) {
                modelConfig.generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema
                };
            }

            const model = genAI.getGenerativeModel(modelConfig);

            const parts: any[] = [{ text: prompt }];
            if (media && media.base64 && media.mimeType) {
                parts.push({ inlineData: { mimeType: media.mimeType, data: media.base64 } });
            }

            const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
            const response = await result.response;
            return response.text().trim();
        } catch (e: any) {
            console.warn(`Fallback ${modelName} failed: ${e.message}`);
            lastError = e.message;
            if (e.message.includes('401') || e.message.includes('API key')) break;
            continue;
        }
    }
    return `Lo siento, hay un inconveniente temporal con la IA. ¿Qué necesitas de Almacén? (Internal: ${lastError})`;
}

export async function enviarWA(jid: string, mensaje: string) {
    if (!jid) return;
    const isGroup = jid.includes('@g.us');
    const isLid = jid.includes('@lid');
    const target = (isGroup || isLid) ? jid : jid.split('@')[0];

    try {
        await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
            body: JSON.stringify({ number: target, text: mensaje })
        });
    } catch (e: any) { }
}

export async function procesarRespuesta(jid: string, texto: string, media: any = null, msgId: string | null = null) {
    if (!jid) return "Error JID";
    let { data: sessionData } = await supabase.from('bot_sessions').select('history').eq('jid', jid).maybeSingle();
    let history = sessionData?.history || [];
    if (msgId && history.some((h: any) => h.ref_id === msgId)) return "Mensaje ya procesado";

    let resolvedText = texto || '';
    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor.");
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        const extractionPrompt = `Eres el motor de extracción del Asistente Virtual de Almacén de PROMET.
Analiza la ÚLTIMA consulta e identifica los productos a buscar en inventario:
${historyText}

SINÓNIMOS Y ASOCIACIONES (mismo producto, distintos nombres):
- tapon auditivo / tapon oido / protector auditivo / ear plug → extraer como: ["tapon oido", "tapon auditivo", "protector auditivo"]
- filtro / cartucho → son sinónimos. Si mencionan uno, busca ambos. Ej: "filtro 6003" → ["filtro 6003", "cartucho 6003"]
- mascarilla / respirador / nariguera → extraer como: ["respirador", "mascarilla"]
- botin / zapato / bota / taba → extraer como ["botin"]
- casco / yep → extraer como ["casco"]
- chaleco / pechera → extraer como ["chaleco"]
- lente / luna / google / goggle → extraer como ["lente"]
- tyvek / traje descartable / overol desechable → extraer como ["tyvek", "traje descartable"]
- arnes / arneses / soga de seguridad → extraer como ["arnes"]
- tubo / tuberia / cañeria → extraer como ["tuberia"]
- atornillador / taladro / amoladora / torquimetro / herramienta / impacto → extraer como ["atornillador", "impacto", "taladro", "amoladora", "torquimetro"]

DICCIONARIO EPP POR LABOR:
- soldadura / soldador → ["casaca cuero", "pantalon cuero", "escarpin soldador", "guante soldador", "respirador media cara", "filtro 2097", "careta soldadura", "mandil cuero"]
- altura / izaje → ["arnes", "linea de vida", "casco", "guante"]
- quimica / acidos → ["guante nitrilo", "lente", "respirador", "tyvek"]
- electrico → ["guante dielectrico", "casco", "lente"]
- excavacion / minero → ["casco", "botin punta acero", "lente", "respirador"]
- pintura → ["tyvek", "guante nitrilo", "respirador", "lente"]

REGLAS DE EXTRACCIÓN:
1. Si hay sinónimos conocidos, devuelve TODOS los términos posibles.
2. Si piden EPP para un trabajo, devuelve cada item del kit por separado.
3. Para herramientas, extrae marca, modelo o serie si se mencionan.
4. Siempre en SINGULAR.`;

        const extractionSchema: Schema = {
            type: SchemaType.ARRAY,
            description: "Conceptos de búsqueda en SINGULAR. CRÍTICO: Todas las palabras deben estar estrictamente en su forma singular (ej: 'pernos' -> 'perno', 'cascos' -> 'casco').",
            items: {
                type: SchemaType.STRING
            }
        };

        let kwStr = await geminiChatMultimodal(extractionPrompt, null, "Analista experto, estricto con el JSON array.", extractionSchema);
        let keywords: string[] = [];
        try { keywords = JSON.parse(kwStr); } catch (e) { }

        let inventoryContext = '';
        let equipmentContext = '';

        if (keywords.length > 0) {
            let invMap = new Map();
            let eqMap = new Map();

            for (const concepto of keywords) {
                const tokens = normalizar(concepto).split(' ').filter(t => t.length >= 2 && !['de', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'un', 'una'].includes(t));
                if (tokens.length === 0) continue;
                const primaryToken = tokens[0];

                // --- BUSQUEDA MATERIALES ---
                const { data: mats } = await supabase.from('materials').select('id, name, description').or(`name.ilike.%${primaryToken}%,description.ilike.%${primaryToken}%`).limit(20);
                if (mats && mats.length > 0) {
                    const filteredMats = mats.filter((m: any) => tokens.every(tk => normalizar(`${m.name} ${m.description}`).includes(tk)));
                    if (filteredMats.length > 0) {
                        const mid = filteredMats.map((m: any) => m.id);
                        const [{ data: stocks }, { data: lastMovs }] = await Promise.all([
                            supabase.from('inventory').select('quantity, material:materials(name), warehouse:warehouses(name)').in('material_id', mid).gt('quantity', 0),
                            supabase.from('inventory_movements').select('movement_type, quantity, notes, created_at, material:materials(name)').in('material_id', mid).order('created_at', { ascending: false }).limit(3)
                        ]);
                        stocks?.forEach((s: any) => invMap.set(`${s.material?.name}-${s.warehouse?.name}`, { ...s, last_movements: lastMovs }));
                    }
                }

                // --- BUSQUEDA EQUIPOS ---
                const { data: equips } = await supabase.from('equipment').select('*, warehouse:warehouses(name)').or(`name.ilike.%${primaryToken}%,model.ilike.%${primaryToken}%,serial_number.ilike.%${primaryToken}%,brand.ilike.%${primaryToken}%`).limit(20);
                if (equips && equips.length > 0) {
                    const filteredEq = equips.filter((e: any) => tokens.every(tk => normalizar(`${e.name} ${e.model} ${e.serial_number} ${e.brand}`).includes(tk)));
                    for (const eq of filteredEq) {
                        // Obtener últimos movimientos para historial de responsables
                        const { data: movs } = await supabase.from('equipment_movements').select('movement_type, created_at, worker:workers(full_name)').eq('equipment_id', eq.id).order('created_at', { ascending: false }).limit(2);

                        let last_worker = 'N/A';
                        let last_action = 'Ninguna';
                        if (movs && movs.length > 0) {
                            last_worker = (movs[0].worker as any)?.full_name || 'Desconocido';
                            last_action = `${movs[0].movement_type === 'egreso' ? 'Retirado' : 'Devuelto'} el ${new Date(movs[0].created_at).toLocaleDateString()}`;
                        }

                        const calStatus = eq.calibration_end ? (new Date(eq.calibration_end) > new Date() ? 'VIGENTE' : 'VENCIDA') : 'No requiere';
                        eqMap.set(eq.id, { ...eq, last_worker, last_action, calStatus });
                    }
                }
            }

            const invList = Array.from(invMap.values());
            const eqList = Array.from(eqMap.values());
            if (invList.length > 0) inventoryContext = `MATERIALES/STOCK: ${JSON.stringify(invList)}`;
            if (eqList.length > 0) equipmentContext = `EQUIPOS/HISTORIAL: ${JSON.stringify(eqList)}`;
        }

        const respuesta = await geminiChatMultimodal(`Consulta: ${resolvedText}\n\n=== DATA ===\n${inventoryContext}\n${equipmentContext}\n\nUsa el formato del MASTER PROMPT. Si el equipo está en almacén, indica quién lo tuvo por última vez basándote en el historial.`, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
