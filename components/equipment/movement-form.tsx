'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Equipment, type Worker, type Warehouse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EquipmentSearch } from './equipment-search';
import { WorkerSelector } from './worker-selector';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, Loader2, AlertCircle } from 'lucide-react';

interface MovementFormProps {
    onSuccess: () => void;
}

export function EquipmentMovementForm({ onSuccess }: MovementFormProps) {
    const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [area, setArea] = useState('');
    const [observations, setObservations] = useState('');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWarehouses = async () => {
            const { data } = await supabase.from('warehouses').select('*').order('name');
            if (data) setWarehouses(data);
        };
        fetchWarehouses();
    }, []);

    // Validate location conflict when equipment is selected
    const locationConflict = selectedEquipment
        ? movementType === 'egreso' && selectedEquipment.current_location === 'campo'
            ? '⚠️ Este equipo ya está en campo. Regístralo primero como ingreso.'
            : movementType === 'ingreso' && selectedEquipment.current_location === 'almacen'
                ? '⚠️ Este equipo ya está en almacén. No necesita ingreso.'
                : null
        : null;

    const handleSubmit = async () => {
        if (!selectedEquipment) { toast.error('Selecciona un equipo'); return; }
        if (movementType === 'egreso' && !selectedWorker) { toast.error('Selecciona un trabajador para el egreso'); return; }
        if (!selectedWarehouseId) { toast.error('Selecciona un almacén'); return; }
        if (!area.trim()) { toast.error('El campo Área es obligatorio'); return; }
        if (locationConflict) { toast.error(locationConflict); return; }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Insert movement — for ingreso, worker_id is null but we record area
            const { error: movError } = await supabase.from('equipment_movements').insert({
                equipment_id: selectedEquipment.id,
                movement_type: movementType,
                worker_id: movementType === 'egreso' ? selectedWorker?.id : null,
                warehouse_id: selectedWarehouseId,
                area: area.trim(),
                observations: observations || null,
                user_id: user?.id,
            });
            if (movError) throw movError;

            // 2. Update equipment current_location and warehouse_id (if ingreso)
            const newLocation = movementType === 'egreso' ? 'campo' : 'almacen';
            const eqUpdate: any = { current_location: newLocation };
            if (movementType === 'ingreso') {
                eqUpdate.warehouse_id = selectedWarehouseId;
            }
            const { error: eqError } = await supabase
                .from('equipment')
                .update(eqUpdate)
                .eq('id', selectedEquipment.id);
            if (eqError) throw eqError;

            toast.success(`✅ ${movementType === 'ingreso' ? 'Ingreso a almacén' : 'Egreso a campo'} registrado`);
            setSelectedEquipment(null);
            setSelectedWorker(null);
            setSelectedWarehouseId('');
            setArea('');
            setObservations('');
            onSuccess();
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-5">
            {/* Movement type toggle */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() => setMovementType('ingreso')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 h-14 sm:h-12 px-2 rounded-xl font-black uppercase text-[9px] sm:text-[11px] tracking-widest border-2 transition-all ${movementType === 'ingreso'
                        ? 'bg-green-600 text-white border-green-600 shadow-lg'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-green-300'}`}
                >
                    <ArrowDownCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-[1.1] text-center">Ingreso Almacén</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMovementType('egreso')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 h-14 sm:h-12 px-2 rounded-xl font-black uppercase text-[9px] sm:text-[11px] tracking-widest border-2 transition-all ${movementType === 'egreso'
                        ? 'bg-red-600 text-white border-red-600 shadow-lg'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-red-300'}`}
                >
                    <ArrowUpCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-[1.1] text-center">Egreso Campo</span>
                </button>
            </div>

            {/* Equipment search */}
            <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">Equipo</label>
                {selectedEquipment ? (
                    <div className={`flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 rounded-xl border-2 ${locationConflict ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-primary/30 bg-primary/5'}`}>
                        <div className="min-w-0">
                            <div className="font-black text-xs md:text-sm uppercase truncate">{selectedEquipment.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {selectedEquipment.serial_number && (
                                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold truncate">S/N: {selectedEquipment.serial_number}</span>
                                )}
                                <span className={`text-[8px] md:text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${selectedEquipment.current_location === 'campo'
                                    ? 'bg-red-100 dark:bg-red-950/40 text-red-600'
                                    : 'bg-green-100 dark:bg-green-950/40 text-green-700'}`}>
                                    {selectedEquipment.current_location === 'campo' ? '🚧 Campo' : '🏭 Almacén'}
                                </span>
                            </div>
                        </div>
                        <button type="button" onClick={() => setSelectedEquipment(null)} className="ml-2 p-1 text-muted-foreground hover:text-red-500 transition-colors">✕</button>
                    </div>
                ) : (
                    <EquipmentSearch onSelect={setSelectedEquipment} selected={selectedEquipment} />
                )}
            </div>

            {/* Location conflict warning */}
            {locationConflict && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-300 dark:border-amber-900/50 px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] md:text-[11px] font-bold text-amber-700 dark:text-amber-400">{locationConflict}</p>
                </div>
            )}

            {/* Warehouse selector */}
            <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">
                    {movementType === 'ingreso' ? 'Almacén de Destino' : 'Almacén de Origen'}
                </label>
                <select
                    className="w-full h-10 md:h-11 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 font-bold text-xs md:text-sm px-3 focus:outline-none focus:border-primary/50"
                    value={selectedWarehouseId}
                    onChange={e => {
                        const id = e.target.value;
                        setSelectedWarehouseId(id);
                        if (id) {
                            const wh = warehouses.find(w => w.id === id);
                            if (wh) setArea(wh.location || wh.name);
                        }
                    }}
                >
                    <option value="">Seleccionar Almacén...</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>

            {/* Responsible */}
            <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">
                    {movementType === 'ingreso' ? 'Responsable de Ingreso' : 'Trabajador Asignado'}
                </label>
                {movementType === 'ingreso' ? (
                    <div className="flex items-center justify-center h-10 md:h-11 px-4 rounded-xl border-2 border-green-300 dark:border-green-900/50 bg-green-50 dark:bg-green-950/10 gap-2">
                        <span className="text-xs md:text-sm font-black uppercase text-green-700 dark:text-green-400">🏭 ALMACÉN</span>
                        <span className="text-[9px] text-green-600 dark:text-green-500 font-bold ml-1">(automático)</span>
                    </div>
                ) : (
                    <WorkerSelector onSelect={setSelectedWorker} selected={selectedWorker} onClear={() => setSelectedWorker(null)} />
                )}
            </div>

            {/* Area */}
            <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                    Área / Zona de Trabajo
                    <span className="text-red-500 text-[10px]">*</span>
                </label>
                <Input
                    placeholder={movementType === 'ingreso' ? 'Ej: Almacén Principal...' : 'Ej: Zona norte...'}
                    className={`h-10 md:h-11 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-xs md:text-sm ${!area.trim() && 'border-dashed'}`}
                    value={area}
                    onChange={e => setArea(e.target.value)}
                />
            </div>

            {/* Observations */}
            <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Observaciones</label>
                <Input
                    placeholder="Notas adicionales..."
                    className="h-10 md:h-11 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-xs md:text-sm"
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                />
            </div>

            {/* Submit */}
            <div className="pt-1">
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !!locationConflict}
                    className={`w-full h-11 md:h-12 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] flex items-center justify-center gap-2 transition-all ${movementType === 'ingreso'
                        ? 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(22,163,74,0.3)]'
                        : 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : movementType === 'ingreso'
                            ? <><ArrowDownCircle className="w-4 h-4 shrink-0" /><span>Registrar Ingreso</span></>
                            : <><ArrowUpCircle className="w-4 h-4 shrink-0" /><span>Registrar Egreso</span></>
                    }
                </Button>
            </div>
        </div>
    );
}
