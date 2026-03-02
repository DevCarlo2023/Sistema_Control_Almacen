'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { exportToExcel } from '@/lib/excel-export';

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
          materials (*)
        `
        )
        .eq('warehouse_id', warehouseId);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError('No hay datos para exportar en este almacén');
        return;
      }

      await exportToExcel(data as any, warehouseName);
    } catch (err) {
      console.error('Export error:', err);
      setError('Error al exportar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExport}
        disabled={loading || !warehouseId}
        className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
        variant="outline"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <><span>📥</span> Descargar Stock (Excel)</>
        )}
      </Button>
      {error && <div className="text-[10px] font-bold text-destructive uppercase tracking-tight text-center bg-destructive/5 py-1.5 rounded-lg border border-destructive/10">{error}</div>}
    </div>
  );
}
