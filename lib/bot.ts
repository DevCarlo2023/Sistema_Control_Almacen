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
✅ ACEPTA variaciones del producto pedido (Ej: "chaleco" → cualquier tipo de chaleco).
❌ IGNORA silenciosamente si el item claramente no es lo que pidieron.

FORMATO:
Si hay stock:
✅ [Nombre del producto] (Cód: [code])
📦 Stock: [X] | 📍 [Almacén]

Si no hay:
❌ Sin stock de [producto]

REGLAS:
- Saluda siempre identificándote (Ej: "¡Hola! Soy tu *Asistente Virtual de Almacén*. Aquí tienes:").
- Si buscas EPPs de un kit, lista los que SÍ encontró y marca con ❌ los que no hay.
- No des párrafos largos de explicación. Solo datos limpios con iconos.`;

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

DICCIONARIO EPP POR LABOR:
- soldadura / soldador → ["casaca cuero", "pantalon cuero", "escarpin soldador", "guante soldador", "respirador media cara", "filtro 2097", "careta soldadura", "mandil cuero"]
- altura / izaje → ["arnes", "linea de vida", "casco", "guante"]
- quimica / acidos → ["guante nitrilo", "lente", "respirador", "tyvek"]
- electrico → ["guante dielectrico", "casco", "lente"]
- excavacion / minero → ["casco", "botin punta acero", "lente", "respirador"]
- pintura → ["tyvek", "guante nitrilo", "respirador", "lente"]

REGLAS DE EXTRACCIÓN:
1. Si hay sinónimos conocidos (filtro/cartucho, tapones), devuelve TODOS los términos posibles en el array.
2. Si el usuario pide EPP para un tipo de trabajo, devuelve cada item del kit por separado.
3. Para productos normales, extráelos en SINGULAR.
4. Mantén siempre los números de modelo (6003, 2097, etc.) junto a la palabra clave.
5. SIEMPRE en SINGULAR.`;

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

        let stockContext = '';
        if (keywords.length > 0) {
            let candidatesMap = new Map();
            for (const concepto of keywords) {
                const tokens = normalizar(concepto).split(' ').filter(t => t.length >= 2 && !['de', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'un', 'una'].includes(t));
                if (tokens.length === 0) continue;

                const primaryToken = tokens[0];

                // Paso 1: buscar materiales directamente por nombre o descripción
                const { data: matchingMaterials, error: matErr } = await supabase
                    .from('materials')
                    .select('id, name, description')
                    .or(`name.ilike.%${primaryToken}%,description.ilike.%${primaryToken}%`)
                    .limit(80);

                if (matErr) console.error(`[BOT] matErr for "${primaryToken}":`, matErr.message);
                if (!matchingMaterials || matchingMaterials.length === 0) continue;

                // Paso 2: filtrar por tokens adicionales en RAM
                const filteredMaterials = matchingMaterials.filter((mat: any) => {
                    const textBlox = normalizar(`${mat.name || ''} ${mat.description || ''}`);
                    return tokens.every(tk => textBlox.includes(tk));
                });

                if (filteredMaterials.length === 0) continue;

                // Paso 3: buscar stock en inventory por material IDs
                const materialIds = filteredMaterials.map((m: any) => m.id);
                const { data: invData, error: invErr } = await supabase
                    .from('inventory')
                    .select('quantity, material_id, material:materials(name, description), warehouse:warehouses(name)')
                    .in('material_id', materialIds)
                    .gt('quantity', 0)
                    .limit(20);

                if (invErr) console.error(`[BOT] invErr:`, invErr.message);
                if (invData) {
                    invData.forEach((item: any) => {
                        const key = `${item.material?.name}-${item.warehouse?.name}`;
                        if (!candidatesMap.has(key)) candidatesMap.set(key, item);
                    });
                }
            }
            const allCandidates = Array.from(candidatesMap.values());
            if (allCandidates.length > 0) {
                stockContext = `INVENTARIO:\n${JSON.stringify(allCandidates)}`;
            }
        }

        const respuesta = await geminiChatMultimodal(`Última pregunta del operario:\n${resolvedText}\n\n=== RESULTADOS ===\n${stockContext}\n\nUsa LA ESTRUCTURA DEL MASTER PROMPT. NO DES EXPLICACIONES.`, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
