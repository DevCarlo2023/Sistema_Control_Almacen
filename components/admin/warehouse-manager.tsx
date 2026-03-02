'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Warehouse } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatText } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function WarehouseManager() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState<Partial<Warehouse>>({});
    const [open, setOpen] = useState(false);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('warehouses').select('*').order('name');
            if (error) throw error;
            setWarehouses(data || []);
        } catch (err) {
            console.error('Error:', err);
            toast.error('Error al cargar almacenes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentWarehouse.id) {
                const { error } = await supabase
                    .from('warehouses')
                    .update({
                        name: formatText(currentWarehouse.name || ''),
                        location: formatText(currentWarehouse.location || ''),
                    })
                    .eq('id', currentWarehouse.id);
                if (error) throw error;
                toast.success('Almacén actualizado');
            } else {
                const { error } = await supabase.from('warehouses').insert({
                    name: formatText(currentWarehouse.name || ''),
                    location: formatText(currentWarehouse.location || ''),
                });
                if (error) throw error;
                toast.success('Almacén creado');
            }
            setOpen(false);
            fetchWarehouses();
        } catch (err) {
            console.error('Error:', err);
            toast.error('Error al guardar almacén');
        }
    };

    const handleEdit = (warehouse: Warehouse) => {
        setCurrentWarehouse(warehouse);
        setIsEditing(true);
        setOpen(true);
    };

    const handleAddNew = () => {
        setCurrentWarehouse({});
        setIsEditing(false);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este almacén? Se perderá la relación con los productos asociados.')) return;

        try {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) throw error;
            toast.success('Almacén eliminado');
            fetchWarehouses();
        } catch (err) {
            console.error('Error:', err);
            toast.error('Error al eliminar almacén');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">🏢</div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Almacenes Registrados</h3>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew} className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] px-6 bg-primary shadow-lg glow-primary">
                            + Alta de Almacén
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-primary/20 rounded-2xl max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-widest text-primary text-sm flex items-center gap-2">
                                <span className="bg-primary/20 p-1.5 rounded-lg text-primary">🏢</span>
                                {isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nombre Comercial</label>
                                <Input
                                    required
                                    placeholder="Ej. Almacén Central"
                                    className="h-12 rounded-xl bg-muted/30 font-bold"
                                    value={currentWarehouse.name || ''}
                                    onChange={e => setCurrentWarehouse({ ...currentWarehouse, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Geolocalización / Ciudad</label>
                                <Input
                                    placeholder="Ej. Lima, Perú"
                                    className="h-12 rounded-xl bg-muted/30 font-bold"
                                    value={currentWarehouse.location || ''}
                                    onChange={e => setCurrentWarehouse({ ...currentWarehouse, location: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="h-12 w-full rounded-xl font-black uppercase tracking-widest bg-primary shadow-lg glow-primary">
                                {isEditing ? 'Actualizar Almacén' : 'Crear Almacén'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/10">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Nombre del Almacén</TableHead>
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Ubicación</TableHead>
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground text-right w-[200px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-12 text-xs font-bold uppercase tracking-widest animate-pulse">Sincronizando almacenes...</TableCell></TableRow>
                        ) : warehouses.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-12 italic text-muted-foreground">No hay almacenes registrados en el sistema.</TableCell></TableRow>
                        ) : (
                            warehouses.map((w) => (
                                <TableRow key={w.id} className="group border-b border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="py-4 px-6 font-black uppercase text-sm tracking-tight text-foreground">
                                        <span className="uppercase">{w.name}</span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase letter-spacing-wide">
                                            <span className="opacity-50 text-[10px]">📍</span>
                                            {w.location}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all bg-blue-500/5 shadow-sm"
                                                onClick={() => handleEdit(w)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all bg-destructive/5 shadow-sm"
                                                onClick={() => handleDelete(w.id)}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
