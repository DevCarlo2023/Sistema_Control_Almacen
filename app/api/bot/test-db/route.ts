import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { procesarRespuesta } from '@/lib/bot'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const testJid = searchParams.get('test_send')

    const CONFIG = {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        EVOLUTION_URL: process.env.EVOLUTION_URL || '',
        EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
        INSTANCE_NAME: process.env.INSTANCE_NAME || 'carlo_bot_v2',
    }

    try {
        const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY)

        // 1. Verificar Supabase
        const { data, error, count } = await supabase
            .from('bot_sessions')
            .select('jid, updated_at', { count: 'exact' })

        if (error) throw error

        let waResult = null
        let aiResult = null

        if (testJid) {
            if (searchParams.get('simulate_ai')) {
                console.log(`🧪 Simulando IA para ${testJid}...`)
                aiResult = await procesarRespuesta(testJid, "Hola, necesito botas talla 40")
                const response = await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
                    body: JSON.stringify({ number: testJid, text: `[TEST IA] ${aiResult}` })
                })
                waResult = { status: response.status, data: await response.json() }
            } else {
                console.log(`🧪 Enviando mensaje simple a ${testJid}...`)
                const response = await fetch(`${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.EVOLUTION_API_KEY },
                    body: JSON.stringify({ number: testJid, text: "Prueba de conexión desde Vercel (DIAGNOSTICO) 🟢" })
                })
                waResult = { status: response.status, data: await response.json() }
            }
        }

        return NextResponse.json({
            status: 'success',
            message: '🟢 Diagnóstico completado',
            supabase: { count, sessions: data },
            ai_test: aiResult,
            evolution: waResult
        })
    } catch (error: any) {
        console.error('Diagnostic error:', error)
        return NextResponse.json({
            status: 'error',
            message: '🔴 Error en el diagnóstico',
            details: error.message
        }, { status: 500 })
    }
}
