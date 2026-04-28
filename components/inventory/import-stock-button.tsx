'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { db } from '@/lib/offline-db';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { VibeUploadModal } from '@/components/ui/vibe-upload-modal';

// Required columns map
const CODE_KEYS = ['codigo', 'código', 'code', 'sku', 'id'];
const NAME_KEYS = ['nombre', 'name', 'producto', 'material'];
const DESC_KEYS = ['descripcion', 'descripción', 'description', 'detalle', 'desc'];
const QTY_KEYS = ['cantidad', 'qty', 'quantity', 'stock', 'ingreso'];
const UNIT_KEYS = ['unidad', 'und', 'unit', 'uom', 'medida', 'unidad_medida'];

interface ProcessedItem {
  row: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad?: string;
  cantidad: number;
  materialId?: string;
  status: 'valid' | 'invalid' | 'notFound' | 'new';
  errorMsg?: string;
}

export function ImportStockButton({ 
  warehouseId, 
  onSuccess 
}: { 
  warehouseId: string;
  onSuccess: () => void;
}) {
  const { performOperation } = useOfflineSync();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [summary, setSummary] = useState({ valid: 0, errors: 0, new: 0 });

  const findKey = (row: any, possibleKeys: string[]) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      if (possibleKeys.includes(String(key).toLowerCase().trim())) return key;
    }
    return null;
  };

  const onFileChange = async (file: File) => {
    setFileName(file.name);
    setIsParsing(true);
    setProcessedItems([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonRows?.length) throw new Error("El archivo está vacío.");

      const { data: materialsData } = await supabase.from('materials').select('id, codigo, name');
      const dbMaterials = materialsData || [];

      let validCount = 0;
      let errorCount = 0;
      let newCount = 0;
      const items: ProcessedItem[] = jsonRows.map((row, index) => {
        const codeKey = findKey(row, CODE_KEYS);
        const nameKey = findKey(row, NAME_KEYS);
        const descKey = findKey(row, DESC_KEYS);
        const qtyKey = findKey(row, QTY_KEYS);
        const unitKey = findKey(row, UNIT_KEYS);

        const rowCode = codeKey ? String(row[codeKey]).trim() : '';
        const rowName = nameKey ? String(row[nameKey]).trim() : '';
        const rowQty = qtyKey ? parseFloat(row[qtyKey]) : 0;

        let status: 'valid' | 'invalid' | 'new' = 'invalid';
        let materialId: string | undefined;
        let errorMsg = '';

        if (!rowCode && !rowName) errorMsg = 'Falta ID';
        else if (isNaN(rowQty) || rowQty <= 0) errorMsg = 'Cant. Inválida';
        else {
          const found = dbMaterials.find(m => 
            (rowCode && m.codigo?.toLowerCase() === rowCode.toLowerCase()) || 
            (rowName && m.name.toLowerCase() === rowName.toLowerCase())
          );
          if (found) {
            status = 'valid';
            materialId = found.id;
            validCount++;
          } else {
            status = 'new';
            newCount++;
            validCount++;
          }
        }
        if (status === 'invalid') errorCount++;

        return {
          row: index + 2,
          codigo: rowCode || '-',
          nombre: rowName || '-',
          descripcion: descKey ? String(row[descKey] || '') : '',
          unidad: unitKey ? String(row[unitKey] || 'UND') : 'UND',
          cantidad: rowQty,
          status,
          materialId,
          errorMsg
        };
      });

      setProcessedItems(items);
      setSummary({ valid: validCount, errors: errorCount, new: newCount });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmUpload = async () => {
    const items = processedItems.filter(i => i.status === 'valid' || i.status === 'new');
    if (!items.length || !warehouseId) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada.");

      const batchId = crypto.randomUUID().split('-')[0].toUpperCase();

      for (const item of items) {
        let matId = item.materialId;
        if (item.status === 'new' && !matId) {
          const { data: created } = await supabase.from('materials').insert({
            name: item.nombre !== '-' ? item.nombre : item.codigo,
            codigo: item.codigo !== '-' ? item.codigo : null,
            unit_of_measure: item.unidad,
            unit_price: 0
          }).select('id').single();
          matId = (created as any)?.id;
        }

        if (!matId) continue;

        const { data: inv } = await supabase.from('inventory').select('quantity').eq('warehouse_id', warehouseId).eq('material_id', matId).single();
        const currentQty = (inv as any)?.quantity || 0;

        await performOperation('inventory_movements', 'INSERT', {
          warehouse_id: warehouseId,
          material_id: matId,
          movement_type: 'entrada',
          quantity: item.cantidad,
          notes: `Carga Masiva [BATCH: ${batchId}]`,
          user_id: user.id
        });

        await performOperation('inventory', inv ? 'UPDATE' : 'INSERT', {
          warehouse_id: warehouseId,
          material_id: matId,
          quantity: currentQty + item.cantidad
        });
      }

      toast.success("Carga exitosa.");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ Codigo: 'EJEMPLO-01', Cantidad: 10, Nombre: 'MATERIAL EJEMPLO' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_stock.xlsx");
  };

  return (
    <>
      <button
        disabled={!warehouseId}
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all gap-3 shadow-sm disabled:opacity-50 group mb-2"
      >
        <FileSpreadsheet className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Carga Masiva</span>
      </button>

      <VibeUploadModal
        open={open}
        onOpenChange={setOpen}
        title="Sugerir Stock vía Excel"
        subtitle={`Almacén Destino: ${warehouseId?.split('-')[0]}`}
        onFileSelect={onFileChange}
        onDownloadTemplate={handleDownloadTemplate}
        loading={isParsing || isUploading}
        canConfirm={processedItems.length > 0 && summary.valid > 0}
        onConfirm={handleConfirmUpload}
        previewContent={fileName && (
          <div className="space-y-4">
            <div className="flex bg-zinc-50 border p-4 rounded-xl items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-xs font-black uppercase">{fileName}</p>
                  <p className="text-[10px] font-bold text-zinc-500">{processedItems.length} filas</p>
                </div>
              </div>
              <button onClick={() => setFileName(null)} className="text-xs font-bold text-red-500 uppercase">Cambiar</button>
            </div>
            <div className="flex gap-4">
               <div className="flex-1 bg-green-50 p-2 rounded border border-green-100 text-green-700 text-[10px] font-black uppercase text-center">{summary.valid} Válidos</div>
               <div className="flex-1 bg-red-50 p-2 rounded border border-red-100 text-red-700 text-[10px] font-black uppercase text-center">{summary.errors} Errores</div>
            </div>
            <div className="max-h-[200px] overflow-auto border rounded-xl bg-zinc-50/50">
              <table className="w-full text-[10px]">
                <thead className="bg-zinc-100 sticky top-0">
                  <tr><th className="p-2 text-left font-black uppercase">Material</th><th className="p-2 text-center font-black uppercase">Cant</th><th className="p-2 text-right font-black uppercase">Estado</th></tr>
                </thead>
                <tbody>
                  {processedItems.slice(0, 50).map((i, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-white transition-colors">
                      <td className="p-2 font-bold uppercase">{i.nombre !== '-' ? i.nombre : i.codigo}</td>
                      <td className="p-2 text-center font-black text-indigo-600">{i.cantidad}</td>
                      <td className="p-2 text-right">
                        {i.status === 'valid' ? <span className="text-green-600 font-bold">OK</span> : 
                         i.status === 'new' ? <span className="text-blue-600 font-bold">NUEVO</span> : 
                         <span className="text-red-500 font-bold">ERR</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      />
    </>
  );
}
