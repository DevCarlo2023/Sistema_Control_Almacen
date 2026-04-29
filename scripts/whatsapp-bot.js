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
    GEMINI_MODEL: 'gemini-1.5-flash-latest'
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

async function procesarRespuesta(jid, texto, media = null, msgId = null) {
    if (!jid) return "Error JID";

    // 1. Cargar sesión desde Supabase
    let { data: sessionData, error: sessionFetchError } = await supabase
        .from('bot_sessions')
        .select('history')
        .eq('jid', jid)
        .maybeSingle();

    let history = sessionData?.history || [];

    // Prevención de duplicados por msgId
    if (msgId && history.some(h => h.msg_id === msgId || h.ref_id === msgId)) {
        console.log(`⚠️ Mensaje ${msgId} ya procesado, ignorando.`);
        return "Mensaje ya procesado";
    }

    // --- FILTRO DE SALUDOS ---
    const rawText = (texto || '').trim().toLowerCase();
    const greetingPattern = /^(hola|buenos?\s+d[ií]as?|buenas?\s+tardes?|buenas?\s+noches?)[.!?]*$/i;
    
    if (greetingPattern.test(rawText)) {
        const staticGreeting = "🚀 BOT ACTUALIZADO V24.1 🚀 ¿En qué puedo ayudarte hoy?";
        history.push({ role: 'user', content: rawText, msg_id: msgId });
        history.push({ role: 'bot', content: staticGreeting, ref_id: msgId });
        if (history.length > 6) history.shift();
        
        await Promise.all([
            enviarWA(jid, staticGreeting),
            supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' })
        ]);
        return staticGreeting;
    }
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
        let equipmentContext = '';

        if (keywords.length > 0) {
            let invMap = new Map();
            let eqMap = new Map();

            for (const kw of keywords) {
                // --- BUSQUEDA MATERIALES ---
                const { data: mats } = await supabase
                    .from('materials')
                    .select('id, name, description, codigo')
                    .or(`name.ilike.%${kw}%,description.ilike.%${kw}%,codigo.ilike.%${kw}%`)
                    .limit(10);

                if (mats && mats.length > 0) {
                    const mid = mats.map(m => m.id);
                    const [{ data: stocks }, { data: lastMovs }] = await Promise.all([
                        supabase.from('inventory').select('quantity, material:materials(id, name, description, codigo), warehouse:warehouses(name)').in('material_id', mid).gt('quantity', 0),
                        supabase.from('inventory_movements').select('movement_type, quantity, created_at, material_id').in('material_id', mid).order('created_at', { ascending: false }).limit(3)
                    ]);

                    stocks?.forEach(s => {
                        const m_id = s.material?.id;
                        const m_last = lastMovs?.filter(lm => lm.material_id === m_id) || [];
                        const key = `${s.material?.name}-${s.warehouse?.name}`;
                        invMap.set(key, { ...s, last_movements: m_last });
                    });
                }

                // --- BUSQUEDA EQUIPOS ---
                const { data: equips } = await supabase
                    .from('equipment')
                    .select('*, warehouse:warehouses(name)')
                    .or(`name.ilike.%${kw}%,model.ilike.%${kw}%,serial_number.ilike.%${kw}%,brand.ilike.%${kw}%`)
                    .limit(5);

                if (equips && equips.length > 0) {
                    for (const eq of equips) {
                        const { data: movs } = await supabase.from('equipment_movements').select('movement_type, created_at, worker:workers(full_name)').eq('equipment_id', eq.id).order('created_at', { ascending: false }).limit(1);
                        let last_action = 'Sin actividad';
                        let last_worker = 'N/A';
                        if (movs && movs.length > 0) {
                            const date = new Date(movs[0].created_at).toLocaleDateString('es-PE');
                            last_action = `${movs[0].movement_type === 'egreso' ? 'Retirado' : 'Devuelto'} el ${date}`;
                            last_worker = movs[0].worker?.full_name || 'N/A';
                        }
                        const calStatus = eq.calibration_end ? (new Date(eq.calibration_end) > new Date() ? 'VIGENTE' : 'VENCIDA') : 'No requiere';
                        eqMap.set(eq.id, { ...eq, last_worker, last_action, calStatus });
                    }
                }
            }

            const formattedInv = Array.from(invMap.values()).map(s => {
                const desc = s.material?.description ? ` - ${s.material.description}` : '';
                const code = s.material?.codigo || s.material?.id;
                let movInfo = '';
                if (s.last_movements && s.last_movements.length > 0) {
                    const last = s.last_movements[0];
                    const date = new Date(last.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
                    movInfo = `\n⏱️ Últ. mov: ${last.movement_type === 'ingreso' ? '📥 Ingreso' : '📤 Salida'} (${date})`;
                }
                return `✅ ${s.material?.name}${desc} (Cód: ${code})\n📦 Stock: ${s.quantity} | 📍 ${s.warehouse?.name}${movInfo}`;
            }).join('\n\n');

            if (formattedInv) stockContext = `MATERIALES:\n${formattedInv}`;

            const formattedEq = Array.from(eqMap.values()).map(e => {
                return `🔧 ${e.name} (${e.brand} ${e.model})\n📌 S/N: ${e.serial_number} | Estado: ${e.status}\n👤 Resp: ${e.last_worker}\n⏱️ ${e.last_action}\n🗓️ Calibración: ${e.calStatus}`;
            }).join('\n\n');

            if (formattedEq) equipmentContext = `EQUIPOS:\n${formattedEq}`;
        }

        // 2. Respuesta Final
        const finalPrompt = `HISTORIAL:\n${historyText}\n\n=== DATA DB ===\n${stockContext || 'NO HAY MATERIALES'}\n${equipmentContext || 'NO HAY EQUIPOS'}\n
        TAREA: Responde con empatía y rapidez (máx 4 líneas). 
        Usa la DATA de arriba para responder. Si no hay data para lo pedido, di que no encontraste stock.
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
            const msgId = data.key?.id;
            console.log(`🤖 Procesando respuesta para ${jid}...`);
            const respuesta = await procesarRespuesta(jid, texto, media, msgId);
            console.log(`✨ Respuesta generada: ${respuesta.substring(0, 50)}...`);
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
