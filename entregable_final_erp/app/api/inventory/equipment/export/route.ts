import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron IDs de equipos' }, { status: 400 })
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

    // Fetch equipment with warehouse join
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('*, warehouse:warehouses(*)')
      .in('id', ids)
      .order('name')

    if (error) throw error

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Catalogo_Equipos')

    // Define columns
    worksheet.columns = [
      { header: 'NÚMERO DE SERIE', key: 'serial_number', width: 25 },
      { header: 'NOMBRE DEL EQUIPO', key: 'name', width: 45 },
      { header: 'MARCA', key: 'brand', width: 20 },
      { header: 'MODELO', key: 'modelo', width: 20 },
      { header: 'CATEGORÍA', key: 'category', width: 20 },
      { header: 'ESTATUS', key: 'status', width: 15 },
      { header: 'INICIO CALIB.', key: 'cal_start', width: 20 },
      { header: 'VENC. CALIB.', key: 'cal_end', width: 20 },
      { header: 'FREQ. (MESES)', key: 'cal_freq', width: 15 },
      { header: 'VALORIZACIÓN (S/)', key: 'unit_price', width: 20 },
      { header: 'PROPIEDAD', key: 'ownership', width: 15 },
      { header: 'FECHA REGISTRO', key: 'created_at', width: 25 }
    ]

    // Add Rows
    equipment?.forEach((e: any) => {
      worksheet.addRow({
        serial_number: (e.serial_number || 'S/N').toUpperCase(),
        name: (e.name || '').toUpperCase(),
        brand: (e.brand || 'GENÉRICO').toUpperCase(),
        modelo: (e.model || 'N/A').toUpperCase(),
        category: (e.category || 'GENERAL').toUpperCase(),
        status: (e.status || 'OPERATIVO').toUpperCase(),
        cal_start: e.calibration_start ? new Date(e.calibration_start).toLocaleDateString('es-PE').toUpperCase() : '—',
        cal_end: e.calibration_end ? new Date(e.calibration_end).toLocaleDateString('es-PE').toUpperCase() : '—',
        cal_freq: e.calibration_frequency || '—',
        unit_price: e.unit_price ? Number(e.unit_price).toFixed(2) : '0.00',
        ownership: (e.ownership || 'PROPIO').toUpperCase(),
        created_at: new Date(e.created_at).toLocaleString('es-PE').toUpperCase()
      })
    })

    // Style Header Row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF083344' } // Cyan 950
      }
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 10
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Add borders and alternating row colors
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
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            }
          })
        }
      }
    })

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Catalogo_Equipos_Seleccionados_${timestamp}.xlsx`;

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
