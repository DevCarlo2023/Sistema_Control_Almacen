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

const MASTER_PROMPT = `Eres el asistente de inventario de PROMET.
Tu obligación es dar respuestas ultra cortas, directas y sin rodeos. SOLO RESPONDE LO QUE SE PREGUNTA.

REGLA DE FILTRADO (CRÍTICO):
La DATA provista puede traer variaciones o ítems que tengan palabras similares.
✅ ACEPTA elementos de la DATA que sean variaciones, tipos, o modelos de lo que pidió el usuario (Ej: Si pide "alambre", ACEPTA "Alambre Negro # 8". Si pide "tubo conduit", ACEPTA "Tubería Conduit 1 pulgada").
❌ IGNORA SILENCIOSAMENTE elementos que no tengan relación real (Ej: Si pide "casco", IGNORA "casaca").

FORMATO ESTRICTO:

Si hay stock:
✅ [Nombre Oficial o Descripción] (Cód: [code])
📦 Stock: [X] | 📍 [Almacén]

Si no hay stock de lo solicitado:
❌ Sin stock de [producto solicitado]

REGLAS GLOBALES:
- Cero intros largas (No digas "¡Buenos días! Soy tu asistente..."). Responde directamente a la consulta.
- No des sugerencias proactivas a menos que el usuario lo pida.
- No des alternativas si no están estrechamente relacionadas.
- Ve al grano. Menos palabras, más datos.`;

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
        const extractionPrompt = `Extrae los materiales o equipos mencionados en la última solicitud del historial:\n${historyText}\n
        DICCIONARIO DE NORMALIZACIÓN MÁGICA:
        - Tivex / Tibek / Tybek / Tyveks / Tyvexs → Tyvek
        - Overall / overol / overoles / mameluco / mamelucos → Mameluco
        - Chaleco / chalecos / pechera / pecheras → Chaleco
        - Taba / tabas / zapato / zapatos / bota / botas / botines → Botin
        - Casco / cascos / yep / yepo / yeps → Casco
        - Lente / lentes / google / googles / goggle / goggles / lunar / lunares → Lente
        - Careta / caretas → Careta
        - Mascarilla / mascarillas / nariguera / narigueras / respiradores → Respirador
        - Filtro / filtros → Filtro
        - Guante de hilo / guantes de hilo → Guante Algodon
        - Guante negro / guantes negros / guante látex → Guante Nitrilo
        - Arnes / arneses / soga / sogas / línea de vida → Arnes
        - Tubo / tubos / cañeria / tuberias → Tuberia
        
        Extrae cada concepto de búsqueda como un solo elemento de la lista. Ej: si piden "tubo conduit de 1 pulgada" y "alambre 8", extrae ["tuberia conduit 1 pulgada", "alambre 8"].
        Usa tu normalización lógica pero mantén cada concepto agrupado. Ponlo en SINGULAR.`;

        const extractionSchema: Schema = {
            type: SchemaType.ARRAY,
            description: "Conceptos de búsqueda agrupados en SINGULAR. Ej: ['tubería conduit de 1', 'alambre negro 8'].",
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
                // Fragmentar el concepto en palabras
                const tokens = normalizar(concepto).split(' ').filter(t => t.length >= 1 && !['de', 'la', 'el', 'para', 'con', 'y', 'un', 'una'].includes(t));
                if (tokens.length === 0) continue;

                let query = supabase.from('inventory').select('quantity, material:materials!inner(name, description, code), warehouse:warehouses(name)');

                // Chain .or blocks para simular coincidencia perfecta de multi-token posicional
                for (const token of tokens) {
                    query = query.or(`name.ilike.%${token}%,description.ilike.%${token}%,code.ilike.%${token}%`, { foreignTable: "materials" });
                }

                const { data } = await query.limit(10);
                if (data) {
                    data.forEach((item: any) => {
                        const key = `${item.material?.name}-${item.warehouse?.name}`;
                        if (!candidatesMap.has(key)) candidatesMap.set(key, item);
                    });
                }
            }
            const allCandidates = Array.from(candidatesMap.values());
            if (allCandidates.length > 0) {
                stockContext = `INVENTARIO (solo coinciden si te parece razonable): ${JSON.stringify(allCandidates)}`;
            }
        }

        const respuesta = await geminiChatMultimodal(`Última pregunta del operario:\n${resolvedText}\n\n=== RESULTADOS ===\n${stockContext}\n\nUsa LA ESTRUCTURA DEL MASTER PROMPT. NO DES EXPLICACIONES.`, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
