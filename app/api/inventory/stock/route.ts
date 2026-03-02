import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const warehouseId = searchParams.get('warehouse_id')

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouse_id is required' },
        { status: 400 }
      )
    }

    const { data: stock, error } = await supabase
      .from('inventory')
      .select(
        `
        *,
        warehouse:warehouses(name),
        material:materials(name, unit_of_measure, description, location)
      `
      )
      .eq('warehouse_id', warehouseId)
      .order('material(name)')

    if (error) {
      console.error('Stock error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stock' },
        { status: 500 }
      )
    }

    return NextResponse.json(stock)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
