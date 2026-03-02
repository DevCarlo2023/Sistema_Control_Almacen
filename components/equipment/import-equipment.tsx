'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatText } from '@/lib/utils';

interface Props {
    onSuccess: () => void;
}

export function ImportEquipment({ onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const template = [
            { nombre: 'Amoladora Angular 7" DEWALT DWE402', numero_serie: 'AM-001', marca: 'DeWalt', modelo: 'DWE402', estado: 'operativo', categoría: 'PODER', ubicacion: 'ALMACÉN PRINCIPAL', precio_unitario: 350 },
            { nombre: 'Multímetro Digital Fluke 179', numero_serie: 'INST-005', marca: 'Fluke', modelo: '179', estado: 'operativo', categoría: 'INSTRUMENTACIÓN', ubicacion: 'ALMACÉN PRINCIPAL', precio_unitario: 850 },
            { nombre: 'Laptop HP ProBook 450 G8', numero_serie: 'COMP-010', marca: 'HP', modelo: 'ProBook 450', estado: 'operativo', categoría: 'CÓMPUTO', ubicacion: 'ALMACÉN PRINCIPAL', precio_unitario: 1200 },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
        XLSX.writeFile(wb, 'plantilla_equipos.xlsx');
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

                const { data: whs } = await supabase.from('warehouses').select('id, name');
                const warehouseMap = new Map((whs || []).map(w => [w.name.toLowerCase(), w.id]));

                let ok = 0, fail = 0;
                let lastError = '';
                for (const row of data) {
                    const get = (k: string) => {
                        const f = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase());
                        return f ? String(row[f]).trim() : '';
                    };
                    const name = formatText(get('nombre'));
                    if (!name) continue;

                    const locName = get('ubicacion').toLowerCase();
                    const warehouse_id = warehouseMap.get(locName) || null;

                    // Map categories: normalize and match keys
                    const catRaw = get('categoría').toLowerCase();
                    let category: 'poder' | 'computo' | 'instrumentacion' = 'poder';
                    if (catRaw.includes('computo') || catRaw.includes('cómputo')) category = 'computo';
                    else if (catRaw.includes('instrument') || catRaw.includes('instrum')) category = 'instrumentacion';

                    const { error } = await supabase.from('equipment').insert({
                        name,
                        serial_number: get('numero_serie') || null,
                        brand: formatText(get('marca')) || null,
                        model: formatText(get('modelo')) || null,
                        status: get('estado') || 'operativo',
                        category,
                        warehouse_id,
                        unit_price: parseFloat(get('precio_unitario')) || 0,
                        current_location: 'almacen'
                    });
                    if (error) { fail++; lastError = error.message; } else { ok++; }
                }
                if (ok) toast.success(`✅ ${ok} equipos importados correctamente`);
                if (fail) toast.error(`${fail} fila(s) fallaron: ${lastError}`);
                onSuccess();
                if (fileRef.current) fileRef.current.value = '';
            } catch (err: any) { toast.error(`Error al procesar el archivo: ${err.message || err}`); }
            finally { setLoading(false); }
        };
        reader.readAsBinaryString(file);
    };

    const handleRevert = async () => {
        setReverting(true);
        setShowConfirm(false);
        try {
            // Delete all equipment with no movements (safe to revert)
            const { data: withMovements } = await supabase.from('equipment_movements').select('equipment_id');
            const usedIds = (withMovements || []).map((m: any) => m.equipment_id);
            const { error } = usedIds.length > 0
                ? await supabase.from('equipment').delete().not('id', 'in', `(${usedIds.map(id => `'${id}'`).join(',')})`)
                : await supabase.from('equipment').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            toast.success('Equipos sin movimientos eliminados.');
            onSuccess();
        } catch (err: any) { toast.error(`Error: ${err.message}`); }
        finally { setReverting(false); }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {/* Icon-only template button with tooltip */}
                <div className="relative group">
                    <button onClick={downloadTemplate} className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 bg-background hover:bg-blue-50 hover:border-blue-300 transition-all shrink-0">
                        <FileDown className="w-4 h-4 text-blue-500" />
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        Plantilla Equipos
                    </span>
                </div>
                {/* Full import button */}
                <div className="relative flex-1">
                    <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileRef} onChange={handleUpload} disabled={loading} />
                    <Button className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all" onClick={() => fileRef.current?.click()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {loading ? 'Importando...' : 'Importar Equipos'}
                    </Button>
                </div>
            </div>
            {!showConfirm ? (
                <Button variant="outline" size="sm" className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all" onClick={() => setShowConfirm(true)} disabled={reverting}>
                    {reverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Revertir Última Carga
                </Button>
            ) : (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-700 font-bold leading-snug">¿Eliminar equipos importados sin movimientos? Esta acción no se puede deshacer.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-8 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 rounded-lg" onClick={handleRevert}>Sí, eliminar</Button>
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => setShowConfirm(false)}>Cancelar</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
