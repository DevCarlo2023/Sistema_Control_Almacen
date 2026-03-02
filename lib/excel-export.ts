import { type InventoryItem } from './types';

export async function exportToExcel(
  data: InventoryItem[],
  warehouseName: string,
  includeWarehouse: boolean = false
) {
  try {
    // Dynamic import of xlsx to avoid issues with SSR
    const XLSX = await import('xlsx');

    // Prepare data for export
    const exportData = data.map((item: any) => {
      const row: any = {};
      if (includeWarehouse) {
        row['Almacén'] = item.warehouses?.name || 'N/A';
      }
      row['Material'] = item.materials?.name || 'N/A';
      row['Descripción'] = item.materials?.description || '';
      row['Unidad de Medida'] = item.materials?.unit_of_measure || '';
      row['Ubicación'] = item.materials?.location || '';
      row['Estado'] = item.materials?.is_used ? 'USADO' : 'NUEVO';
      row['Cantidad'] = item.quantity;
      row['Precio Unitario'] = item.materials?.unit_price || 0;
      row['Valor Total'] = item.quantity * (item.materials?.unit_price || 0);
      row['Última Actualización'] = new Date(item.updated_at).toLocaleDateString('es-ES');
      return row;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    // Set column widths
    const columnWidths: any[] = [];
    if (includeWarehouse) columnWidths.push({ wch: 15 });
    columnWidths.push(
      { wch: 25 },  // Material
      { wch: 30 },  // Descripción
      { wch: 18 },  // Unidad de Medida
      { wch: 20 },  // Ubicación
      { wch: 12 },  // Cantidad
      { wch: 15 },  // Precio Unitario
      { wch: 15 },  // Valor Total
      { wch: 18 }   // Última Actualización
    );
    worksheet['!cols'] = columnWidths;

    // Add metadata
    const timestamp = new Date().toLocaleDateString('es-ES');
    const filename = `Inventario_${warehouseName}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Error al exportar el inventario a Excel');
  }
}
