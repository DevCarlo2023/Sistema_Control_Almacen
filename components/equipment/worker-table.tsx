'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Worker } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatText } from '@/lib/utils';

interface Props { refreshTrigger: number; }

const EMPTY: Partial<Worker> = {};

export function WorkerTable({ refreshTrigger }: Props) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Dialog state
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<Worker>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchWorkers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('workers').select('*').order('full_name');
        if (!error) setWorkers(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchWorkers(); }, [refreshTrigger]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current.full_name?.trim()) { toast.error('El nombre es obligatorio'); return; }
        setSaving(true);
        try {
            const payload = {
                worker_number: current.worker_number?.trim() || null,
                dni: current.dni?.trim() || null,
                full_name: formatText(current.full_name || ''),
                position: formatText(current.position || '') || null,
            };
            if (isEditing && current.id) {
                const { error } = await supabase.from('workers').update(payload).eq('id', current.id);
                if (error) throw error;
                toast.success('✅ Trabajador actualizado');
            } else {
                const { error } = await supabase.from('workers').insert(payload);
                if (error) throw error;
                toast.success('✅ Trabajador creado');
            }
            setOpen(false);
            fetchWorkers();
        } catch (err: any) { toast.error(`Error: ${err.message}`); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('workers').delete().eq('id', id);
            if (error) throw error;
            toast.success('Trabajador eliminado');
            setDeleteConfirm(null);
            fetchWorkers();
        } catch (err: any) { toast.error(`Error: ${err.message}`); }
    };

    const openCreate = () => { setCurrent(EMPTY); setIsEditing(false); setOpen(true); };
    const openEdit = (w: Worker) => { setCurrent(w); setIsEditing(true); setOpen(true); };

    const filtered = workers.filter(w =>
        w.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (w.dni || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.worker_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.position || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4 px-6 pt-6">
                <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Trabajadores Registrados</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">{workers.length} trabajadores</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar trabajador..." className="pl-10 h-10 rounded-xl bg-background/50 text-xs font-bold w-52" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 hover:bg-purple-700 shadow gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Nuevo Trabajador
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-purple-500/20 rounded-2xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-widest text-purple-600 text-sm flex items-center gap-2">
                                    <span className="bg-purple-500/20 p-1.5 rounded-lg">👷</span>
                                    {isEditing ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nombre Completo *</label>
                                        <Input required placeholder="Juan Pérez López" className="h-11 rounded-xl bg-muted/30 font-bold" value={current.full_name || ''} onChange={e => setCurrent({ ...current, full_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">N° Trabajador</label>
                                        <Input placeholder="T-001" className="h-11 rounded-xl bg-muted/30 font-bold font-mono" value={current.worker_number || ''} onChange={e => setCurrent({ ...current, worker_number: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">DNI</label>
                                        <Input placeholder="45678901" className="h-11 rounded-xl bg-muted/30 font-bold font-mono" value={current.dni || ''} onChange={e => setCurrent({ ...current, dni: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Cargo</label>
                                        <Input placeholder="Operario de campo, Técnico..." className="h-11 rounded-xl bg-muted/30 font-bold" value={current.position || ''} onChange={e => setCurrent({ ...current, position: e.target.value })} />
                                    </div>
                                </div>
                                <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-700 shadow-lg gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isEditing ? 'Guardar Cambios' : 'Crear Trabajador'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse text-xs uppercase font-bold">Cargando trabajadores...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50">
                                {['N° Trabajador', 'Nombre Completo', 'DNI', 'Cargo', ''].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">Sin trabajadores registrados.</td></tr>
                            ) : filtered.map(w => (
                                <tr key={w.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors group">
                                    <td className="px-4 py-3 font-black text-primary text-sm">{w.worker_number || '—'}</td>
                                    <td className="px-4 py-3 font-bold uppercase text-sm">{w.full_name}</td>
                                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{w.dni || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{w.position || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors" title="Editar">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {deleteConfirm === w.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(w.id)} className="px-2 py-1 text-[9px] font-black bg-red-600 text-white rounded-lg">Sí</button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[9px] font-black bg-muted rounded-lg">No</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(w.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Eliminar">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
