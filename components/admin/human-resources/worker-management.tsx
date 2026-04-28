'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Worker } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, Loader2, UserCheck, UserMinus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatText, cn } from '@/lib/utils';

interface Props { refreshTrigger: number; }

const POSITIONS = [
    'Residente de Obra',
    'Supervisor HSE',
    'Ingeniero de Calidad',
    'Capataz',
    'Operario',
    'Oficial',
    'Ayudante',
    'Almacenero',
    'Logística',
    'Administrativo'
];

const EMPTY: Partial<Worker> = {
    status: 'activo',
    full_name: '',
    position: 'Operario',
    dni: '',
    joining_date: new Date().toISOString().split('T')[0]
};

export function WorkerManagement({ refreshTrigger }: Props) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'activo' | 'cesado'>('all');

    // Dialog state
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<Worker>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isCustomPosition, setIsCustomPosition] = useState(false);
    const [customPosition, setCustomPosition] = useState('');

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .order('full_name')
                .returns<Worker[]>();
            if (error) throw error;
            setWorkers(data || []);
        } catch (err: any) {
            console.error('Error fetching workers:', err);
            toast.error('No se pudo cargar el personal');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWorkers(); }, [refreshTrigger]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current.full_name?.trim()) { toast.error('El nombre es obligatorio'); return; }
        if (!current.dni?.trim() || current.dni.length < 8) { toast.error('DNI inválido (min 8 dígitos)'); return; }
        
        setSaving(true);
        try {
            const payload: any = {
                dni: current.dni.trim(),
                full_name: formatText(current.full_name || ''),
                position: isCustomPosition ? formatText(customPosition) : current.position,
                status: current.status || 'activo',
                joining_date: current.joining_date || null,
                worker_number: current.worker_number?.trim() || null
            };

            // Only add termination_date if status is 'cesado'
            if (current.status === 'cesado') {
                payload.termination_date = current.termination_date || null;
            }

            let result;
            if (isEditing && current.id) {
                result = await supabase.from('workers').update(payload).eq('id', current.id);
            } else {
                result = await supabase.from('workers').insert(payload);
            }

            if (result.error) {
                // Check if error is due to missing columns (common after I plan a migration but user hasn't run it)
                if (result.error.code === '42703') {
                    throw new Error('Faltan columnas en la base de datos (status, joining_date, etc.). Por favor ejecute la migración SQL proporcionada.');
                }
                throw result.error;
            }

            toast.success(isEditing ? 'Trabajador actualizado' : 'Trabajador registrado');
            setOpen(false);
            fetchWorkers();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.code === '23505') {
                toast.warning('⚠️ Documento Duplicado', {
                    description: 'El DNI ingresado ya pertenece a otro colaborador. Verifique los datos o busque el registro existente.'
                });
            } else if (err.code === '42703') {
                toast.error('🚨 Error de Estructura', {
                    description: 'Faltan columnas en la base de datos (status/fechas). Por favor, ejecute la migración SQL.'
                });
            } else {
                toast.error('❌ Error al Guardar', {
                    description: err.message || 'No se pudo procesar la solicitud en este momento.'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('workers').delete().eq('id', id);
            if (error) throw error;
            toast.success('Registro eliminado');
            setDeleteId(null);
            fetchWorkers();
        } catch (err: any) {
            toast.error('❌ Error de Eliminación', {
                description: 'No se puede eliminar el registro porque tiene movimientos o historial asociado.'
            });
        }
    };

    const openCreate = () => { 
        setCurrent(EMPTY); 
        setIsEditing(false); 
        setIsCustomPosition(false);
        setCustomPosition('');
        setOpen(true); 
    };

    const openEdit = (w: Worker) => { 
        setCurrent(w); 
        setIsEditing(true); 
        // If current position isn't in default list, enable custom mode
        const isKnown = POSITIONS.includes(w.position || '');
        setIsCustomPosition(!isKnown);
        setCustomPosition(isKnown ? '' : (w.position || ''));
        setOpen(true); 
    };

    const filtered = workers.filter(w => {
        const matchesSearch = w.full_name.toLowerCase().includes(search.toLowerCase()) || 
                             (w.dni || '').includes(search);
        const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* ── Toolbar ────────────────────────────────────────── */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 bg-zinc-50/20">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input 
                            placeholder="Buscar por DNI o Nombre..." 
                            className="pl-10 h-11 bg-white rounded-xl border-zinc-200 font-bold text-sm"
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                        <SelectTrigger className="w-40 h-11 bg-white rounded-xl font-bold uppercase text-[10px] tracking-widest border-zinc-200">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">TODOS</SelectItem>
                            <SelectItem value="activo">ACTIVOS</SelectItem>
                            <SelectItem value="cesado">CESADOS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 hover:bg-purple-700 text-white shadow-lg gap-2 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> Registrar Personal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
                        <DialogHeader className="bg-purple-600 p-6 text-white">
                            <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                                {isEditing ? 'Editar Perfil' : 'Nuevo Colaborador'}
                            </DialogTitle>
                            <p className="text-purple-100 text-xs font-bold uppercase tracking-widest opacity-80">Datos Maestros de Personal</p>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="p-6 space-y-5 bg-white">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Número DNI</label>
                                    <Input 
                                        maxLength={12}
                                        className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold" 
                                        value={current.dni || ''} 
                                        onChange={e => setCurrent({...current, dni: e.target.value})} 
                                        placeholder="Ej: 45678912"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Estado Administrativo</label>
                                    <Select value={current.status} onValueChange={v => setCurrent({...current, status: v as any})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold uppercase text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">✅ ACTIVO</SelectItem>
                                            <SelectItem value="cesado">❌ CESADO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombres y Apellidos</label>
                                <Input 
                                    className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold" 
                                    value={current.full_name || ''} 
                                    onChange={e => setCurrent({...current, full_name: e.target.value})} 
                                    placeholder="Nombre completo..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Cargo / Posición</label>
                                {!isCustomPosition ? (
                                    <Select 
                                        value={current.position} 
                                        onValueChange={v => {
                                            if (v === 'OTRO') {
                                                setIsCustomPosition(true);
                                            } else {
                                                setCurrent({...current, position: v});
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold uppercase text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POSITIONS.map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                                            <SelectItem value="OTRO" className="font-black text-purple-600 italic">➕ OTRO (ESCRIBIR...)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                                        <Input 
                                            autoFocus
                                            className="h-11 rounded-xl bg-purple-50 border-purple-100 font-bold uppercase text-xs text-purple-900" 
                                            value={customPosition} 
                                            onChange={e => setCustomPosition(e.target.value)} 
                                            placeholder="Escriba el nuevo cargo..."
                                        />
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setIsCustomPosition(false)}
                                            className="h-11 w-11 p-0 rounded-xl text-zinc-400"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" /> Fecha Ingreso
                                    </label>
                                    <Input 
                                        type="date"
                                        className="h-11 rounded-xl bg-zinc-50 border-zinc-100 font-bold" 
                                        value={current.joining_date || ''} 
                                        onChange={e => setCurrent({...current, joining_date: e.target.value})} 
                                    />
                                </div>
                                {current.status === 'cesado' && (
                                    <div className="space-y-1.5 animate-in slide-in-from-right-2 duration-300">
                                        <label className="text-[10px] font-black uppercase text-red-400 tracking-widest ml-1 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Fecha Cese
                                        </label>
                                        <Input 
                                            type="date"
                                            className="h-11 rounded-xl bg-red-50/50 border-red-100 font-bold text-red-700" 
                                            value={current.termination_date || ''} 
                                            onChange={e => setCurrent({...current, termination_date: e.target.value})} 
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl font-black uppercase tracking-widest bg-zinc-950 text-white shadow-xl flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Guardar Cambios' : 'Confirmar Registro')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Table ─────────────────────────────────────────── */}
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronizando Maestro...</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                                <th className="px-6 py-4 text-left text-[10px] uppercase font-black tracking-widest text-zinc-400">Estado</th>
                                <th className="px-6 py-4 text-left text-[10px] uppercase font-black tracking-widest text-zinc-400">DNI / Documento</th>
                                <th className="px-6 py-4 text-left text-[10px] uppercase font-black tracking-widest text-zinc-400">Nombre Completo</th>
                                <th className="px-6 py-4 text-left text-[10px] uppercase font-black tracking-widest text-zinc-400">Cargo</th>
                                <th className="px-6 py-4 text-left text-[10px] uppercase font-black tracking-widest text-zinc-400">Fechas</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">No se encontraron resultados</p>
                                    </td>
                                </tr>
                            ) : filtered.map(w => (
                                <tr key={w.id} className="group hover:bg-zinc-50/80 transition-all duration-300">
                                    <td className="px-6 py-5">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm border",
                                            w.status === 'activo' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-zinc-400 text-white border-zinc-300'
                                        )}>
                                            {w.status === 'activo' ? <UserCheck className="w-3 h-3" /> : <UserMinus className="w-3 h-3" />}
                                            {w.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-zinc-800 tracking-wider font-mono">{w.dni || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-black text-zinc-950 uppercase">{w.full_name}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-600 text-[9px] font-black uppercase tracking-widest">
                                            {w.position || 'SIN CARGO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase leading-tight">IN: {w.joining_date ? new Date(w.joining_date).toLocaleDateString() : '---'}</span>
                                            {w.status === 'cesado' && (
                                                <span className="text-[9px] font-bold text-red-500 uppercase leading-tight mt-1">OUT: {w.termination_date ? new Date(w.termination_date).toLocaleDateString() : '---'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="w-8 h-8 rounded-lg border-zinc-200 hover:border-purple-300 hover:text-purple-600 transition-all"
                                                onClick={() => openEdit(w)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="w-8 h-8 rounded-lg border-zinc-200 hover:border-red-300 hover:text-red-600 transition-all"
                                                onClick={() => setDeleteId(w.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Delete Confirmation Dialog ────────────────────────── */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="rounded-2xl p-6 sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-950">¿Eliminar Registro?</h2>
                            <p className="text-sm text-muted-foreground font-medium italic">Esta acción es permanente y puede fallar si el trabajador tiene historial de movimientos.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-6">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border-zinc-200" 
                            onClick={() => setDeleteId(null)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                             className="flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest bg-red-600 hover:bg-red-700 text-white" 
                             onClick={() => deleteId && handleDelete(deleteId)}
                        >
                            Confirmar Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
