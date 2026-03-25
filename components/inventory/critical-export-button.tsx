'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getStockThreshold } from '@/lib/utils';
import { toast } from 'sonner';

interface CriticalExportButtonProps {
    warehouseId: string;
    warehouseName: string;
}

export function CriticalExportButton({ warehouseId, warehouseName }: CriticalExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (!warehouseId) {
            toast.error('Por favor selecciona un almacén');
            return;
        }

        setLoading(true);

        try {
            // Fetch current inventory with material details
            const { data, error: fetchError } = await supabase
                .from('inventory')
                .select(
                    `
          id,
          warehouse_id,
          material_id,
          quantity,
          updated_at,
          materials (*),
          warehouses (name)
        `
                )
                .eq('warehouse_id', warehouseId);

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                toast.error('No hay datos en este almacén');
                setLoading(false);
                return;
            }

            // Filter for low and critical stock
            const criticalData = data.filter((item: any) => {
                const mat = item.materials;
                const threshold = getStockThreshold(`${mat?.name || ''} ${mat?.description || ''}`);
                return item.quantity < threshold * 2; // Low or Critical
            }).map((item: any) => {
                const mat = item.materials;
                const threshold = getStockThreshold(`${mat?.name || ''} ${mat?.description || ''}`);
                const isCritical = item.quantity < threshold;

                return {
                    ...item,
                    status: isCritical ? 'CRÍTICO' : 'BAJO',
                    threshold: threshold
                };
            });

            if (criticalData.length === 0) {
                toast.info('No hay materiales con stock bajo o crítico.');
                setLoading(false);
                return;
            }

            // Dynamic import of xlsx
            const XLSX = await import('xlsx');

            // Prepare data for export
            const exportData = criticalData.map((item: any) => ({
                'Almacén': item.warehouses?.name || warehouseName,
                'Estado': item.status,
                'Material': item.materials?.name || 'N/A',
                'Descripción': item.materials?.description || '',
                'Unidad': item.materials?.unit_of_measure || '',
                'Stock Actual': item.quantity,
                'Umbral Crítico': item.threshold,
                'Sugerencia': 'COMPRAR',
                'Última Actualización': new Date(item.updated_at).toLocaleDateString('es-ES')
            }));

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

            // Set column widths
            worksheet['!cols'] = [
                { wch: 20 }, // Almacén
                { wch: 12 }, // Estado
                { wch: 25 }, // Material
                { wch: 35 }, // Descripción
                { wch: 10 }, // Unidad
                { wch: 15 }, // Stock Actual
                { wch: 15 }, // Umbral
                { wch: 15 }, // Sugerencia
                { wch: 18 }  // Fecha
            ];

            const timestamp = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
            const filename = `PEDIDOS_${warehouseName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);
            toast.success('Reporte de pedidos generado con éxito');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Error al generar el reporte de pedidos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={loading || !warehouseId}
            className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500 transition-all shadow-sm"
            variant="outline"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            ) : (
                <><span>🛒</span> Descargar Stock Bajo/Crítico</>
            )}
        </Button>
    );
}
