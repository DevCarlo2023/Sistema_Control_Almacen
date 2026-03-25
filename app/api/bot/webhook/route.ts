import { NextResponse } from 'next/server'
import { procesarRespuesta } from '@/lib/bot'

const CONFIG = {
    EVOLUTION_URL: process.env.EVOLUTION_URL || '',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
    INSTANCE_NAME: process.env.INSTANCE_NAME || 'carlo_bot_v2',
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        let body;

        try {
            // 1. Try to parse as JSON first
            body = JSON.parse(rawBody);
        } catch (e) {
            // 2. If it fails, maybe it's Base64 (Evolution API webhookBase64: true)
            try {
                const decoded = Buffer.from(rawBody, 'base64').toString('utf-8');
                body = JSON.parse(decoded);
                console.log(`🔓 Base64 Decoded Webhook`);
            } catch (err) {
                console.error(`❌ Webhook payload non-JSON and non-Base64: ${rawBody.substring(0, 100)}`);
                return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
            }
        }

        console.log(`📩 Webhook recibido: ${body.event || 'Evento desconocido (formato raw)'}`);

        // Handle both webhookByEvents formats
        if (body.event && body.event.toLowerCase() !== 'messages.upsert') {
            return NextResponse.json({ status: 'ignored' });
        }

        let data;
        if (Array.isArray(body)) {
            data = body[0];
        } else if (body.data?.messages) {
            data = body.data.messages[0];
        } else if (body.messages) {
            data = body.messages[0];
        } else {
            data = body.data || body;
        }

        const msgId = data?.key?.id;
        if (!data || data.key?.fromMe || !msgId) {
            return NextResponse.json({ status: 'ignored' });
        }

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
            } catch (err: any) {
                console.error(`❌ Error al descargar media: ${err.message}`);
            }
        }

        if (data.message?.audioMessage) {
            media = { type: 'audio', mimeType: 'audio/ogg; codecs=opus', base64: base64Found };
        } else if (data.message?.imageMessage) {
            media = { type: 'image', mimeType: 'image/jpeg', base64: base64Found };
        }

        if (jid && (texto || media)) {
            console.log(`🤖 Procesando respuesta para ${jid}...`);
            const respuesta = await procesarRespuesta(jid, texto, media, msgId);
            return NextResponse.json({ status: 'success', sent_to: jid, result: respuesta });
        }

        return NextResponse.json({ status: 'ignored', data_dump: JSON.stringify(data).substring(0, 100) });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
