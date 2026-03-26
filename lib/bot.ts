import { createClient } from '@supabase/supabase-js'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim(),
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
    GEMINI_MODEL: 'gemini-1.5-flash'
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `# ROL Y ENTORNO
Eres **Almacén Virtual**, el asistente inteligente de **INDUSTRIAS PROMET**. 
Tu misión es gestionar el inventario y resolver dudas de materiales de MINA.

# REGLAS DE RESPUESTA
1. **Precisión**: Usa la DATA REAL DB para confirmar existencias.
2. **Jerga**: Traduce términos (tabas->botines, gafas->lentes) automáticamente.
3. **Seguridad**: Si el usuario va a una tarea peligrosa, sugiere EPP.
4. **Estilo**: Usa emojis (📦, ⚠️, ✅) y negritas. Sé conciso (máx 5 líneas).
5. **Fuera de Ámbito**: Si te preguntan algo ajeno a minería o materiales, amablemente redirige la conversación al almacén.`;



function normalizar(texto: string) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
        let contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

        if (media && media.base64 && media.mimeType) {
            contents[0].parts.push({
                inline_data: { mime_type: media.mimeType, data: media.base64 }
            });
        }

        const body = {
            system_instruction: { parts: [{ text: systemMsg || SYSTEM_PROMPT }] },
            contents: contents
        };

        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await r.json();
        if (data.error) {
            console.error('Gemini API Error:', data.error.message);
            return `Error Gemini: ${data.error.message}`;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').replace(/thought:[\s\S]*?(\n|$)/gi, '').trim();
    } catch (e: any) {
        console.error('Error IA:', e.message);
        return `Error IA: ${e.message}`;
    }
}

export async function enviarWA(jid: string, mensaje: string) {
    if (!jid) return;

    // Keep full JID for groups and LIDs; strip suffix only for regular @s.whatsapp.net numbers
    const isGroup = jid.includes('@g.us');
    const isLid = jid.includes('@lid');
    const target = (isGroup || isLid) ? jid : jid.split('@')[0];

    console.log(`📤 Enviando respuesta a ${target} (Original: ${jid})...`);
    try {
        const response = await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
            body: JSON.stringify({ number: target, text: mensaje })
        });
        const result = await response.json();
        console.log(`✅ Resultado WA:`, JSON.stringify(result));
        return result;
    } catch (e: any) {
        console.error(`❌ ERROR CRÍTICO al enviar WA: ${e.message}`);
        return { error: true, details: e.message };
    }
}

export async function procesarRespuesta(jid: string, texto: string, media: any = null, msgId: string | null = null) {
    if (!jid) return "Error JID";

    // 1. Cargar sesión desde Supabase
    let { data: sessionData } = await supabase
        .from('bot_sessions')
        .select('history')
        .eq('jid', jid)
        .maybeSingle();

    let history = sessionData?.history || [];

    // Deduplication check: Has this message already been replied to?
    if (msgId && history.some((h: any) => h.ref_id === msgId)) {
        console.log(`♻️ Ignorando mensaje ya procesado (Supabase Dedup): ${msgId}`);
        return "Mensaje ya procesado";
    }

    let resolvedText = texto || '';

    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor fiel de campo.");
        console.log(`🎙️ Campo: "${resolvedText}"`);
    } else if (media && media.type === 'image') {
        resolvedText = `[Imagen enviada]`;
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        // 1. Extracción de Keywords y asociación técnica
        const extractionPrompt = `HISTORIAL:\n${historyText}\n\n
    TAREA: Extrae los materiales o equipos mencionados. 
    1. Si usan jerga, busca su equivalente técnico (ej: "tabas" -> botin, calzado; "poncho" -> casaca, impermeable).
    2. Identifica tallas o medidas (ej: 42, XL, L, 3/4).
    3. Responde SOLO con una lista de palabras clave (técnicas y jerga) separadas por comas, sin tildes.`;

        let kwStr = await geminiChatMultimodal(extractionPrompt, (media?.type === 'image' ? media : null), "Intérprete experto en suministros de mina.");
        let keywords = kwStr.split(',').map((k: string) => normalizar(k)).filter((k: string) => k.length >= 2 && k !== 'charla');

        console.log(`🎯 Keywords para Búsqueda (V24.1): [${keywords.join(', ')}]`);

        let stockContext = '';
        if (keywords.length > 0) {
            let resultsMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase
                    .from('inventory')
                    .select('quantity, material:materials!inner(name, description, unit_of_measure), warehouse:warehouses(name)')
                    .or(`name.ilike.%${kw}%,description.ilike.%${kw}%`, { foreignTable: "materials" })
                    .limit(5);

                if (data) {
                    data.forEach((item: any) => {
                        const mat = item.material;
                        const wh = item.warehouse;
                        const key = `${mat?.name}-${wh?.name}`;
                        if (!resultsMap.has(key)) {
                            resultsMap.set(key, item);
                        }
                    });
                }
            }
            const results = Array.from(resultsMap.values());
            if (results.length > 0) {
                stockContext = `DATA REAL DEL INVENTARIO (Usa esta info): ${JSON.stringify(results)}`;
            } else {
                stockContext = "IMPORTANTE: No se encontraron coincidencias exactas en la base de datos de inventario para estas palabras clave.";
            }
        }

        // 2. Respuesta Final al Usuario
        const finalPrompt = `HISTORIAL:\n${historyText}\n\nCONTEXTO:\n${stockContext}\n
    TAREA: Responde al operario de MINA de forma profesional y clara.
    - Si hay stock: Confirma el material, cantidad y en qué almacén está.
    - Si NO hay stock: Indícalo amablemente y sugiere que consulte por un reemplazo o espere reabastecimiento.
    - REGLA DE ORO: Si encuentras tallas en el historial (ej: 42), prioriza mostrar materiales que coincidan con esa talla.
    - Estilo: Máximo 5 líneas. Usa negritas para nombres. Termina con un consejo de seguridad ⚠️.`;


        const respuesta = await geminiChatMultimodal(finalPrompt);

        // Log WA sending status in development/debug
        const waResult = await enviarWA(jid, respuesta);

        // Save bot response with ref_id for deduplication
        history.push({
            role: 'bot',
            content: respuesta,
            ref_id: msgId,
            wa_status: waResult?.status || waResult?.error || 'OK'
        });

        // 3. Guardar sesión actualizada en Supabase (Upsert)
        await supabase.from('bot_sessions').upsert({
            jid,
            history,
            updated_at: new Date().toISOString()
        }, { onConflict: 'jid' });

        return respuesta;


    } catch (e: any) {
        console.error(`❌ Error en V24: ${e.message}`);
        return `Error en V24.0. ¿Qué necesitas de almacén?`;
    }
}
