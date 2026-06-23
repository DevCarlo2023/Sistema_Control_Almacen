import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
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

        const {
            from_warehouse_id,
            to_warehouse_id,
            material_id,
            quantity,
            notes
        } = await request.json()

        if (!from_warehouse_id || !to_warehouse_id || !material_id || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (from_warehouse_id === to_warehouse_id) {
            return NextResponse.json({ error: 'Source and destination must be different' }, { status: 400 })
        }

        const qtyNum = parseFloat(quantity)

        // 1. Check Source Balance
        const { data: sourceInv, error: sourceError } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('warehouse_id', from_warehouse_id)
            .eq('material_id', material_id)
            .single()

        if (sourceError || (sourceInv?.quantity || 0) < qtyNum) {
            return NextResponse.json({ error: 'Insufficient stock in source warehouse' }, { status: 400 })
        }

        // 2. Perform Transfer (Sequential)
        // Note: In a production environment with high concurrency, use a RPC/Stored Procedure for Atomicity.

        // A. Deduct from Source
        const { error: deductError } = await supabase
            .from('inventory')
            .update({ quantity: sourceInv.quantity - qtyNum })
            .eq('warehouse_id', from_warehouse_id)
            .eq('material_id', material_id)

        if (deductError) throw deductError

        // B. Add to Destination
        const { data: destInv } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('warehouse_id', to_warehouse_id)
            .eq('material_id', material_id)
            .maybeSingle()

        const newDestQty = (destInv?.quantity || 0) + qtyNum
        const { error: addError } = await supabase
            .from('inventory')
            .upsert({
                warehouse_id: to_warehouse_id,
                material_id,
                quantity: newDestQty
            }, { onConflict: 'warehouse_id,material_id' })

        if (addError) throw addError

        // 3. Get Warehouse Names for better logging
        const { data: wNames } = await supabase
            .from('warehouses')
            .select('id, name')
            .in('id', [from_warehouse_id, to_warehouse_id])

        const fromName = wNames?.find(w => w.id === from_warehouse_id)?.name || 'Origen'
        const toName = wNames?.find(w => w.id === to_warehouse_id)?.name || 'Destino'

        const transferId = randomUUID()
        const transferNotes = notes ? `${notes}` : 'TRASLADO ENTRE ALMACENES'

        await supabase.from('inventory_movements').insert([
            {
                warehouse_id: from_warehouse_id,
                material_id,
                movement_type: 'salida',
                quantity: qtyNum,
                notes: `TRASLADO: ${transferNotes} (Hacia: ${toName}) [TR-ID: ${transferId}]`,
                user_id: user.id
            },
            {
                warehouse_id: to_warehouse_id,
                material_id,
                movement_type: 'entrada',
                quantity: qtyNum,
                notes: `TRASLADO: ${transferNotes} (Desde: ${fromName}) [TR-ID: ${transferId}]`,
                user_id: user.id
            }
        ])

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Transfer API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
