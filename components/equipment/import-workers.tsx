'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatText } from '@/lib/utils';

interface Props {
    onSuccess: () => void;
}

export function ImportWorkers({ onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const template = [
            { numero_trabajador: 'T-001', dni: '45678901', nombre_completo: 'Juan Pérez López', cargo: 'Operario de campo' },
            { numero_trabajador: 'T-002', dni: '32145678', nombre_completo: 'María García Torres', cargo: 'Técnico electricista' },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores');
        XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
                if (!data.length) { toast.error('Archivo vacío'); setLoading(false); return; }

                let ok = 0, fail = 0;
                let lastError = '';
                for (const row of data) {
                    const get = (k: string) => { const f = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase()); return f ? String(row[f]).trim() : ''; };
                    const full_name = formatText(get('nombre_completo'));
                    if (!full_name) continue;
                    const { error } = await supabase.from('workers').insert({
                        worker_number: get('numero_trabajador') || null,
                        dni: get('dni') || null,
                        full_name,
                        position: formatText(get('cargo')) || null,
                    });
                    if (error) { fail++; lastError = error.message; } else { ok++; }
                }
                if (ok) toast.success(`✅ ${ok} trabajadores importados correctamente`);
                if (fail) toast.error(`${fail} fila(s) fallaron: ${lastError}`);
                onSuccess();
                if (fileRef.current) fileRef.current.value = '';
            } catch (err: any) { toast.error(`Error al procesar el archivo: ${err.message || err}`); }
            finally { setLoading(false); }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {/* Icon-only template button with tooltip */}
                <div className="relative group">
                    <button onClick={downloadTemplate} className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 bg-background hover:bg-purple-50 hover:border-purple-300 transition-all shrink-0">
                        <FileDown className="w-4 h-4 text-purple-500" />
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Plantilla Trabajadores
                    </span>
                </div>
                {/* Full import button */}
                <div className="relative flex-1">
                    <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileRef} onChange={handleUpload} disabled={loading} />
                    <Button className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-purple-600 hover:bg-purple-700 shadow-[0_0_15px_rgba(147,51,234,0.2)] transition-all" onClick={() => fileRef.current?.click()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {loading ? 'Importando...' : 'Importar Trabajadores'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
