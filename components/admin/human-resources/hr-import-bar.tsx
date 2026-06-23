'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileDown, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Database,
  Search,
  Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { VibeToolbar } from '@/components/ui/vibe-toolbar';
import { formatText, cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { VibeUploadModal } from '@/components/ui/vibe-upload-modal';

interface Props {
    onSuccess: () => void;
}

export function HRImportBar({ onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[] | null>(null);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [lastImportIds, setLastImportIds] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Plantilla RRHH');

            const headers = ['DNI / DOCUMENTO', 'NOMBRE COMPLETO', 'CARGO / POSICION', 'ESTADO (ACTIVO/CESADO)', 'FECHA INGRESO (YYYY-MM-DD)'];
            const columns = headers.map(h => ({
                header: h,
                key: h.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'),
                width: 25
            }));

            worksheet.columns = columns;

            // Style Header
            const headerRow = worksheet.getRow(1);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            worksheet.addRow(['45678901', 'JUAN PÉREZ LÓPEZ', 'Operario', 'ACTIVO', '2024-01-15']);
            worksheet.addRow(['76543210', 'MARÍA GARCÍA', 'Asistente', 'ACTIVO', '2024-02-01']);

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, 'plantilla_gestion_humana.xlsx');
            
            toast.success('📑 Plantilla generada correctamente.');
        } catch (error) {
            toast.error('Error al generar plantilla');
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
                const wb = XLSX.read(bstr, { type: 'array', cellDates: true });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' }) as any[];

                if (data.length === 0) {
                    toast.error('El archivo está vacío');
                    setLoading(false);
                    return;
                }

                // --- SMART HEADER NORMALIZATION (Regex) ---
                const originalKeys = Object.keys(data[0]);
                const normalizedHeaderMap: Record<string, string> = {};
                originalKeys.forEach(key => {
                    const normalized = key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    normalizedHeaderMap[normalized] = key;
                });

                const findKey = (searchKeys: string[]) => {
                    const keysFound = Object.keys(normalizedHeaderMap);
                    const foundKey = searchKeys.find(sk => keysFound.some(nk => nk.includes(sk)));
                    return foundKey ? normalizedHeaderMap[keysFound.find(nk => nk.includes(foundKey))!] : null;
                };

                const keys = {
                    dni: findKey(['dni', 'documento', 'doc', 'cedula']),
                    name: findKey(['nombre', 'completo', 'apellidos', 'colaborador', 'personal']),
                    position: findKey(['cargo', 'posicion', 'puesto', 'rol']),
                    status: findKey(['estado', 'estatus', 'situacion']),
                    date: findKey(['ingreso', 'fecha', 'inicio'])
                };

                if (!keys.dni || !keys.name) {
                    toast.error('❌ Estructura Inválida', {
                        description: 'No se detectaron columnas de DNI o Nombre. Use la plantilla para asegurar el formato.'
                    });
                    setLoading(false);
                    return;
                }

                // --- DATA PROCESSING ---
                const processed = data.map(row => {
                    // Safe DNI conversion
                    let rawDni = row[keys.dni!];
                    if (typeof rawDni === 'number') {
                        rawDni = rawDni.toLocaleString('fullwide', { useGrouping: false });
                    }
                    const dni = String(rawDni || '').replace(/[^0-9]/g, '').trim();
                    const name = formatText(String(row[keys.name!] || ''));

                    // Date parsing
                    let joiningDate = new Date().toISOString().split('T')[0];
                    if (keys.date && row[keys.date]) {
                        const d = new Date(row[keys.date]);
                        if (!isNaN(d.getTime())) joiningDate = d.toISOString().split('T')[0];
                    }

                    return {
                        dni,
                        full_name: name,
                        position: keys.position ? formatText(String(row[keys.position] || '')) : 'OPERARIO',
                        status: keys.status && String(row[keys.status]).toLowerCase().includes('cesa') ? 'cesado' : 'activo',
                        joining_date: joiningDate,
                        _isDuplicate: false
                    };
                }).filter(p => p.dni && p.full_name);

                // --- DUPLICATE CHECK (In DB) ---
                const dnis = processed.map(p => p.dni);
                const { data: existing } = await supabase
                    .from('workers')
                    .select('dni')
                    .in('dni', dnis)
                    .returns<{ dni: string }[]>();

                const existingDnis = new Set((existing || []).map(e => e.dni));
                let dupes = 0;
                processed.forEach(p => {
                    if (existingDnis.has(p.dni)) {
                        p._isDuplicate = true;
                        dupes++;
                    }
                });

                setPreview(processed);
                setDuplicateCount(dupes);
            } catch (err: any) {
                toast.error('Error al leer el archivo');
            } finally {
                setLoading(false);
                // Clear input here to ensure next selection triggers onChange
                if (fileRef.current) fileRef.current.value = '';
            }
        };

        reader.onerror = () => {
            toast.error('Error de lectura del archivo');
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (!preview) return;
        setLoading(true);

        try {
            const dataToUpsert = preview.map(p => {
                const { _isDuplicate, ...rest } = p;
                return rest;
            });

            const { data, error } = await supabase
                .from('workers')
                .upsert(dataToUpsert, { onConflict: 'dni' })
                .select('id')
                .returns<{id: string}[]>();

            if (error) throw error;

            toast.success(`✅ Sincronización Exitosa`, {
                description: `Se han procesado ${data?.length || 0} registros (Nuevos o Actualizados).`
            });
            
            if (data) setLastImportIds(data.map(d => d.id));
            setPreview(null);
            onSuccess();
        } catch (err: any) {
            toast.error(`Error al importar: ${err.message}`);
        } finally {
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleRollback = async () => {
        if (!lastImportIds.length) return;
        const confirm = window.confirm(`¿Revertir última carga de ${lastImportIds.length} registros?`);
        if (!confirm) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('workers').delete().in('id', lastImportIds);
            if (error) throw error;
            toast.success('✅ Carga revertida exitosamente');
            setLastImportIds([]);
            onSuccess();
        } catch (err: any) {
            toast.error('Error al revertir: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="w-full">
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
                title="Sincronizar Maestro de Personal"
                subtitle="GESTIÓN HUMANA • CARGA ADMINISTRATIVA"
                onFileSelect={(file) => handleFileUpload({ target: { files: [file] } } as any)}
                onDownloadTemplate={downloadTemplate}
                onRevertLastImport={handleRollback}
                revertCount={lastImportIds.length}
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
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Nuevos Perfiles</span>
                                <span className="text-2xl font-black text-emerald-600 tracking-tighter">{preview.length - duplicateCount}</span>
                            </div>
                        </div>

                        {duplicateCount > 0 && (
                            <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="text-[11px] font-bold leading-relaxed uppercase tracking-tight">
                                    Se han detectado {duplicateCount} DNIs existentes. Estos datos se **actualizarán** automáticamente (Upsert).
                                </p>
                            </div>
                        )}

                        <div className="max-h-[250px] overflow-y-auto border rounded-2xl border-zinc-100 bg-zinc-50/50 compact-scrollbar">
                            <table className="w-full text-left text-[11px]">
                                <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200">
                                    <tr>
                                        <th className="p-3 font-black uppercase text-zinc-400">DNI</th>
                                        <th className="p-3 font-black uppercase text-zinc-400">Personal</th>
                                        <th className="p-3 font-black uppercase text-zinc-400">Cargo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-white transition-colors">
                                            <td className="p-3 font-black text-zinc-600 font-mono">{row.dni}</td>
                                            <td className="p-3 font-bold text-zinc-900 uppercase">
                                                {row.full_name}
                                                {row._isDuplicate && <span className="ml-2 text-[8px] bg-amber-100 text-amber-600 px-1 rounded">EXISTENTE</span>}
                                            </td>
                                            <td className="p-3 text-zinc-400 font-black uppercase text-[10px]">{row.position}</td>
                                        </tr>
                                    ))}
                                    {preview.length > 5 && (
                                        <tr>
                                            <td colSpan={3} className="p-3 text-center text-zinc-400 font-black italic">
                                                + {preview.length - 5} colaboradores adicionales...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
