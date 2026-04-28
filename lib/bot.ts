import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'
import crypto from 'crypto'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim()
}

// Fast model: use gemini-1.5-flash-8b (NOT 2.5-flash which hits free quota)
const FAST_MODEL = (process.env.GEMINI_FAST_MODEL || 'gemini-1.5-flash-8b').trim()

const queryCache = new Map<string, { response: string; ts: number }>();
const rateLimitMap = new Map<string, number>(); // Simple per‑user rate limiting (10 s window)


const genAI = new GoogleGenerativeAI((process.env.GOOGLE_GEMINI_KEY || '').trim())

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

function normalizar(texto: string): string {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function singularizar(palabra: string): string {
    const p = normalizar(palabra);
    if (p.endsWith('es')) return p.slice(0, -2);
    if (p.endsWith('s') && !p.endsWith('ss')) return p.slice(0, -1);
    return p;
}

function esConsultaSimple(texto: string): boolean {
    const tokens = normalizar(texto).split(' ').filter(t => t.length > 0);
    // Permitir hasta 6 palabras si contienen palabras clave críticas
    if (tokens.length > 6) return false;
    const keywords = ['guante', 'chaleco', 'tapon', 'mascarilla', 'protector', 'acido', 'corte', 'soldador', 'cable', 'cinta', 'lente', 'casco', 'arnes'];
    return tokens.some(t => keywords.some(kw => t.includes(kw)));
}

const MASTER_PROMPT = `Eres el *Asistente Virtual de Almacén* de PROMET. 🏗️
Solo responde lo que se pregunta. Sé amable, preciso y breve.

REGLA DE FILTRADO:
✅ ACEPTA variaciones y modelos similares.
❌ IGNORA si el item no tiene relación.
⚠️ PROHIBIDO INVENTAR DATOS: Si el bloque === DATA === es insuficiente o está vacío, responde educadamente que no se encontraron registros en el sistema. Jamás inventes productos, stocks o ubicaciones.

FORMATO MATERIALES:
✅ [Nombre] - [Descripción] (Cód: [codigo])
📦 Stock: [X] | 📍 [Almacén]

FORMATO EQUIPOS/HERRAMIENTAS:
🔧 [Equipo] (S/N: [serial])
📌 Estado: [status] | Ubicación: [Almacen o Campo]
👤 Responsable: [Nombre (Actual o Último)]
🗓️ Calibración: [VIGENTE / VENCIDA / No requiere]
⏱️ Última actividad: [Acción + Fecha]

REGLAS:
- SI YA HAY MENSAJES PREVIOS EN EL HISTORIAL, **PROHIBIDO** saludarte o presentarte de nuevo. Ve DIRECTO a la respuesta. Solo preséntate en el primer mensaje de la sesión.
- Para materiales, es CRÍTICO mostrar [Nombre] - [Descripción]. Nunca omitas la descripción (donde suelen estar las tallas o medidas).
- Si buscas EPPs de un kit, lista los que SÍ encontraste y marca con ❌ los que falten.
- Para equipos, indica siempre quién fue la última persona en tenerlo si está en almacén.
- No des párrafos largos. Solo datos limpios con iconos.`;

/**
 * Robust Chat 
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null, jsonSchema: Schema | null = null) {
    const key = (process.env.GOOGLE_GEMINI_KEY || '').trim();

    if (!key || key.length < 10) {
        return "❌ Error: La API KEY no está configurada correctamente en Vercel. Asegúrate de llamarla GOOGLE_GEMINI_KEY";
    }


    
    if (esConsultaSimple(prompt)) {
        const cacheKey = crypto.createHash('md5').update(prompt).digest('hex')
        const cached = queryCache.get(cacheKey)
        if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
            return cached.response
        }
        try {
            const model = genAI.getGenerativeModel({ model: FAST_MODEL, systemInstruction: systemMsg || MASTER_PROMPT })
            const parts: any[] = [{ text: prompt }]
            if (media && media.base64 && media.mimeType) {
                parts.push({ inlineData: { mimeType: media.mimeType, data: media.base64 } })
            }
            const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
            const response = await result.response
            const text = response.text().trim()
            queryCache.set(cacheKey, { response: text, ts: Date.now() })
            return text
        } catch (e: any) {
            console.warn(`Fast model ${FAST_MODEL} failed: ${e.message}`)
            // fall through to fallback models
        }
    }

    // IMPORTANT: Do NOT use gemini-flash-latest (resolves to gemini-2.5-flash, free tier exhausted)
    const fallbackModels = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
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
            // If it's a rate-limit / service unavailable error, wait and try next model
            if (e.message.includes('503') || e.message.includes('Too Many Requests')) {
                await new Promise(res => setTimeout(res, 2000));
                continue;
            }
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
    
    // --- FILTRO DE SALUDOS CRÍTICO (SIN IA) ---
    const rawText = (texto || '').trim().toLowerCase();
    const greetingPattern = /^(hola|buenos?\s+d[ií]as?|buenas?\s+tardes?|buenas?\s+noches?)[.!?]*$/i;
    
    if (greetingPattern.test(rawText)) {
        const staticGreeting = "¡Hola! Soy el Asistente Virtual de Almacén de PROMET. 🏗️ ¿En qué puedo ayudarte hoy?";
        await enviarWA(jid, staticGreeting);
        return staticGreeting;
    }

    let { data: sessionData } = await supabase.from('bot_sessions').select('history').eq('jid', jid).maybeSingle();
    let history = sessionData?.history || [];
    if (msgId && history.some((h: any) => h.ref_id === msgId)) return "Mensaje ya procesado";

    let resolvedText = texto || '';
    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor.");
    }

    // Rate limiting per user (10s window) to avoid rapid quota consumption
    const now = Date.now();
    const last = rateLimitMap.get(jid) || 0;
    if (now - last < 10_000) {
        const throttleMsg = "⚡️ Por favor, espere unos segundos antes de volver a consultar.";
        await enviarWA(jid, throttleMsg);
        return throttleMsg;
    }
    rateLimitMap.set(jid, now);
    

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 5) history.shift();
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
                const rawTokens = normalizar(concepto).split(' ').filter(t => t.length >= 2 && !['de', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'un', 'una'].includes(t));
                const tokens = rawTokens.map(singularizar);
                if (tokens.length === 0) continue;
                const primaryToken = tokens[0];

                console.log(`🔍 Buscando: "${concepto}" -> Tokens: [${tokens.join(', ')}]`);

                // --- BUSQUEDA MATERIALES ---
                const { data: mats } = await supabase.from('materials').select('id, name, description, codigo').or(`name.ilike.%${primaryToken}%,description.ilike.%${primaryToken}%`).limit(30);
                if (mats && mats.length > 0) {
                    const filteredMats = mats.filter((m: any) => tokens.every(tk => normalizar(`${m.name} ${m.description}`).includes(tk)));
                    if (filteredMats.length > 0) {
                        const mid = filteredMats.map((m: any) => m.id);
                        const [{ data: stocks }, { data: lastMovs }] = await Promise.all([
                            supabase.from('inventory').select('quantity, material:materials(id, name, description, codigo), warehouse:warehouses(name)').in('material_id', mid).gt('quantity', 0),
                            supabase.from('inventory_movements').select('movement_type, quantity, notes, created_at, material:materials(name, description, codigo)').in('material_id', mid).order('created_at', { ascending: false }).limit(3)
                        ]);
                        stocks?.forEach((s: any) => {
                            const desc = s.material?.description ? ` - ${s.material.description}` : '';
                            invMap.set(`${s.material?.name}${desc}-${s.warehouse?.name}`, { ...s, last_movements: lastMovs });
                        });
                    }
                }

                // --- BUSQUEDA EQUIPOS ---
                const { data: equips } = await supabase.from('equipment').select('*, warehouse:warehouses(name)').or(`name.ilike.%${primaryToken}%,model.ilike.%${primaryToken}%,serial_number.ilike.%${primaryToken}%,brand.ilike.%${primaryToken}%`).limit(20);
                if (equips && equips.length > 0) {
                    const filteredEq = equips.filter((e: any) => tokens.every(tk => normalizar(`${e.name} ${e.model} ${e.serial_number} ${e.brand}`).includes(tk)));
                    for (const eq of filteredEq) {
                        // Obtener últimos movimientos para historial de responsables
                        const { data: movs } = await supabase.from('equipment_movements').select('movement_type, created_at, worker:workers(full_name)').eq('equipment_id', eq.id).order('created_at', { ascending: false }).limit(5);

                        let last_worker = 'Desconocido';
                        let last_action = 'Ninguna';

                        if (movs && movs.length > 0) {
                            // La última acción es siempre el primer registro
                            const lastMov = movs[0];
                            const dateStr = new Date(lastMov.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            last_action = `${lastMov.movement_type === 'egreso' ? 'Retirado' : 'Devuelto'} el ${dateStr}`;

                            // Para el responsable, buscaremos el egreso más reciente (quién lo sacó)
                            const lastEgreso = movs.find((m: any) => m.movement_type === 'egreso');
                            if (lastEgreso && (lastEgreso.worker as any)?.full_name) {
                                last_worker = (lastEgreso.worker as any).full_name;
                            } else if ((lastMov.worker as any)?.full_name) {
                                // Si no hay egreso en los últimos 5 pero el último mov tiene worker
                                last_worker = (lastMov.worker as any).full_name;
                            }
                        }

                        const calStatus = eq.calibration_end ? (new Date(eq.calibration_end) > new Date() ? 'VIGENTE' : 'VENCIDA') : 'No requiere';
                        eqMap.set(eq.id, { ...eq, last_worker, last_action, calStatus });
                    }
                }
            }

            const invList = Array.from(invMap.values());
            const formattedInv = invList.map((s: any) => {
                const desc = s.material?.description ? ` - ${s.material.description}` : '';
                const code = s.material?.codigo || s.material?.id;
                return `✅ ${s.material?.name}${desc} (Cód: ${code})\n📦 Stock: ${s.quantity} | 📍 ${s.warehouse?.name}`;
            }).join('\n\n');

            if (formattedInv) inventoryContext = `MATERIALES/STOCK:\n${formattedInv}`;
        }

        const prompt = `Consulta del usuario: ${resolvedText}\n\n=== DATA / UNICA FUENTE DE VERDAD ===\n${inventoryContext || 'NO HAY MATERIALES EN STOCK'}\n${equipmentContext || 'NO HAY EQUIPOS REGISTRADOS'}\n\nREGLA: Solo responde sobre los items que aparecen en DATA. Si el usuario pide algo que NO está en DATA, di que "No se encontró stock de [item] en el sistema". No inventes nada.`;
        const respuesta = await geminiChatMultimodal(prompt, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
