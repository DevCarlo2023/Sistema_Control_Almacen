'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Equipment, type Warehouse } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Loader2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatText } from '@/lib/utils';

interface Props { refreshTrigger: number; }

const EMPTY: Partial<Equipment> = { category: 'poder', status: 'operativo' };

type CategoryFilter = 'all' | 'poder' | 'computo' | 'instrumentacion' | 'izaje';
type LocationFilter = 'all' | 'almacen' | 'campo';

// Calibration helpers
function getCalibrationStatus(endDate?: string): 'vigente' | 'por_vencer' | 'vencido' | null {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'vencido';
    if (diffDays <= 30) return 'por_vencer';
    return 'vigente';
}

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function EquipmentTable({ refreshTrigger }: Props) {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');

    // Dialog state
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<Equipment>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchEquipment = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('equipment')
            .select('*, warehouse:warehouses(*)')
            .order('name');
        if (!error) setEquipment(data || []);
        setLoading(false);
    };

    const fetchWarehouses = async () => {
        const { data } = await supabase.from('warehouses').select('*').order('name');
        if (data) setWarehouses(data);
    };

    useEffect(() => {
        fetchEquipment();
        fetchWarehouses();

        // Set up Realtime subscription
        const channel = supabase
            .channel('equipment_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'equipment'
                },
                () => {
                    fetchEquipment();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshTrigger]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current.name?.trim()) { toast.error('El nombre es obligatorio'); return; }
        setSaving(true);
        try {
            const payload: any = {
                name: formatText(current.name || ''),
                serial_number: current.serial_number?.trim() || null,
                brand: formatText(current.brand || '') || null,
                model: formatText(current.model || '') || null,
                status: current.status || 'operativo',
                category: current.category || 'poder',
                unit_price: parseFloat(current.unit_price as any) || 0,
                warehouse_id: current.warehouse_id || null,
            };
            if (current.category === 'instrumentacion') {
                payload.calibration_start = current.calibration_start || null;
                payload.calibration_end = current.calibration_end || null;
            } else {
                payload.calibration_start = null;
                payload.calibration_end = null;
            }
            if (isEditing && current.id) {
                const { error } = await supabase.from('equipment').update(payload).eq('id', current.id);
                if (error) throw error;
                toast.success('✅ Equipo actualizado');
            } else {
                const { error } = await supabase.from('equipment').insert({ ...payload, current_location: 'almacen' });
                if (error) throw error;
                toast.success('✅ Equipo creado');
            }
            setOpen(false);
            fetchEquipment();
        } catch (err: any) { toast.error(`Error: ${err.message}`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('equipment').delete().eq('id', id);
            if (error) throw error;
            toast.success('Equipo eliminado');
            setDeleteConfirm(null);
            fetchEquipment();
        } catch (err: any) { toast.error(`Error: ${err.message}`); }
    };

    const openCreate = () => { setCurrent(EMPTY); setIsEditing(false); setOpen(true); };
    const openEdit = (eq: Equipment) => { setCurrent(eq); setIsEditing(true); setOpen(true); };

    // Calibration alerts
    const instEquipment = equipment.filter(e => e.category === 'instrumentacion');
    const vencidos = instEquipment.filter(e => getCalibrationStatus(e.calibration_end) === 'vencido');
    const porVencer = instEquipment.filter(e => getCalibrationStatus(e.calibration_end) === 'por_vencer');

    const filtered = equipment.filter(e => {
        const q = search.toLowerCase();
        const matchesSearch = e.name.toLowerCase().includes(q) || (e.serial_number || '').toLowerCase().includes(q) || (e.brand || '').toLowerCase().includes(q);
        const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
        const matchesLoc = locationFilter === 'all' || (locationFilter === 'almacen' && e.current_location !== 'campo') || (locationFilter === 'campo' && e.current_location === 'campo');
        return matchesSearch && matchesCat && matchesLoc;
    });

    const catCounts = {
        all: equipment.length,
        poder: equipment.filter(e => e.category === 'poder').length,
        computo: equipment.filter(e => e.category === 'computo').length,
        instrumentacion: equipment.filter(e => e.category === 'instrumentacion').length,
        izaje: equipment.filter(e => e.category === 'izaje').length,
    };

    const locCounts = {
        all: filtered.length,
        almacen: filtered.filter(e => e.current_location !== 'campo').length,
        campo: filtered.filter(e => e.current_location === 'campo').length,
    };

    const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
        operativo: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Operativo' },
        en_reparacion: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'En Reparación' },
        baja: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Baja' },
    };

    const catMeta: Record<CategoryFilter, { label: string; emoji: string; color: string }> = {
        all: { label: `Todos (${catCounts.all})`, emoji: '', color: '' },
        poder: { label: `Poder (${catCounts.poder})`, emoji: '⚡', color: 'yellow' },
        computo: { label: `Cómputo (${catCounts.computo})`, emoji: '💻', color: 'blue' },
        instrumentacion: { label: `Instrumentación (${catCounts.instrumentacion})`, emoji: '📐', color: 'purple' },
        izaje: { label: `Izaje (${catCounts.izaje})`, emoji: '🏗️', color: 'orange' },
    };

    const showCalibration = categoryFilter === 'instrumentacion' || categoryFilter === 'all';

    return (
        <div>
            {/* Calibration Alert Banner - Only show if in 'instrumentacion' or 'all' but mostly relevant for instrumentacion */}
            {categoryFilter === 'instrumentacion' && (vencidos.length > 0 || porVencer.length > 0) && (
                <div className={`mx-4 mt-4 rounded-xl px-4 py-3 flex items-start gap-3 ${vencidos.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    {vencidos.length > 0
                        ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    }
                    <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${vencidos.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                            {vencidos.length > 0
                                ? `🔴 ${vencidos.length} equipo(s) con calibración VENCIDA`
                                : `🟡 ${porVencer.length} equipo(s) con calibración próxima a vencer`
                            }
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {vencidos.length > 0 && `Vencidos: ${vencidos.map(e => e.name).join(', ')}`}
                            {vencidos.length > 0 && porVencer.length > 0 && ' · '}
                            {porVencer.length > 0 && `Por vencer: ${porVencer.map(e => e.name).join(', ')}`}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 px-6 pt-6">
                <div className="space-y-2">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Equipos Registrados</h3>
                    {/* Category tabs */}
                    <div className="flex flex-wrap items-center gap-1">
                        {(['all', 'poder', 'computo', 'instrumentacion', 'izaje'] as const).map(f => {
                            const m = catMeta[f];
                            const isActive = categoryFilter === f;
                            const activeColor = f === 'poder' ? 'bg-yellow-500 text-white' : f === 'computo' ? 'bg-blue-600 text-white' : f === 'instrumentacion' ? 'bg-purple-600 text-white' : f === 'izaje' ? 'bg-orange-500 text-white' : 'bg-primary text-primary-foreground';
                            return (
                                <button key={f} onClick={() => setCategoryFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? `${activeColor} shadow` : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                                    {m.emoji && `${m.emoji} `}{m.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Location sub-tabs */}
                    <div className="flex items-center gap-1">
                        {(['all', 'almacen', 'campo'] as const).map(f => (
                            <button key={f} onClick={() => setLocationFilter(f)}
                                className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${locationFilter === f ? f === 'campo' ? 'bg-red-500 text-white' : f === 'almacen' ? 'bg-green-600 text-white' : 'bg-slate-600 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
                                {f === 'all' ? `Todos (${locCounts.all})` : f === 'almacen' ? `🏭 Almacén (${locCounts.almacen})` : `🚧 Campo (${locCounts.campo})`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar equipo..." className="pl-10 h-10 rounded-xl bg-background/50 text-xs font-bold w-52" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary shadow gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Nuevo Equipo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-primary/20 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-widest text-primary text-sm flex items-center gap-2">
                                    <span className="bg-primary/20 p-1.5 rounded-lg">🔧</span>
                                    {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 pt-4">
                                {/* Category selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Categoría *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {([['poder', '⚡', 'Poder'], ['computo', '💻', 'Cómputo'], ['instrumentacion', '📐', 'Instrumentación'], ['izaje', '🏗️', 'Izaje']] as const).map(([val, emoji, label]) => (
                                            <button key={val} type="button"
                                                onClick={() => setCurrent(p => ({ ...p, category: val, calibration_start: undefined, calibration_end: undefined }))}
                                                className={`flex flex-col items-center justify-center h-14 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${current.category === val ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 hover:border-primary/40 text-muted-foreground'}`}>
                                                <span className="text-lg">{emoji}</span>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nombre / Detalle *</label>
                                        <Input required placeholder='Ej: Amoladora Angular 7" DEWALT...' className="h-11 rounded-xl bg-muted/30 font-bold" value={current.name || ''} onChange={e => setCurrent({ ...current, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">N° de Serie</label>
                                        <Input placeholder="AM-001" className="h-11 rounded-xl bg-muted/30 font-bold font-mono" value={current.serial_number || ''} onChange={e => setCurrent({ ...current, serial_number: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Estado</label>
                                        <select className="w-full h-11 rounded-xl bg-muted/30 font-bold text-sm px-3 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30" value={current.status || 'operativo'} onChange={e => setCurrent({ ...current, status: e.target.value as Equipment['status'] })}>
                                            <option value="operativo">Operativo</option>
                                            <option value="en_reparacion">En Reparación</option>
                                            <option value="baja">Baja</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Marca</label>
                                        <Input placeholder="DeWalt, Fluke..." className="h-11 rounded-xl bg-muted/30 font-bold" value={current.brand || ''} onChange={e => setCurrent({ ...current, brand: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Modelo</label>
                                        <Input placeholder="DWE402..." className="h-11 rounded-xl bg-muted/30 font-bold" value={current.model || ''} onChange={e => setCurrent({ ...current, model: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">📦 Ubicación (Almacén) *</label>
                                        <select
                                            required
                                            className="w-full h-11 rounded-xl bg-muted/30 font-bold text-sm px-3 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            value={current.warehouse_id || ''}
                                            onChange={e => setCurrent({ ...current, warehouse_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar Almacén...</option>
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Precio Unitario (S/.)</label>
                                        <Input type="number" step="0.01" placeholder="0.00" className="h-11 rounded-xl bg-muted/30 font-bold" value={current.unit_price ?? ''} onChange={e => setCurrent({ ...current, unit_price: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                                    </div>
                                </div>

                                {/* Calibration fields — only for instrumentacion */}
                                {current.category === 'instrumentacion' && (
                                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                                        <p className="text-[10px] uppercase font-black text-purple-700 tracking-widest flex items-center gap-1">
                                            📐 Calibración (período: 6 meses)
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Fecha Inicio</label>
                                                <Input type="date" className="h-11 rounded-xl bg-white font-bold" value={current.calibration_start || ''}
                                                    onChange={e => {
                                                        const start = e.target.value;
                                                        const end = start ? addMonths(start, 6) : '';
                                                        setCurrent({ ...current, calibration_start: start, calibration_end: end });
                                                    }} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Fecha Vencimiento</label>
                                                <Input type="date" className="h-11 rounded-xl bg-white font-bold" value={current.calibration_end || ''} onChange={e => setCurrent({ ...current, calibration_end: e.target.value })} />
                                            </div>
                                        </div>
                                        {current.calibration_end && (
                                            <p className={`text-[10px] font-bold ${getCalibrationStatus(current.calibration_end) === 'vencido' ? 'text-red-600' : getCalibrationStatus(current.calibration_end) === 'por_vencer' ? 'text-amber-600' : 'text-green-700'}`}>
                                                Estado: {getCalibrationStatus(current.calibration_end) === 'vencido' ? '🔴 Calibración VENCIDA' : getCalibrationStatus(current.calibration_end) === 'por_vencer' ? '🟡 Por vencer en menos de 30 días' : '🟢 Vigente'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl font-black uppercase tracking-widest bg-primary shadow-lg gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isEditing ? 'Guardar Cambios' : 'Crear Equipo'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse text-xs uppercase font-bold">Cargando equipos...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50">
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Categoría</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Disponibilidad</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nombre / Detalle</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">N° Serie</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Marca / Modelo</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Estado</th>
                                {showCalibration && <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Calibración</th>}
                                <th className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Precio</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={showCalibration ? 9 : 8} className="py-12 text-center text-muted-foreground italic">Sin equipos para mostrar.</td></tr>
                            ) : filtered.map(eq => {
                                const s = statusStyles[eq.status] || statusStyles.operativo;
                                const inField = eq.current_location === 'campo';
                                const calStatus = eq.category === 'instrumentacion' ? getCalibrationStatus(eq.calibration_end) : null;
                                const catEmoji = eq.category === 'poder' ? '⚡' : eq.category === 'computo' ? '💻' : '📐';
                                const catLabel = eq.category === 'poder' ? 'Poder' : eq.category === 'computo' ? 'Cómputo' : 'Instrumento';
                                const catColor = eq.category === 'poder' ? 'bg-yellow-100 text-yellow-700' : eq.category === 'computo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
                                return (
                                    <tr key={eq.id} className={`border-b border-border/30 hover:bg-primary/5 transition-colors group ${calStatus === 'vencido' ? 'bg-red-50/30' : calStatus === 'por_vencer' ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase ${catColor}`}>
                                                {catEmoji} {catLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase ${inField ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-700 border border-green-500/20'}`}>
                                                    {inField ? '🚧 En Campo' : '🏭 En Almacén'}
                                                </span>
                                                {!inField && eq.warehouse?.name && (
                                                    <span className="text-[9px] font-bold text-muted-foreground ml-1 truncate max-w-[120px]">
                                                        📍 {eq.warehouse.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-black uppercase text-sm">{eq.name}</td>
                                        <td className="px-4 py-3 font-mono text-sm font-bold text-primary">{eq.serial_number || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{[eq.brand, eq.model].filter(Boolean).join(' ') || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${s.bg} ${s.text}`}>{s.label}</span>
                                        </td>
                                        {showCalibration && (
                                            <td className="px-4 py-3">
                                                {eq.category !== 'instrumentacion' ? (
                                                    <span className="text-[10px] text-muted-foreground/40 italic">N/A</span>
                                                ) : !eq.calibration_end ? (
                                                    <span className="text-[10px] text-amber-600 font-bold">Sin registro</span>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] font-bold text-muted-foreground">
                                                            {formatDate(eq.calibration_start)} → {formatDate(eq.calibration_end)}
                                                        </div>
                                                        <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${calStatus === 'vencido' ? 'text-red-600' : calStatus === 'por_vencer' ? 'text-amber-600' : 'text-green-700'}`}>
                                                            {calStatus === 'vencido' ? <><AlertCircle className="w-3 h-3" /> VENCIDA</> : calStatus === 'por_vencer' ? <><AlertTriangle className="w-3 h-3" /> Por vencer</> : <><CheckCircle2 className="w-3 h-3" /> Vigente</>}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-sm font-bold">{eq.unit_price ? `S/. ${eq.unit_price.toFixed(2)}` : '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" title="Editar">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {deleteConfirm === eq.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleDelete(eq.id)} className="px-2 py-1 text-[9px] font-black bg-red-600 text-white rounded-lg">Sí</button>
                                                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[9px] font-black bg-muted rounded-lg">No</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteConfirm(eq.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Eliminar">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
