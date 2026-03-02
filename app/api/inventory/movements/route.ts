import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      warehouse_id,
      material_id,
      movement_type,
      quantity,
      notes,
    } = await request.json()

    // Validate inputs
    if (!warehouse_id || !material_id || !movement_type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Record the movement
    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        warehouse_id,
        material_id,
        movement_type,
        quantity: parseFloat(quantity),
        notes,
        user_id: user.id,
      })
      .select()

    if (movementError) {
      console.error('Movement error:', movementError)
      return NextResponse.json(
        { error: 'Failed to record movement' },
        { status: 500 }
      )
    }

    // Update inventory
    const { data: inventory, error: getError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('warehouse_id', warehouse_id)
      .eq('material_id', material_id)
      .single()

    if (getError && getError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new materials
      console.error('Get inventory error:', getError)
      return NextResponse.json(
        { error: 'Failed to fetch current inventory' },
        { status: 500 }
      )
    }

    const currentQuantity = inventory?.quantity || 0
    let newQuantity = currentQuantity

    if (movement_type === 'ENTRADA') {
      newQuantity += parseFloat(quantity)
    } else if (movement_type === 'SALIDA') {
      newQuantity -= parseFloat(quantity)
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: 'Insufficient inventory' },
          { status: 400 }
        )
      }
    }

    // Insert or update inventory
    const { error: inventoryError } = await supabase
      .from('inventory')
      .upsert(
        {
          warehouse_id,
          material_id,
          quantity: newQuantity,
        },
        { onConflict: 'warehouse_id,material_id' }
      )

    if (inventoryError) {
      console.error('Inventory update error:', inventoryError)
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      movement,
      newQuantity,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
