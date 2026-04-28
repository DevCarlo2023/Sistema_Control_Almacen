'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Upload, 
  FileDown, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Table as TableIcon,
  Database,
  Search,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { VibeToolbar } from '@/components/ui/vibe-toolbar';
import { smartMaterialSanitizer, normalizeUOM } from '@/lib/catalog-utils';
import { cn } from '@/lib/utils';
import { VibeUploadModal } from '@/components/ui/vibe-upload-modal';

interface CatalogBulkImportProps {
  type: 'material' | 'equipment';
  onSuccess: () => void;
}

export function CatalogBulkImport({ type, onSuccess }: CatalogBulkImportProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [lastImportedIds, setLastImportedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Plantilla');

      const headers = type === 'material' 
        ? ['CÓDIGO / SKU', 'DESCRIPCIÓN TÉCNICA', 'UNIDAD DE MEDIDA', 'PRECIO UNITARIO']
        : ['NOMBRE / IDENTIFICACIÓN', 'NÚMERO DE SERIE', 'MARCA', 'MODELO', 'CATEGORÍA', 'PROPIEDAD', 'PRECIO UNITARIO', 'INICIO CALIBRACIÓN', 'FRECUENCIA MESES'];
      
      const columns = headers.map(h => ({
        header: h,
        key: h.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'),
        width: h.length + 15
      }));

      worksheet.columns = columns;

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF083344' } // Cyan 950
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 10
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add dummy row to show example
      const dummyRow = type === 'material'
        ? ['MAT-001', 'CABLE VULCANIZADO 3X14', 'MTS', '15.50']
        : ['ROTOMARTILLO BOSCH', 'SN-99220', 'BOSCH', 'GBH 2-24 DRE', 'PODER', 'PROPIO', '850.00', '2024-01-15', '12'];
      
      worksheet.addRow(dummyRow);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `plantilla_${type}_catalogo.xlsx`);
      
      toast.success('📑 Plantilla profesional generada.');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Error al generar la plantilla');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast.error('El archivo está vacío');
          setLoading(false);
          return;
        }

        // --- OPTIMIZATION: PRE-NORMALIZE HEADERS ---
        // We do this once for all rows instead of doing it for every single cell
        const originalKeys = Object.keys(data[0]);
        const normalizedHeaderMap: Record<string, string> = {};
        originalKeys.forEach(key => {
          const normalized = key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          normalizedHeaderMap[normalized] = key;
        });

        const findKey = (searchKeys: string[]) => {
          const foundNormalized = searchKeys.find(sk => normalizedHeaderMap[sk]);
          return foundNormalized ? normalizedHeaderMap[foundNormalized] : null;
        };

        // Pre-detect keys for efficiency
        const keys = {
          codigo: findKey(['sku', 'codigo', 'cod', 'item_code']),
          name: findKey(['descripcion tecnica', 'descripcion', 'nombre', 'articulo', 'name']),
          description: findKey(['detalles', 'observaciones']),
          unit: findKey(['um', 'u.m.', 'unidad de medida', 'unidad', 'uom', 'measure']),
          price: findKey(['precio unitario', 'precio', 'costo', 'price', 'unit_price']),
          serial: findKey(['serie', 'serial', 'n_serie', 's/n']),
          brand: findKey(['marca', 'brand', 'fabricante']),
          model: findKey(['modelo', 'model']),
          category: findKey(['categoria', 'category', 'tipo']),
          ownership: findKey(['propiedad', 'ownership', 'dueño']),
          cal_start: findKey(['inicio calibracion', 'cal_start', 'fecha inicio', 'calibracion inicio']),
          cal_freq: findKey(['frecuencia meses', 'cal_freq', 'meses', 'frecuencia']),
        };

        // --- MAPPING AND SANITIZATION ---
        const processed = data.map(row => {
          if (type === 'material') {
            const rawItem = {
              codigo: keys.codigo ? String(row[keys.codigo] || '').trim() : '',
              name: keys.name ? String(row[keys.name] || '').trim() : '',
              description: keys.description ? String(row[keys.description] || '').trim() : '',
              unit_of_measure: keys.unit ? String(row[keys.unit] || '').trim() : 'UND',
              unit_price: parseFloat(keys.price ? String(row[keys.price] || '0').replace(/[^0-9.]/g, '') : '0') || 0
            };
            return smartMaterialSanitizer(rawItem);
          } else {
            return {
              name: keys.name ? String(row[keys.name] || '').trim() : '',
              serial_number: keys.serial ? String(row[keys.serial] || '').trim() : '',
              brand: keys.brand ? String(row[keys.brand] || '').trim() : '',
              model: keys.model ? String(row[keys.model] || '').trim() : '',
              category: (keys.category ? String(row[keys.category] || '') : 'general').toLowerCase(),
              ownership: (keys.ownership ? String(row[keys.ownership] || '') : 'propio').toLowerCase(),
              unit_price: parseFloat(keys.price ? String(row[keys.price] || '0').replace(/[^0-9.]/g, '') : '0') || 0,
              status: 'operativo',
              calibration_start: keys.cal_start ? String(row[keys.cal_start] || '').trim() || null : null,
              calibration_frequency: keys.cal_freq ? parseInt(String(row[keys.cal_freq] || '0')) || null : null,
              calibration_end: (() => {
                const startStr = keys.cal_start ? String(row[keys.cal_start] || '').trim() : '';
                const freqStr = keys.cal_freq ? String(row[keys.cal_freq] || '0') : '0';
                if (startStr && freqStr && parseInt(freqStr) > 0) {
                  const start = new Date(startStr);
                  if (!isNaN(start.getTime())) {
                    const months = parseInt(freqStr);
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + months);
                    return end.toISOString().split('T')[0];
                  }
                }
                return null;
              })()
            };
          }
        }).filter(item => item.name);

        // --- CHECK DUPLICATES IN DB (PARALLEL) ---
        const table = type === 'material' ? 'materials' : 'equipment';
        const uniqueField = type === 'material' ? 'codigo' : 'serial_number';
        
        let dupes = 0;
        const existingCodesSet = new Set<string>();
        const existingNamesSet = new Set<string>();

        const codesToCheck = Array.from(new Set(processed.map((p:any) => p[uniqueField]).filter(v => typeof v === 'string' && v.trim() !== ''))) as string[];
        const namesToCheck = Array.from(new Set(processed.map((p:any) => p.name).filter(v => typeof v === 'string' && v.trim() !== ''))) as string[];

        const extractChunks = (arr: string[], size: number) => {
          const chunks = [];
          for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
          return chunks;
        };

        // Parallel processing of chunks for maximum speed
        const codeQueries = extractChunks(codesToCheck, 1000).map(chunk => 
          supabase.from(table).select(uniqueField).in(uniqueField, chunk)
        );
        const nameQueries = extractChunks(namesToCheck, 1000).map(chunk => 
          supabase.from(table).select('name').in('name', chunk)
        );

        const queryResults = await Promise.all([...codeQueries, ...nameQueries]);
        
        queryResults.forEach(({ data }) => {
          if (data) data.forEach((d:any) => {
            if (d[uniqueField]) existingCodesSet.add(d[uniqueField].toUpperCase());
            if (d.name) existingNamesSet.add(d.name.toUpperCase());
          });
        });

        processed.forEach((p: any) => {
          const pCode = p[uniqueField] ? String(p[uniqueField]).toUpperCase() : null;
          const pName = p.name ? String(p.name).toUpperCase() : null;
          
          if ((pCode && pCode !== 'SIN SKU' && existingCodesSet.has(pCode)) || (pName && existingNamesSet.has(pName))) {
            p._isDuplicate = true;
            dupes++;
          }
        });

        setPreview(processed);
        setDuplicateCount(dupes);
      } catch (err: any) {
        toast.error('Error al leer archivo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);

    try {
      const table = type === 'material' ? 'materials' : 'equipment';
      
      const dataToInsert = preview.filter(p => !p._isDuplicate).map(p => {
        const copy = { ...p };
        delete copy._isDuplicate;
        return copy;
      });

      if (dataToInsert.length === 0) {
        toast.info('No hay registros nuevos para importar.');
        setPreview(null);
        return;
      }

      // Chunk the inserts to avoid Payload Too Large errors and capture IDs safely
      const chunkSize = 1000;
      let insertedIds: string[] = [];
      let insertError = null;

      for (let i = 0; i < dataToInsert.length; i += chunkSize) {
        const chunk = dataToInsert.slice(i, i + chunkSize);
        const { data, error } = await supabase.from(table).insert(chunk).select('id');
        
        if (error) {
          insertError = error;
          break;
        }
        if (data) {
          insertedIds.push(...(data as any[]).map(d => d.id));
        }
      }

      if (insertError) throw insertError;

      toast.success(`✅ Importación exitosa: ${insertedIds.length} registros creados.`);
      setLastImportedIds(insertedIds);
      setPreview(null);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al importar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (lastImportedIds.length === 0) return;
    
    if (!confirm(`¿Está seguro de deshacer la última carga? Se eliminarán ${lastImportedIds.length} artículos recién creados de la base de datos.`)) return;
    
    setLoading(true);
    const toastId = toast.loading(`↩️ Revirtiendo ${lastImportedIds.length} registros...`);
    try {
      const table = type === 'material' ? 'materials' : 'equipment';
      const chunkSize = 500;
      
      for (let i = 0; i < lastImportedIds.length; i += chunkSize) {
        const chunk = lastImportedIds.slice(i, i + chunkSize);
        const { error } = await supabase.from(table).delete().in('id', chunk);
        if (error) throw error;
      }

      toast.success(`✅ Carga revertida exitosamente.`, { id: toastId });
      setLastImportedIds([]);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al revertir: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... (previous helper functions and handleFileUpload/handleImport/handleRevert remain identical)

  return (
    <div className="flex items-center gap-2">
      <VibeToolbar 
        actions={[
          {
            type: 'importar',
            label: 'CARGA MASIVA',
            onClick: () => setIsModalOpen(true),
            loading: loading,
            disabled: loading
          }
        ]}
      />

      <VibeUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={type === 'material' ? "Sugerir Catálogo de Materiales" : "Sugerir Catálogo de Equipos"}
        subtitle={`MÓDULO DE INVENTARIO • ${type.toUpperCase()}`}
        onFileSelect={(file: File) => {
          // Wrap file into a synthetic event or call logic directly
          const reader = new FileReader();
          reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws) as any[];
            // ... (rest of parsing logic)
          };
          // For simplicity, I'll refactor handleFileUpload slightly to take a file directly or simulate event
          handleFileUpload({ target: { files: [file] } } as any);
        }}
        onDownloadTemplate={getTemplate}
        onRevertLastImport={handleRevert}
        revertCount={lastImportedIds.length}
        loading={loading}
        canConfirm={!!preview && preview.length > 0}
        onConfirm={handleImport}
        previewContent={preview && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Total Encontrados</span>
                <span className="text-2xl font-black text-zinc-900 tracking-tighter">{preview.length}</span>
              </div>
              <div className={cn(
                "p-4 rounded-2xl border flex flex-col gap-1",
                duplicateCount > 0 ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-100"
              )}>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Ya Registrados</span>
                <span className={cn("text-2xl font-black tracking-tighter", duplicateCount > 0 ? "text-amber-600" : "text-zinc-400")}>
                  {duplicateCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Nuevos Registros</span>
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">{preview.length - duplicateCount}</span>
              </div>
            </div>

            {duplicateCount > 0 && (
              <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed uppercase tracking-tight">
                  Se han detectado {duplicateCount} registros existentes. Se omitirán para evitar duplicidad según SKU/Serie.
                </p>
              </div>
            )}

            <div className="max-h-[250px] overflow-y-auto border rounded-2xl border-zinc-100 bg-zinc-50/50 compact-scrollbar">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200">
                  <tr>
                    <th className="p-3 font-black uppercase text-zinc-400">{type === 'material' ? 'CÓDIGO' : 'Serie'}</th>
                    <th className="p-3 font-black uppercase text-zinc-400">Nombre</th>
                    <th className="p-3 font-black uppercase text-zinc-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-white transition-colors">
                      <td className="p-3 font-black text-zinc-600 uppercase">{type === 'material' ? row.codigo : row.serial_number}</td>
                      <td className="p-3 font-bold text-zinc-900 uppercase">{row.name}</td>
                      <td className="p-3">
                        {row._isDuplicate ? (
                          <span className="text-amber-600 font-bold uppercase text-[9px]">Omitido</span>
                        ) : (
                          <span className="text-emerald-600 font-bold uppercase text-[9px]">Nuevo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {preview.length > 5 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-zinc-400 font-black italic">
                        + {preview.length - 5} registros adicionales...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic animate-pulse">¿Confirmas la carga de estos datos?</p>
          </div>
        )}
      />
    </div>
  );
}
