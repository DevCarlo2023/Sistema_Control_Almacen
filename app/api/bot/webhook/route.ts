import { NextResponse } from 'next/server'
import { procesarRespuesta, enviarWA } from '@/lib/bot'

const CONFIG = {
    EVOLUTION_URL: process.env.EVOLUTION_URL || '',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
    INSTANCE_NAME: process.env.INSTANCE_NAME || 'carlo_bot_v2',
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log(`📩 Webhook recibido: ${body.event || 'Evento desconocido (formato raw)'}`);

        // Handle both webhookByEvents formats
        if (body.event && body.event.toLowerCase() !== 'messages.upsert') {
            return NextResponse.json({ status: 'ignored' });
        }

        const data = body.data?.messages?.[0] || body.data || body?.messages?.[0] || body;
        if (!data || data.key?.fromMe) {
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
            const respuesta = await procesarRespuesta(jid, texto, media);
            await enviarWA(jid, respuesta);
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
