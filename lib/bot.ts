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

const SYSTEM_PROMPT = `# ROL
Eres **Almacén Virtual**, el experto en inventario de **INDUSTRIAS PROMET**. 
Gestionas materiales de MINA con precisión y seguridad.

# REGLAS
1. **DATA REAL**: Usa siempre los datos de stock encontrados en la DB.
2. **JERGA**: Traduce automáticamente (tabas->botines, gafas->lentes).
3. **SEGURIDAD**: Cada respuesta debe incluir un consejo de seguridad ⚠️ relacionado con el material.
4. **ESTILO**: Emojis, negritas y respuestas directas (máx 5 líneas).`;

function normalizar(texto: string) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Verified Model Fallback Chain for this account
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    const fallbackModels = [
        'gemini-flash-latest',      // Verified Working
        'gemini-pro-latest',       // Verified Working Fallback
        'gemini-2.0-flash-lite',   // Next-gen Lite
        'gemini-pro'               // Legacy
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
    return `Lo siento, hay una pequeña interrupción en el sistema de IA. ¿Qué necesitas consultar de Almacén? (Ref: ${lastError})`;
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
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor fiel.");
    } else if (media && media.type === 'image') {
        resolvedText = `[Imagen enviada]`;
    }

    history.push({ role: 'user', content: resolvedText, msg_id: msgId });
    if (history.length > 10) history.shift();
    const historyText = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');

    try {
        let kwStr = await geminiChatMultimodal(`Extrae materiales clave de:\n${historyText}\nResponde solo palabras separadas por comas. Traduce jerga como tabas->botin.`, null, "Analista de suministros.");
        let keywords = kwStr.split(',').map(k => normalizar(k)).filter(k => k.length >= 2);

        let stockContext = '';
        if (keywords.length > 0) {
            let resultsMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase.from('inventory').select('quantity, material:materials!inner(name), warehouse:warehouses(name)').or(`name.ilike.%${kw}%,description.ilike.%${kw}%`, { foreignTable: "materials" }).limit(5);
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

        const respuesta = await geminiChatMultimodal(`Responde al operario:\n${historyText}\n\nDATA:\n${stockContext}`, null, "Asistente Almacén Virtual.");
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
