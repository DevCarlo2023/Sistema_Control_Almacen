'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/excel-export';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  warehouseId: string;
  warehouseName: string;
}

export function ExportButton({ warehouseId, warehouseName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    if (!warehouseId) {
      setError('Por favor selecciona un almacén');
      return;
    }

    setLoading(true);
    setError('');

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
        setError('No hay datos para exportar en este almacén');
        return;
      }

      await exportToExcel(data as any, warehouseName, true);
    } catch (err) {
      console.error('Export error:', err);
      setError('Error al exportar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={loading || !warehouseId}
        className="w-full flex items-center justify-center p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {loading ? (
          <div className="w-6 h-6 border-[3px] border-emerald-300 border-t-emerald-600 rounded-full animate-spin shrink-0" />
        ) : (
          <Download className="w-6 h-6 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mt-0.5">
          Stock (Excel)
        </span>
      </button>
      {error && <div className="text-[9px] font-bold text-red-600 uppercase tracking-tight text-center bg-red-50 py-1.5 rounded border border-red-100">{error}</div>}
    </div>
  );
}
