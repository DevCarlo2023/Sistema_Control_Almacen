'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
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

export function MaterialManager() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState<Partial<Material>>({});
    const [open, setOpen] = useState(false);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            let query = supabase.from('materials').select('*').order('name');

            if (search) {
                query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMaterials(data || []);
        } catch (err) {
            console.error('Error:', err);
            toast.error('Error al cargar materiales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();

        // Set up Realtime subscription
        const channel = supabase
            .channel('material_admin_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'materials'
                },
                () => {
                    fetchMaterials();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentMaterial.id) {
                const { error } = await supabase
                    .from('materials')
                    .update({
                        name: formatText(currentMaterial.name || ''),
                        description: formatText(currentMaterial.description || ''),
                        unit_of_measure: currentMaterial.unit_of_measure,
                        unit_price: parseFloat(currentMaterial.unit_price as any) || 0,
                        is_used: !!currentMaterial.is_used,
                    })
                    .eq('id', currentMaterial.id);
                if (error) throw error;
                toast.success('Material actualizado');
            } else {
                const { error } = await supabase.from('materials').insert({
                    name: formatText(currentMaterial.name || ''),
                    description: formatText(currentMaterial.description || ''),
                    unit_of_measure: (currentMaterial.unit_of_measure as string) || 'Unidad',
                    unit_price: parseFloat(currentMaterial.unit_price as any) || 0,
                    is_used: !!currentMaterial.is_used,
                });
                if (error) throw error;
                toast.success('Material creado');
            }
            setOpen(false);
            fetchMaterials();
        } catch (err: any) {
            console.error('Error:', err);
            if (err.message?.includes('unit_price')) {
                toast.error('⚠️ Error: Falta la columna unit_price en la base de datos.');
            } else if (err.message?.includes('is_used')) {
                toast.error('⚠️ Error: Falta la columna is_used en la base de datos. Ejecuta el SQL de migración.');
            } else {
                toast.error(`Error al guardar material: ${err.message || 'Error desconocido'}`);
            }
        }
    };

    const handleEdit = (material: Material) => {
        setCurrentMaterial(material);
        setIsEditing(true);
        setOpen(true);
    };

    const handleAddNew = () => {
        setCurrentMaterial({});
        setIsEditing(false);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este material? Esto podría afectar los registros de inventario.')) return;

        try {
            const { error } = await supabase.from('materials').delete().eq('id', id);
            if (error) throw error;
            toast.success('Material eliminado');
            fetchMaterials();
        } catch (err) {
            console.error('Error:', err);
            toast.error('Error al eliminar material. Es posible que tenga inventario asociado.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="relative w-full md:max-w-md">
                    <Input
                        placeholder="Buscar en el catálogo maestro..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 bg-background/50 border-border/50 rounded-xl font-bold pl-12 shadow-inner"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">🔍</span>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] px-8 bg-primary hover:bg-primary/90 shadow-lg glow-primary">
                            + Registrar Nuevo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-primary/20 rounded-2xl max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-widest text-primary text-sm flex items-center gap-2">
                                <span className="bg-primary/20 p-1.5 rounded-lg text-primary">📦</span>
                                {isEditing ? 'Editar Registro Maestro' : 'Nuevo Registro Maestro'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Código Identificador</label>
                                <Input
                                    required
                                    placeholder="Ej. MAT-001"
                                    className="h-12 rounded-xl bg-muted/30 font-bold"
                                    value={currentMaterial.name || ''}
                                    onChange={e => setCurrentMaterial({ ...currentMaterial, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Descripción Técnica</label>
                                <Input
                                    placeholder="Ej. Guantes de Badana Premium"
                                    className="h-12 rounded-xl bg-muted/30 font-bold"
                                    value={currentMaterial.description || ''}
                                    onChange={e => setCurrentMaterial({ ...currentMaterial, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Precio Unitario (S/.)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-12 rounded-xl bg-muted/30 font-bold"
                                    value={currentMaterial.unit_price ?? ''}
                                    onChange={e => setCurrentMaterial({ ...currentMaterial, unit_price: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/10 hover:border-primary/30 transition-colors">
                                <input
                                    type="checkbox"
                                    id="is_used"
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={currentMaterial.is_used || false}
                                    onChange={e => setCurrentMaterial({ ...currentMaterial, is_used: e.target.checked })}
                                />
                                <label htmlFor="is_used" className="text-xs font-black uppercase tracking-widest text-foreground cursor-pointer select-none">
                                    Material Usado (Segunda Mano)
                                </label>
                            </div>
                            <Button type="submit" className="h-12 w-full rounded-xl font-black uppercase tracking-widest bg-primary shadow-lg glow-primary">
                                {isEditing ? 'Sincronizar Cambios' : 'Confirmar Creación'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/10">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground w-[150px]">Código</TableHead>
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Descripción Maestro</TableHead>
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground text-right w-[120px]">P. Unitario</TableHead>
                            <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs font-bold uppercase tracking-widest animate-pulse">Sincronizando catálogo...</TableCell></TableRow>
                        ) : materials.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-12 italic text-muted-foreground">No se encontraron materiales en el catálogo.</TableCell></TableRow>
                        ) : (
                            materials.map((m) => (
                                <TableRow key={m.id} className="group border-b border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="py-4 px-6 font-black uppercase text-sm tracking-tight text-foreground">{m.name}</TableCell>
                                    <TableCell className="py-4 px-6">
                                        <p className="text-sm text-muted-foreground font-medium italic mb-1">{m.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">{m.unit_of_measure}</span>
                                            {m.is_used && (
                                                <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded uppercase shadow-sm">USADO</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 px-6 text-right">
                                        <span className="text-sm font-black text-primary">
                                            S/. {(m.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all bg-blue-500/5 shadow-sm"
                                                onClick={() => handleEdit(m)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all bg-destructive/5 shadow-sm"
                                                onClick={() => handleDelete(m.id)}
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
        </div >
    );
}
