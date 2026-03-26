import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim(),
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim()
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)
const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY)

const SYSTEM_PROMPT = `# ROL Y ENTORNO
Eres **Almacén Virtual**, el asistente inteligente de **INDUSTRIAS PROMET**. 
Tu misión es gestionar el inventario y resolver dudas de materiales de MINA.

# REGLAS DE RESPUESTA
1. **Precisión**: Usa la DATA REAL DB para confirmar existencias.
2. **Jerga**: Traduce términos (tabas->botines, gafas->lentes) automáticamente.
3. **Seguridad**: Sugiere EPP si se menciona una tarea de riesgo.
4. **Estilo**: Emojis (📦, ⚠️) y negritas. Sé conciso (máx 5 líneas).`;

function normalizar(texto: string) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Robust Multi-Model Fallback System
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    const fallbackModels = [
        'gemini-2.5-flash',         // Next-Gen (Confirmed for this user)
        'gemini-2.0-flash',         // Standard Modern
        'gemini-flash-latest',      // Alias
        'gemini-1.5-flash-latest',  // Standard 1.5
        'gemini-pro'                // Legacy 1.0
    ];

    let lastError = '';
    for (const modelName of fallbackModels) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemMsg || SYSTEM_PROMPT
            });

            const parts: any[] = [{ text: prompt }];
            if (media && media.base64 && media.mimeType) {
                parts.push({
                    inlineData: { mimeType: media.mimeType, data: media.base64 }
                });
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
    return `Lo siento, hay un inconveniente temporal con la conexión. ¿Qué necesitas de almacén?`;
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

    let { data: sessionData } = await supabase.from('bot_sessions').select('history').eq('jid', jid).maybeSingle();
    let history = sessionData?.history || [];
    if (msgId && history.some((h: any) => h.ref_id === msgId)) return "Mensaje ya procesado";

    let resolvedText = texto || '';
    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor fiel.");
    } else if (media && media.type === 'image') {
        resolvedText = `[Imagen enviada]`;
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        const extractionPrompt = `Extrae materiales del historial:\n${historyText}\nResponde solo palabras separadas por comas. Traduce jerga.`;
        let kwStr = await geminiChatMultimodal(extractionPrompt, (media?.type === 'image' ? media : null), "Analista logístico.");
        let keywords = kwStr.split(',').map((k: string) => normalizar(k)).filter((k: string) => k.length >= 2);

        let stockContext = '';
        if (keywords.length > 0) {
            let resultsMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase
                    .from('inventory')
                    .select('quantity, material:materials!inner(name), warehouse:warehouses(name)')
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

        const finalPrompt = `Responde al operario de MINA:\n${historyText}\n\nDATA:\n${stockContext}\nUsa emojis y negritas. Máx 5 líneas.⚠️ Seguridad`;
        const respuesta = await geminiChatMultimodal(finalPrompt);

        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) {
        return `Uups, error en el sistema. Intenta de nuevo.`;
    }
}
