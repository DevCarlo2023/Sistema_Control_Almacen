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
        const extractionPrompt = `Extrae materiales clave mencionados en el historial:\n${historyText}\n
        DICCIONARIO:
        - Tivex / Tibek / Tyvek
        - Taba / tabas / botines
        - Casco / Casco de Seguridad
        - Lentes / Lentes de Seguridad
        
        REGLAS:
        1. Responde SOLO con una lista de palabras clave NORMALIZADAS (mínimo 3 letras), separadas por comas. 
        2. Ej: "tyvek, lentes, casco".
        3. No inventes palabras.`;

        let kwStr = await geminiChatMultimodal(extractionPrompt, null, "Analista de inventario.");
        let keywords = kwStr.split(',').map(k => normalizar(k)).filter(k => k.length >= 3);

        let stockContext = '';
        if (keywords.length > 0) {
            let candidatesMap = new Map();
            for (const kw of keywords) {
                const { data } = await supabase
                    .from('inventory')
                    .select('quantity, material:materials!inner(name), warehouse:warehouses(name)')
                    .or(`name.ilike.%${kw}%,description.ilike.%${kw}%`, { foreignTable: "materials" })
                    .limit(15);

                if (data) {
                    data.forEach((item: any) => {
                        const key = `${item.material?.name}-${item.warehouse?.name}`;
                        if (!candidatesMap.has(key)) candidatesMap.set(key, item);
                    });
                }
            }
            const allCandidates = Array.from(candidatesMap.values());

            // 🛡️ AI PRE-FILTERING: Verificamos qué candidatos son realmente lo que el usuario pidió
            if (allCandidates.length > 0) {
                const filterPrompt = `El usuario preguntó: "${resolvedText}"\n\nLista de la Base de Datos:\n${JSON.stringify(allCandidates)}\n\nTarea: Filtra esta lista y quédate SOLO con los productos que el usuario REALMENTE está pidiendo. Elimina coincidencias parciales irrelevantes (ej: si pide casco, elimina casacas). Responde SOLO el JSON de los objetos filtrados.`;
                const filteredJson = await geminiChatMultimodal(filterPrompt, null, "Filtro de precisión de inventario.");

                try {
                    // Intentamos parsear el JSON filtrado
                    const match = filteredJson.match(/\[.*\]/s);
                    if (match) {
                        const validatedResults = JSON.parse(match[0]);
                        stockContext = `INVENTARIO REAL VALIDADO: ${JSON.stringify(validatedResults)}`;
                    } else {
                        // Fallback si no hay JSON
                        stockContext = `INVENTARIO REAL: ${JSON.stringify(allCandidates.slice(0, 5))}`;
                    }
                } catch (e) {
                    stockContext = `INVENTARIO REAL: ${JSON.stringify(allCandidates.slice(0, 5))}`;
                }
            }
        }

        const respuesta = await geminiChatMultimodal(`Mensaje del operario:\n${historyText}\n\n=== EPP ENCONTRADOS EN DB ===\n${stockContext}\n\nUsa EL MASTER PROMPT.`, null, MASTER_PROMPT);
        await enviarWA(jid, respuesta);
        history.push({ role: 'bot', content: respuesta, ref_id: msgId });
        await supabase.from('bot_sessions').upsert({ jid, history, updated_at: new Date().toISOString() }, { onConflict: 'jid' });
        return respuesta;
    } catch (e: any) { return `Error en el sistema. Intenta de nuevo.`; }
}
