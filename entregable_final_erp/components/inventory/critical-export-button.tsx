'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getStockThreshold } from '@/lib/utils';
import { toast } from 'sonner';

import { AlertTriangle } from 'lucide-react';

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
        <button
            onClick={handleExport}
            disabled={loading || !warehouseId}
            className="w-full flex items-center justify-center p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
            {loading ? (
                <div className="w-6 h-6 border-[3px] border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
            ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 mt-0.5">
                Bajo / Crítico
            </span>
        </button>
    );
}
