import { createClient } from '@supabase/supabase-js'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim(),
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim()
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `Eres Almacén Virtual de INDUSTRIAS PROMET. Tu misión es gestionar el inventario de MINA.
- Traduce jerga (tabas->botines).
- Responde con stock real de la DB.
- Sé conciso y usa emojis.`;

function normalizar(texto: string) {
    if (!texto) return '';
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Brute force attempt to find a working Gemini endpoint and model
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    const key = CONFIG.GEMINI_API_KEY;
    if (!key) return "Error: No hay API Key configurada.";

    // Combinations to try: [Model, Version]
    const attempts = [
        ['gemini-1.5-flash', 'v1'],
        ['gemini-1.5-flash-latest', 'v1beta'],
        ['gemini-2.0-flash', 'v1beta'],
        ['gemini-1.5-flash', 'v1beta'],
        ['gemini-pro', 'v1']
    ];

    let lastError = '';

    for (const [model, version] of attempts) {
        try {
            console.log(`🔍 Intentando ${model} en ${version}...`);
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;

            const payload = {
                contents: [{
                    parts: [
                        { text: (systemMsg || SYSTEM_PROMPT) + "\n\nMENSAJE USUARIO: " + prompt }
                    ]
                }]
            };

            if (media && media.base64 && media.mimeType) {
                payload.contents[0].parts.push({
                    inlineData: { mimeType: media.mimeType, data: media.base64 }
                } as any);
            }

            const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await r.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                console.log(`✅ Éxito con ${model} (${version})`);
                return data.candidates[0].content.parts[0].text.trim();
            }

            if (data.error) {
                console.warn(`⚠️ Fallo ${model} (${version}): ${data.error.message}`);
                lastError = data.error.message;
            } else {
                console.warn(`⚠️ Respuesta inesperada de ${model}: ${JSON.stringify(data)}`);
            }
        } catch (e: any) {
            lastError = e.message;
        }
    }

    return `Error IA Persistente. El sistema no encuentra modelos disponibles para tu cuenta. (E: ${lastError})`;
}

export async function enviarWA(jid: string, mensaje: string) {
    if (!jid) return;
    const isGroup = jid.includes('@g.us');
    const isLid = jid.includes('@lid');
    const target = (isGroup || isLid) ? jid : jid.split('@')[0];

    try {
        const response = await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
            body: JSON.stringify({ number: target, text: mensaje })
        });
        return await response.json();
    } catch (e: any) {
        return { error: true, details: e.message };
    }
}

export async function procesarRespuesta(jid: string, texto: string, media: any = null, msgId: string | null = null) {
    if (!jid) return "Error JID";

    let { data: sessionData } = await supabase
        .from('bot_sessions')
        .select('history')
        .eq('jid', jid)
        .maybeSingle();

    let history = sessionData?.history || [];
    if (msgId && history.some((h: any) => h.ref_id === msgId)) return "Mensaje ya procesado";

    let resolvedText = texto || '';
    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor fiel.");
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        const extractionPrompt = `Extrae materiales/keywords del historial:\n${historyText}\nResponde SOLO palabras separadas por comas.`;
        let kwStr = await geminiChatMultimodal(extractionPrompt, (media?.type === 'image' ? media : null), "Experto en almacén.");
        let keywords = kwStr.split(',').map((k: string) => normalizar(k)).filter((k: string) => k.length >= 2);

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
                        const key = `${item.material?.name}-${item.warehouse?.name}`;
                        if (!resultsMap.has(key)) resultsMap.set(key, item);
                    });
                }
            }
            const results = Array.from(resultsMap.values());
            if (results.length > 0) stockContext = `INVENTARIO REAL: ${JSON.stringify(results)}`;
        }

        const finalPrompt = `Responde al operario:\n${historyText}\n\nCONTEXTO:\n${stockContext}\nUsa emojis y negritas. Indica almacén. Máx 5 líneas.`;
        const respuesta = await geminiChatMultimodal(finalPrompt);

        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });

        return respuesta;
    } catch (e: any) {
        console.error(`❌ Error Bot: ${e.message}`);
        return `Error de conexión. Intenta de nuevo.`;
    }
}
