import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const cookieStore = await cookies()

        // Regular client for user verification
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Service client for RLS bypass (Log deletion & Stock sync)
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
        )

        // 1. Get the movement details
        const { data: movement, error: moveError } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('id', id)
            .single()

        if (moveError || !movement) {
            return NextResponse.json({ error: 'Movimiento no encontrado.' }, { status: 404 })
        }

        // 2. Check for Correlation ID (Transfer)
        const trIdMatch = movement.notes?.match(/\[TR-ID: ([a-f0-9-]+)\]/)
        const correlationId = trIdMatch ? trIdMatch[1] : null

        let movementsToDelete = [movement]

        if (correlationId) {
            const { data: relatedMovements } = await supabase
                .from('inventory_movements')
                .select('*')
                .ilike('notes', `%[TR-ID: ${correlationId}]%`)

            if (relatedMovements && relatedMovements.length > 0) {
                movementsToDelete = relatedMovements
            }
        }

        const results = []

        // 3. Process each movement for rollback
        for (const m of movementsToDelete) {
            const { data: inventory } = await supabase
                .from('inventory')
                .select('*')
                .eq('warehouse_id', m.warehouse_id)
                .eq('material_id', m.material_id)
                .maybeSingle()

            if (inventory) {
                const type = m.movement_type.toLowerCase()
                const delta = type === 'entrada' ? -m.quantity : m.quantity
                const newQty = (inventory.quantity || 0) + delta

                if (newQty <= 0) {
                    await serviceSupabase.from('inventory').delete().eq('id', inventory.id)
                } else {
                    await serviceSupabase
                        .from('inventory')
                        .update({ quantity: newQty, updated_at: new Date().toISOString() })
                        .eq('id', inventory.id)
                }
            }

            // 5. Delete the movement record (Using Service Role to bypass RLS)
            const { data: deleted, error: delError } = await serviceSupabase
                .from('inventory_movements')
                .delete()
                .eq('id', m.id)
                .select()

            results.push({ id: m.id, success: !delError && deleted?.length > 0 })
        }

        const successCount = results.filter(r => r.success).length

        if (successCount === 0) {
            return NextResponse.json({
                error: 'No se pudo eliminar el registro de la base de datos.',
                results
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: correlationId
                ? `Traslado revertido por completo (${successCount} registros eliminados).`
                : 'Movimiento revertido y eliminado correctamente.',
            new_stock_affected: movementsToDelete.length
        })

    } catch (error: any) {
        console.error('Delete Movement API Error:', error)
        return NextResponse.json({ error: error.message || 'Error al revertir el movimiento' }, { status: 500 })
    }
}
