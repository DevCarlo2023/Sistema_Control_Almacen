import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function exportMovementsToPDF(
  movements: any[],
  warehouseName: string
) {
  try {
    const doc = new jsPDF();
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    const filenameDate = format(new Date(), 'dd-MM-yyyy');

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROMET INDUSTRIAL TECH', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('SISTEMA DE CONTROL DE ALMACÉN • ERP v1.0', 14, 28);
    
    doc.setDrawColor(0, 63, 209); // Primary color lines
    doc.setLineWidth(1);
    doc.line(14, 32, 196, 32);

    // --- Report Info ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`REPORTE DE MOVIMIENTOS: ${warehouseName.toUpperCase()}`, 14, 42);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`FECHA DE GENERACIÓN: ${timestamp}`, 14, 48);
    doc.text(`REGISTROS ENCONTRADOS: ${movements.length}`, 14, 53);

    // --- Table ---
    const tableData = movements.map((m, index) => [
      String(index + 1).padStart(2, '0'),
      format(new Date(m.created_at), 'dd/MM/yy HH:mm'),
      m.movement_type.toUpperCase(),
      m.materials?.name || 'N/A',
      m.quantity.toLocaleString('en-US', { minimumFractionDigits: 1 }),
      m.notes || '-'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['ID', 'FECHA', 'TIPO', 'MATERIAL', 'CANT.', 'NOTAS / REFERENCIA']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [26, 28, 30],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 50 },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 'auto' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'ENTRADA') {
            data.cell.styles.textColor = [34, 197, 94];
          } else if (data.cell.raw === 'SALIDA') {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      }
    });

    // --- Footer / Signatures ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    if (finalY < 250) {
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        
        // Lines
        doc.line(30, finalY, 80, finalY);
        doc.line(130, finalY, 180, finalY);
        
        doc.setFontSize(8);
        doc.text('ENTREGADO POR', 42, finalY + 5);
        doc.text('RECIBIDO POR', 145, finalY + 5);
    }

    // Save
    doc.save(`Historial_${warehouseName}_${filenameDate}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF del historial');
  }
}
