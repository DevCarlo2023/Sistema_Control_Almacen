'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type InventoryMovement } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Printer, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MovementHistoryProps {
    warehouseId: string;
    refreshTrigger: number;
}

export function MovementHistory({ warehouseId, refreshTrigger }: MovementHistoryProps) {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handlePrint = () => {
        window.print();
    };

    const fetchMovements = async () => {
        if (!warehouseId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_movements')
                .select(`
          id,
          material_id,
          movement_type,
          quantity,
          notes,
          created_at,
          user_id,
          materials (name, description)
        `)
                .eq('warehouse_id', warehouseId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setMovements((data as any) || []);
        } catch (err) {
            console.error('Error fetching movements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();

        // Set up Realtime subscription
        const channel = supabase
            .channel('movement_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory_movements',
                    filter: `warehouse_id=eq.${warehouseId}`
                },
                () => {
                    fetchMovements();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [warehouseId, refreshTrigger]);

    const handleDeleteMovement = async (movement: InventoryMovement) => {
        setDeletingId(movement.id);
        setConfirmDeleteId(null);
        try {
            // Reverse the stock effect: entrada → subtract, salida → add
            const { data: invData } = await supabase
                .from('inventory')
                .select('id, quantity')
                .eq('warehouse_id', warehouseId)
                .eq('material_id', movement.material_id)
                .maybeSingle();

            if (invData) {
                const delta = movement.movement_type === 'entrada' ? -movement.quantity : movement.quantity;
                const newQty = invData.quantity + delta;
                if (newQty <= 0) {
                    await supabase.from('inventory').delete().eq('id', invData.id);
                } else {
                    await supabase
                        .from('inventory')
                        .update({ quantity: newQty, updated_at: new Date().toISOString() })
                        .eq('id', invData.id);
                }
            }

            // Delete the movement record
            const { error } = await supabase.from('inventory_movements').delete().eq('id', movement.id);
            if (error) throw error;

            toast.success('Movimiento eliminado y stock actualizado.');
            await fetchMovements();
        } catch (err: any) {
            console.error('Delete error:', err);
            toast.error(`Error al eliminar: ${err.message || 'Error desconocido'}`);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredMovements = movements.filter((m) => {
        const material = (m as any).materials;
        const searchLower = searchQuery.toLowerCase();
        return (
            material?.name?.toLowerCase().includes(searchLower) ||
            material?.description?.toLowerCase().includes(searchLower) ||
            m.notes?.toLowerCase().includes(searchLower)
        );
    });

    if (!warehouseId) return null;

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-6 pt-6 print:hidden">
                <div className="space-y-1">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Historial Reciente</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">Últimos 50 registros</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en historial..."
                            className="pl-10 h-10 rounded-xl bg-background/50 border-border/50 font-bold text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Print Only Header (Subtle Info Bar) */}
            <div className="hidden print:flex items-center justify-between mb-4 border-b border-gray-100 pb-2 ml-1 text-[7pt] font-bold uppercase tracking-[0.15em] text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="text-black font-black">REPORTE DE MOVIMIENTOS • ALMACÉN</span>
                    <span className="opacity-60">PROMET INDUSTRIAL TECH</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="opacity-60">GENERACIÓN:</span>
                    <span className="text-black">{format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse font-bold tracking-widest text-xs uppercase">Sincronizando historial...</div>
            ) : movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic font-medium">Sin movimientos registrados.</div>
            ) : (
                <div className="overflow-x-auto">
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 border-b border-border/50">
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground w-[120px]">Fecha</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Código</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Descripción</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground">Acción</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground text-right w-[100px]">Cant.</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground w-[180px]">Notas</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground text-center w-[80px] print:hidden">Eliminar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMovements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground italic text-sm">
                                            No hay movimientos que coincidan con la búsqueda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMovements.map((m) => (
                                        <TableRow key={m.id} className="group border-b border-border/30 hover:bg-primary/5 transition-colors duration-200 break-inside-avoid">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-foreground">{format(new Date(m.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(m.created_at), 'HH:mm', { locale: es })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-bold uppercase text-sm tracking-tight text-foreground">
                                                {(m as any).materials?.name}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-sm text-muted-foreground italic font-medium">
                                                {(m as any).materials?.description || '-'}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className={`
                            inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase
                            ${m.movement_type === 'entrada'
                                                        ? 'bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)] border border-green-500/20'
                                                        : 'bg-destructive/10 text-destructive shadow-[0_0_10px_rgba(239,68,68,0.1)] border border-destructive/20'
                                                    }
                          `}>
                                                    {m.movement_type === 'entrada' ? '▲ Entrada' : '▼ Salida'}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`py-4 px-6 text-right font-black text-base tracking-tight ${m.movement_type === 'entrada' ? 'text-green-500' : 'text-destructive'}`}>
                                                {m.quantity.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed truncate max-w-[160px] print:whitespace-pre-wrap print:max-w-none" title={m.notes || ''}>
                                                    {m.notes || '-'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-center print:hidden">
                                                {confirmDeleteId === m.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDeleteMovement(m)}
                                                            className="text-[9px] font-black uppercase px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                                        >
                                                            ✓ Sí
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(null)}
                                                            className="text-[9px] font-black uppercase px-2 py-1 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDeleteId(m.id)}
                                                        disabled={deletingId === m.id}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                                        title="Eliminar movimiento"
                                                    >
                                                        {deletingId === m.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="flex flex-col gap-4 p-4 sm:hidden print:hidden">
                        {filteredMovements.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground italic text-sm">
                                No hay movimientos que coincidan con la búsqueda.
                            </div>
                        ) : (
                            filteredMovements.map((m) => (
                                <div key={m.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3 relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">{format(new Date(m.created_at), 'dd MMM yyyy', { locale: es })}</span>
                                            <span className="text-sm font-bold truncate max-w-[180px]">{(m as any).materials?.name}</span>
                                        </div>
                                        <span className={`
                                            inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase
                                            ${m.movement_type === 'entrada'
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                                            }
                                        `}>
                                            {m.movement_type === 'entrada' ? '▲ Entrada' : '▼ Salida'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-1">
                                            {m.notes && <p className="text-[10px] text-muted-foreground italic line-clamp-1 italic">"{m.notes}"</p>}
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{format(new Date(m.created_at), 'HH:mm', { locale: es })}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-tighter">Cantidad</span>
                                            <span className={`text-xl font-black ${m.movement_type === 'entrada' ? 'text-green-500' : 'text-destructive'}`}>
                                                {m.quantity.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Delete Button */}
                                    <div className="absolute top-2 right-2">
                                        {confirmDeleteId === m.id ? (
                                            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border/50">
                                                <button onClick={() => handleDeleteMovement(m)} className="text-[8px] font-bold uppercase px-2 py-1 bg-red-600 text-white rounded-md">✓ Borrar</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="text-[8px] font-bold uppercase px-2 py-1 bg-muted text-muted-foreground rounded-md">X</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(m.id)}
                                                className="p-2 rounded-full bg-destructive/5 text-destructive/40 hover:text-destructive transition-colors"
                                            >
                                                {deletingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
