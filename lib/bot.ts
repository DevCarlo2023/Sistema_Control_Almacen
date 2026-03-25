import { createClient } from '@supabase/supabase-js'

const CONFIG = {
    SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    SUPABASE_SERVICE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    EVOLUTION_URL: (process.env.EVOLUTION_URL || '').trim(),
    EVOLUTION_API_KEY: (process.env.EVOLUTION_API_KEY || '').trim(),
    INSTANCE_NAME: (process.env.INSTANCE_NAME || 'carlo_bot_v2').trim(),
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
    GEMINI_MODEL: 'gemini-2.5-flash'
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `# ROL Y ENTORNO
Eres **Almacén Virtual**, el asistente inteligente de **INDUSTRIAS PROMET**. 
Tu misión es facilitar el acceso a materiales de **MINA** con eficiencia y calidez.

# REGLAS DE DISEÑO (AESTHETICS)
- **Estructura**: Usa viñetas (•) y negritas para resaltar lo importante.
- **Iconos**: Usa emojis para categorizar información (📦 Stock, 🛠️ Tarea, ⚠️ Seguridad).
- **Tono**: Profesional, experto y muy servicial.
- **Concisión**: Máximo 5-6 líneas bien organizadas.

# REGLAS DE LOGÍSTICA
- **Interpretación**: Traduce jerga ("tabas" -> botín, "poncho" -> casaca) sin corregir al usuario, solo confirmando con el término correcto.
- **Anticipación**: Si mencionan una tarea, sugiere el kit de seguridad relacionado.

# PRIORIDAD: Seguridad Mina ⚠️ (Cero Accidentes).`;


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
        // 1. Extracción con Asociación Humana
        const extractionPrompt = `HISTORIAL:\n${historyText}\n\n
    TAREA: Actúa como un experto de almacén que entiende la jerga del trabajador.
    - Si el trabajador usa palabras informales, tradúcelas a términos de inventario (ej: tabas -> botin, gafas -> lentes, trapo -> huaipe).
    - Si menciona una tarea (ej: "voy a pintar"), incluye los materiales lógicos para esa tarea.
    - Extrae tallas o números (40, 38, etc).
    - Responde SOLO una lista de palabras clave sin tildes separadas por comas.`;

        let kwStr = await geminiChatMultimodal(extractionPrompt, (media?.type === 'image' ? media : null), "Intérprete de jerga minera y logística.");
        let keywords = kwStr.split(',').map((k: string) => normalizar(k)).filter((k: string) => k.length >= 2 && k !== 'charla');

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
                    data.forEach((item: any) => {
                        const mat = Array.isArray(item.material) ? item.material[0] : item.material;
                        const wh = Array.isArray(item.warehouse) ? item.warehouse[0] : item.warehouse;
                        const key = `${mat?.name || 'Inom'}-${wh?.name || 'Gral'}`;
                        if (!resultsMap.has(key)) {
                            resultsMap.set(key, item);
                        }
                    });
                }
            }
            const results = Array.from(resultsMap.values());
            if (results.length > 0) {
                stockContext = `DATA REAL DB: ${JSON.stringify(results)}`;
            }
        }

        // 2. Respuesta Final
        const finalPrompt = `HISTORIAL:\n${historyText}\n\n${stockContext}\n
    TAREA: Genera una respuesta VISUALMENTE ATRACTIVA y ORDENADA.
    1. Confirma el pedido/jerga con un emoji amable.
    2. Si hay stock, lístalo usando: • *Material* | Qty: X | [Almacén]
    3. Si NO hay stock, ofrece una alternativa o un mensaje de apoyo.
    4. Cierra con una frase de Seguridad Mina corta y potente con el icono ⚠️.
    
    REGLA: Usa negritas para los nombres de materiales. Máximo 6 líneas.`;

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
