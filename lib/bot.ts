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

export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    const key = CONFIG.GEMINI_API_KEY;
    if (!key) return "Error: La API KEY está vacía en Vercel.";

    // Diagnostic: Try to list models first to see if API is even enabled
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const listR = await fetch(listUrl);
        const listData = await listR.json();
        if (listData.error) {
            return `❌ ERROR CRÍTICO API: ${listData.error.message} (${listData.error.status}). Por favor activa la 'Generative Language API' en tu consola de Google o verifica tu API Key.`;
        }
    } catch (e: any) { }

    const attempts = [
        ['gemini-1.5-flash', 'v1'],
        ['gemini-1.5-flash-latest', 'v1beta'],
        ['gemini-2.0-flash', 'v1beta'],
        ['gemini-pro', 'v1']
    ];

    let lastError = '';

    for (const [model, version] of attempts) {
        try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
            const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: (systemMsg || "Actúa como asistente de almacén.") + "\n\n" + prompt }] }]
                })
            });
            const data = await r.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
            if (data.error) lastError = `${data.error.message} (Status: ${data.error.status})`;
        } catch (e: any) {
            lastError = e.message;
        }
    }

    return `Error IA Persistente: ${lastError}. Carlo, verifica que el API de Gemini esté activado en MakerSuite/AI Studio.`;
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
        resolvedText = await geminiChatMultimodal("Transcribe esto a texto.", media, "Transcriptor.");
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        let kwStr = await geminiChatMultimodal(`Extrae palabras clave de:\n${historyText}\nResponde solo palabras separadas por comas.`, null, "Analista de inventario.");
        let keywords = kwStr.split(',').map(k => k.toLowerCase().trim()).filter(k => k.length > 2);

        let stockContext = '';
        if (keywords.length > 0) {
            const { data } = await supabase.from('inventory').select('quantity, material:materials!inner(name), warehouse:warehouses(name)').or(`name.ilike.%${keywords[0]}%`, { foreignTable: "materials" }).limit(5);
            if (data) stockContext = `STOCK: ${JSON.stringify(data)}`;
        }

        const respuesta = await geminiChatMultimodal(`Responde al usuario:\n${historyText}\n\nDATA:\n${stockContext}`, null, "Asistente de almacén PROMET.");
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) {
        return `Lo siento, hay un inconveniente técnico con el servidor de IA de Google.`;
    }
}
