'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type EquipmentMovement } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Trash2, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    refreshTrigger: number;
}

export function EquipmentMovementHistory({ refreshTrigger }: Props) {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('equipment_movements')
                .select(`id, movement_type, area, observations, created_at, equipment(name, serial_number), workers(full_name, position, dni), warehouse:warehouses(name)`)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            setMovements(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchMovements();

        // Set up Realtime subscription
        const channel = supabase
            .channel('equipment_movement_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'equipment_movements'
                },
                () => {
                    fetchMovements();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshTrigger]);

    const handleDelete = async (m: any) => {
        setDeletingId(m.id);
        setConfirmId(null);
        try {
            const { error } = await supabase.from('equipment_movements').delete().eq('id', m.id);
            if (error) throw error;
            toast.success('Movimiento eliminado.');
            await fetchMovements();
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally { setDeletingId(null); }
    };

    const filtered = movements.filter(m => {
        const q = searchQuery.toLowerCase();
        return (
            m.equipment?.name?.toLowerCase().includes(q) ||
            m.equipment?.serial_number?.toLowerCase().includes(q) ||
            m.workers?.full_name?.toLowerCase().includes(q) ||
            m.area?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 px-6 pt-6 print:hidden">
                <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Historial de Movimientos</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">Últimos 100 registros</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar..." className="pl-10 h-10 rounded-xl bg-background/50 border-border/50 font-bold text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2">
                        <Printer className="w-3.5 h-3.5" /> PDF
                    </Button>
                </div>
            </div>

            {/* Print Only Header (Subtle Info Bar) */}
            <div className="hidden print:flex items-center justify-between mb-4 border-b border-gray-100 pb-2 ml-1 text-[7pt] font-bold uppercase tracking-[0.15em] text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="text-black font-black">REPORTE DE MOVIMIENTOS • EQUIPOS</span>
                    <span className="opacity-60">PROMET INDUSTRIAL TECH</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="opacity-60">GENERACIÓN:</span>
                    <span className="text-black">{format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse font-bold text-xs uppercase">Cargando historial...</div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Fecha</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground text-center">Tipo</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Equipo</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Almacén</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Trabajador</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Área</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Observaciones</TableHead>
                                <TableHead className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-muted-foreground text-center print:hidden">Eliminar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground italic">Sin movimientos registrados.</TableCell></TableRow>
                            ) : filtered.map(m => (
                                <TableRow key={m.id} className="group border-b border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="px-4 py-3">
                                        <div className="text-[11px] font-black">{format(new Date(m.created_at), 'dd/MM/yyyy', { locale: es })}</div>
                                        <div className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), 'HH:mm', { locale: es })}</div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase ${m.movement_type === 'ingreso' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                            }`}>
                                            {m.movement_type === 'ingreso' ? '▼ Ingreso' : '▲ Egreso'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="font-black text-sm uppercase">{m.equipment?.name || '-'}</div>
                                        {m.equipment?.serial_number && <div className="text-[10px] text-muted-foreground">S/N: {m.equipment.serial_number}</div>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        {m.warehouse ? (
                                            <span className="text-[11px] font-bold text-primary flex items-center gap-1 uppercase">
                                                📍 {m.warehouse.name}
                                            </span>
                                        ) : <span className="text-muted-foreground text-[11px]">—</span>}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        {m.workers ? (
                                            <>
                                                <div className="font-bold text-sm">{m.workers.full_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{m.workers.position}</div>
                                            </>
                                        ) : m.movement_type === 'ingreso' ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase text-green-700">🏭 ALMACÉN</span>
                                                <span className="text-[9px] text-green-600/70 font-bold uppercase">(responsable)</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{m.area || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-sm text-muted-foreground max-w-[160px] truncate">{m.observations || '—'}</TableCell>
                                    <TableCell className="px-4 py-3 text-center print:hidden">
                                        {confirmId === m.id ? (
                                            <div className="flex items-center gap-1 justify-center">
                                                <button onClick={() => handleDelete(m)} className="text-[9px] font-black uppercase px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">✓ Sí</button>
                                                <button onClick={() => setConfirmId(null)} className="text-[9px] font-black uppercase px-2 py-1 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">No</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmId(m.id)} disabled={deletingId === m.id} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                                                {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
