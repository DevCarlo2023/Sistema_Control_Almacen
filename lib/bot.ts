import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

const MASTER_PROMPT = `Eres un asistente experto en gestión de inventario de EPP (Equipos de Protección Personal) para el sector minero e industrial de PROMET.

════════════════════════════════════════
🧠 PASO 1 — CLASIFICAR LA INTENCIÓN
════════════════════════════════════════
Antes de responder, identifica QUÉ quiere el usuario usando la DATA de inventario provista:
- Por nombre/jerga: Buscar por nombre en DATA.
- Por cantidad/stock: Mostrar cantidad en DATA.
- Múltiples productos: Procesar cada uno por separado en bloques.
- Ambigua: Preguntar tipo antes de buscar.

════════════════════════════════════════
💡 PASO 2 — SUGERENCIAS PROACTIVAS
════════════════════════════════════════
Cuando el usuario consulte un EPP, revisa si hay complementarios y ofrécelos:
- Tyvek → sugerir Respirador + Guante de Nitrilo + Botas (kit completo)
- Arnés → sugerir Línea de Vida + Casco
- Respirador → preguntar si necesita filtros de repuesto
- Casco → ofrecer barbiquejo o adaptador de audífono
- Botín → ofrecer plantillas de repuesto

════════════════════════════════════════
📋 PASO 3 — FORMATO DE RESPUESTA
════════════════════════════════════════

✅ PRODUCTO ENCONTRADO (Si está en la DATA extraída):
──────────────────────────────
🏷️ Producto : [Nombre oficial]
📦 Stock    : [X unidades / pares]
📍 Almacén  : [Nombre del Almacén]
[⚠️ Stock bajo — considera reabastecer] ← solo si cantidad ≤ 5
──────────────────────────────
💡 Sugerencia: [complementario si aplica]

❌ SIN STOCK o NO ENCONTRADO EN LA DATA:
──────────────────────────────
❌ Sin stock de [producto]
💡 Alternativa disponible: [producto similar si aplica] — ¿Te sirve?

════════════════════════════════════════
🚫 RESTRICCIONES
════════════════════════════════════════
- Nunca inventes stock, precios ni datos. Usa SOLO la "DATA" provista en el prompt actual.
- Responde siempre directo y con los formatos de iconos y viñetas indicados.`;

/**
 * Robust Chat 
 */
export async function geminiChatMultimodal(prompt: string, media: any = null, systemMsg: string | null = null) {
    // 🛡️ SECURITY: Only use Vercel Environment variables. Never hardcode keys in the repository.
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
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemMsg || MASTER_PROMPT
            });

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
        const extractionPrompt = `Extrae los materiales o equipos mencionados en el historial:\n${historyText}\n
        DICCIONARIO DE NORMALIZACIÓN (Usa estrictamente las conversiones del lado derecho):
        - Tivex / Tibek / Tybek / Tyveks / Tyvexs → Tyvek
        - Overall / overol / overoles / mameluco / mamelucos → Mameluco
        - Chaleco / chalecos / pechera / pecheras → Chaleco Reflectivo
        - Taba / tabas / zapato / zapatos / bota / botas / botines → Botín de Seguridad
        - Casco / cascos / yep / yepo / yeps → Casco de Seguridad
        - Lente / lentes / google / googles / goggle / goggles / lunar / lunares → Lentes de Seguridad
        - Careta / caretas → Careta Facial
        - Mascarilla / mascarillas / nariguera / narigueras / respiradores → Respirador
        - Filtro / filtros → Filtro para Respirador
        - Guante de hilo / guantes de hilo → Guante de Algodón
        - Guante negro / guantes negros / guante látex → Guante de Nitrilo
        - Arnes / arneses / soga / sogas / línea de vida → Arnés de Seguridad
        - Tallas: CH/chico/chica → S | M/mediano → M | G/grande → L | XG/extragrande → XL | XXL → XXL
        
        REGLAS CRÍTICAS:
        1. Responde SOLO con una lista de palabras clave NORMALIZADAS, separadas por comas. Cero explicaciones.`;

        let kwStr = await geminiChatMultimodal(extractionPrompt, null, "Experto analista de inventario industrial.");
        let keywords = kwStr.split(',').map(k => normalizar(k)).filter(k => k.length >= 2);

        let stockContext = '';
        if (keywords.length > 0) {
            let resultsMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase
                    .from('inventory')
                    .select('quantity, material:materials!inner(name), warehouse:warehouses(name)')
                    .or(`name.ilike.%${kw}%,description.ilike.%${kw}%`, { foreignTable: "materials" })
                    .limit(10);

                if (data) {
                    data.forEach((item: any) => {
                        const key = `${item.material?.name}-${item.warehouse?.name}`;
                        if (!resultsMap.has(key)) resultsMap.set(key, item);
                    });
                }
            }
            const results = Array.from(resultsMap.values());
            if (results.length > 0) stockContext = `INVENTARIO REAL (Stock actual en DB): ${JSON.stringify(results)}`;
        }

        const respuesta = await geminiChatMultimodal(`Mensaje del operario:\n${historyText}\n\n=== EPP ENCONTRADOS EN DB ===\n${stockContext}\n\nUsa LA ESTRUCTURA DEL MASTER PROMPT. No menciones que es un sistema automatizado.`, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
