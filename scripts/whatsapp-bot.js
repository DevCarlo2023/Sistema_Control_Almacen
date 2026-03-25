/**
 * CARLO-BOT V24.0 - ASOCIACIÓN HUMANA
 * Consultor de Almacén Inteligente (Gemini 2.5 + Supabase)
 * Feature: Interpretación de jerga de campo y asociación proactiva.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
    SUPABASE_URL: 'https://csmynzxymstfouivdsik.supabase.co',
    SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbXluenh5bXN0Zm91aXZkc2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk0MzM5OCwiZXhwIjoyMDg3NTE5Mzk4fQ.BeGva6qWk9zQNFDfa_Qz2POJrXxq-pe_sexAMhm89rU',
    EVOLUTION_URL: 'https://evolution-evolution-api.oesm5z.easypanel.host',
    EVOLUTION_API_KEY: '429683C4C977415CAAFCCE10F7D57E11',
    INSTANCE_NAME: 'carlo_bot_v2',
    PORT: 3001,
    GEMINI_API_KEY: 'AIzaSyDiGfC0Ytpb51-Jl_6eQcH_2w6SSY_Qjd0',
    GEMINI_MODEL: 'gemini-2.5-flash'
};

const app = express({ limit: '50mb' });
app.use(express.json());

// Verificación de Node.js (V24.1)
if (typeof fetch === 'undefined') {
    console.log("❌ ERROR: Tu versión de Node.js es antigua y no tiene 'fetch'.");
    console.log("👉 Solución: Actualiza Node.js a la versión 18 o superior, o instala 'node-fetch'.");
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
const SESSIONS = {};

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const SYSTEM_PROMPT = `# ROL Y ENTORNO
Eres **Almacén Virtual**, el "traductor" entre el trabajador de campo y el sistema de inventario en **MINA**. 
Tu prioridad es entender lo que el trabajador *quiere decir*, no solo lo que dice.

# REGLAS DE ORO
- **Interpretación de Jerga**: Si dicen "tabas" o "pisantes" -> busca "botin". Si dicen "gafas" o "lunas" -> busca "lentes". Si dicen "poncho" -> busca "casaca" o "overol".
- **Asociación Proactiva**: Si un trabajador dice "voy a soldar", asume que necesita "mascara", "guantes de cuero", "delantal".
- **Estilo**: Ultra-conciso (4 líneas). Directo. Humano. No repitas saludos. 

# PRIORIDAD: Cero Observaciones.`;

async function geminiChatMultimodal(prompt, media = null, systemMsg = null) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
        let contents = [{ role: 'user', parts: [{ text: prompt }] }];
        if (media && media.base64 && media.mimeType) {
            contents[0].parts.push({ inline_data: { mime_type: media.mimeType, data: media.base64 } });
        }
        const body = {
            system_instruction: { parts: [{ text: systemMsg || SYSTEM_PROMPT }] },
            contents: contents
        };
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json();
        return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').replace(/thought:[\s\S]*?(\n|$)/gi, '').trim();
    } catch (e) { return `Error IA.`; }
}

async function enviarWA(jid, mensaje) {
    if (!jid) return;
    console.log(`📤 Enviando respuesta a ${jid}...`);
    try {
        const response = await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
            body: JSON.stringify({ number: jid, text: mensaje })
        });
        const result = await response.json();
        console.log(`✅ Resultado WA:`, JSON.stringify(result));
    } catch (e) {
        console.error(`❌ ERROR CRÍTICO al enviar WA: ${e.message}`);
    }
}

async function procesarRespuesta(jid, texto, media = null) {
    if (!jid) return "Error JID";

    // 1. Cargar sesión desde Supabase
    let { data: sessionData, error: sessionFetchError } = await supabase
        .from('bot_sessions')
        .select('history')
        .eq('jid', jid)
        .maybeSingle();

    let history = sessionData?.history || [];
    let resolvedText = texto || '';

    if (media && media.type === 'audio') {
        resolvedText = await geminiChatMultimodal("Escribe SOLO el texto de lo que oigas.", media, "Transcriptor fiel de campo.");
        console.log(`🎙️ Campo: "${resolvedText}"`);
    } else if (media && media.type === 'image') {
        resolvedText = `[Imagen enviada]`;
    }

    history.push({ role: 'user', content: resolvedText });
    if (history.length > 8) history.shift();
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');

    try {
        // 1. Extracción con Asociación Humana
        const extractionPrompt = `HISTORIAL:\n${historyText}\n\n
        TAREA: Actúa como un experto de almacén que entiende la jerga del trabajador.
        - Si el trabajador usa palabras informales, tradúcelas a términos de inventario (ej: tabas -> botin, gafas -> lentes, trapo -> huaipe).
        - Si menciona una tarea (ej: "voy a pintar"), incluye los materiales lógicos para esa tarea.
        - Extrae tallas o números (40, 38, etc).
        - Responde SOLO una lista de palabras clave sin tildes separadas por comas.`;

        let kwStr = await geminiChatMultimodal(extractionPrompt, (media?.type === 'image' ? media : null), "Intérprete de jerga minera y logística.");
        let keywords = kwStr.split(',').map(k => normalizar(k)).filter(k => k.length >= 2 && k !== 'charla');

        console.log(`🎯 Keywords Asociativas (V24): [${keywords.join(', ')}]`);

        let stockContext = '';
        if (keywords.length > 0) {
            let resultsMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase
                    .from('inventory')
                    .select('quantity, material:materials!inner(name, description, unit_of_measure), warehouse:warehouses(name)')
                    .or(`name.ilike.%${kw}%,description.ilike.%${kw}%`, { foreignTable: "materials" })
                    .limit(10);

                if (data) {
                    data.forEach(item => {
                        const key = `${item.material.name}-${item.warehouse?.name || 'Gral'}`;
                        if (!resultsMap.has(key)) {
                            resultsMap.set(key, item);
                        }
                    });
                }
            }
            const results = Array.from(resultsMap.values());
            if (results.length > 0) {
                console.log(`📦 STOCK DEDUPLICADO (Raw): ${JSON.stringify(results)}`);
                stockContext = `DATA REAL DB: ${JSON.stringify(results)}`;
            }
        }

        // 2. Respuesta Final
        const finalPrompt = `HISTORIAL:\n${historyText}\n\n${stockContext}\n
        TAREA: Responde con empatía y rapidez (máx 4 líneas). 
        Confirma que entiendes lo que necesita (aunque use jerga).
        Si encontraste stock, da los números. Si no, sugiere lo más parecido.
        Menciona siempre Seguridad Mina (⚠️).`;

        const respuesta = await geminiChatMultimodal(finalPrompt);
        history.push({ role: 'bot', content: respuesta });

        // 3. Guardar sesión actualizada en Supabase (Upsert)
        await supabase.from('bot_sessions').upsert({
            jid,
            history,
            updated_at: new Date().toISOString()
        }, { onConflict: 'jid' });

        return respuesta;

    } catch (e) {
        console.error(`❌ Error en V24: ${e.message}`);
        return `Error en V24.0. ¿Qué necesitas de almacén?`;
    }
}

app.post('/webhook', async (req, res) => {
    res.sendStatus(200);
    const body = req.body;
    console.log(`📩 Webhook recibido: ${body.event || 'Evento desconocido'}`);

    if (body.event?.toLowerCase() !== 'messages.upsert') return;
    const data = body.data?.messages?.[0] || body.data;
    if (!data || data.key?.fromMe) return;

    const jid = data.key?.remoteJid;
    let texto = data.message?.conversation || data.message?.extendedTextMessage?.text;
    console.log(`💬 Mensaje de ${jid}: ${texto || '[Sin texto]'}`);

    let media = null;
    let base64Found = data.base64 || body.data?.base64 || body.base64;

    if (!base64Found && (data.message?.audioMessage || data.message?.imageMessage)) {
        console.log(`📷/🎙️ Media detectado, intentando descargar...`);
        try {
            const resMedia = await fetch(`${CONFIG.EVOLUTION_URL}/chat/getBase64FromMediaMessage/${CONFIG.INSTANCE_NAME}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
                body: JSON.stringify({ message: { key: data.key } })
            });
            const mediaData = await resMedia.json();
            base64Found = mediaData.base64;
        } catch (err) {
            console.error(`❌ Error al descargar media: ${err.message}`);
        }
    }

    if (data.message?.audioMessage) {
        media = { type: 'audio', mimeType: 'audio/ogg; codecs=opus', base64: base64Found };
    } else if (data.message?.imageMessage) {
        media = { type: 'image', mimeType: 'image/jpeg', base64: base64Found };
    }

    if (jid && (texto || media)) {
        try {
            console.log(`🤖 Procesando respuesta para ${jid}...`);
            const respuesta = await procesarRespuesta(jid, texto, media);
            console.log(`✨ Respuesta generada: ${respuesta.substring(0, 50)}...`);
            await enviarWA(jid, respuesta);
        } catch (err) {
            console.error(`❌ ERROR en el flujo del bot:`, err);
        }
    }
});

// Endpoint de prueba rápida
app.get('/test-db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('bot_sessions').select('count');
        if (error) throw error;
        res.send(`🟢 Conexión a Supabase OK. Registros: ${JSON.stringify(data)}`);
    } catch (e) {
        res.status(500).send(`🔴 Error Supabase: ${e.message}`);
    }
});

app.get('/health', (req, res) => res.send('🟢 Almacén Virtual V24.0 - Asociación Humana Active'));

app.listen(CONFIG.PORT, () => {
    console.log(`\n🚀 BOT INICIADO CORRECTAMENTE`);
    console.log(`📍 Puerto: ${CONFIG.PORT}`);
    console.log(`🔗 URL Supabase: ${CONFIG.SUPABASE_URL}`);
    console.log(`📱 Instancia WA: ${CONFIG.INSTANCE_NAME}`);
    console.log(`-------------------------------------------\n`);
});
