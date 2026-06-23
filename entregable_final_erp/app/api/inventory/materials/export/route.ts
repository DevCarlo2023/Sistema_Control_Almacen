import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron IDs de materiales' }, { status: 400 })
    }

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Fetch materials from Supabase
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .in('id', ids)
      .order('name')

    if (error) throw error

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Catalogo')

    // Define columns
    worksheet.columns = [
      { header: 'CÓDIGO', key: 'codigo', width: 25 },
      { header: 'DESCRIPCIÓN TÉCNICA', key: 'name', width: 45 },
      { header: 'UNIDAD', key: 'unit', width: 15 },
      { header: 'PRECIO UNITARIO', key: 'price', width: 20 },
      { header: 'DETALLE', key: 'description', width: 40 }
    ]

    // Add Rows
    materials?.forEach((m: any) => {
      worksheet.addRow({
        codigo: m.codigo || 'S/C',
        name: (m.name || '').toUpperCase(),
        unit: (m.unit_of_measure || '').toUpperCase(),
        price: m.unit_price || 0,
        description: m.description || '—'
      })
    })

    // Style Header Row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF18181B' } // Zinc 900
      }
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 10
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          }
        })
      }
    })

    // Formatting Price column
    const priceCol = worksheet.getColumn('price')
    priceCol.numFmt = '"S/." #,##0.00'

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Catalogo_Seleccionado_${timestamp}.xlsx`;

    // Return the response with proper headers for file download
    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Export API Error:', error)
    return NextResponse.json({ error: error.message || 'Error al generar el Excel' }, { status: 500 })
  }
}
