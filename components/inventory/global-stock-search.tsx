'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Download, Globe, Search as SearchIcon } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { Button } from '@/components/ui/button';

interface GlobalStockSearchProps {
    refreshTrigger?: number;
}

export function GlobalStockSearch({ refreshTrigger = 0 }: GlobalStockSearchProps) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 50;

    const fetchGlobalStock = async (query: string, pageNum: number) => {
        setLoading(true);
        try {
            let supabaseQuery = supabase
                .from('inventory')
                .select(`
                    id,
                    quantity,
                    updated_at,
                    warehouses (name),
                    materials!inner (*)
                `, { count: 'exact' })
                .gt('quantity', 0)
                .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
                .order('updated_at', { ascending: false });

            if (query.length >= 1) {
                supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`, { foreignTable: 'materials' });
            }

            const { data, error, count } = await supabaseQuery;

            if (error) throw error;
            setResults(data || []);
            setHasMore(count ? (pageNum + 1) * ITEMS_PER_PAGE < count : false);
        } catch (err) {
            console.error('Error in global search:', err);
            toast.error('Error al realizar la búsqueda global');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchGlobalStock(search, 0);
        }, 300);

        // Set up Realtime subscription
        const channel = supabase
            .channel('global_stock_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory'
                },
                () => {
                    fetchGlobalStock(search, page);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'materials'
                },
                () => {
                    fetchGlobalStock(search, page);
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timer);
            supabase.removeChannel(channel);
        };
    }, [search, refreshTrigger]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchGlobalStock(search, newPage);
    };

    const handleGlobalExport = async () => {
        setExporting(true);
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select(`
          quantity,
          updated_at,
          warehouses (name),
          materials!inner (*)
        `)
                .gt('quantity', 0);

            if (error) throw error;
            if (!data || data.length === 0) {
                toast.error('No hay datos para exportar');
                return;
            }

            await exportToExcel(data as any, 'Consolidado_General', true);
            toast.success('Reporte global generado con éxito');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Error al exportar todos los almacenes');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1 relative">
                    <label className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-2 block ml-1">
                        Buscador Global de Materiales
                    </label>
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-50" />
                        <Input
                            placeholder="Buscar por código o descripción en toda la empresa..."
                            className="h-14 rounded-2xl bg-muted/20 border-primary/20 font-bold text-lg pl-12 pr-6 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <Button
                    onClick={handleGlobalExport}
                    disabled={exporting}
                    className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 flex gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {exporting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    ) : (
                        <Globe className="w-5 h-5" />
                    )}
                    {exporting ? 'Procesando...' : 'Exportar Todo (Excel)'}
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/5 shadow-xl">
                <div className="overflow-x-auto">
                    <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow className="bg-muted/30 border-b border-border/50">
                                    <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground w-[120px]">Almacén</TableHead>
                                    <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground">Material / Código</TableHead>
                                    <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[80px]">Stock</TableHead>
                                    <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[100px]">P. Unit</TableHead>
                                    <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[110px]">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && results.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-xs font-bold uppercase tracking-widest animate-pulse text-primary">
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                                Escaneando almacenes...
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ) : results.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground italic text-sm">
                                            No se encontraron materiales con stock.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    results.map((item) => (
                                        <TableRow key={item.id} className="group border-b border-border/30 hover:bg-primary/5 transition-colors">
                                            <TableCell className="py-2 px-4">
                                                <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-tighter block text-center truncate">
                                                    {item.warehouses?.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-4">
                                                <p className="font-black text-xs uppercase tracking-tight truncate max-w-[250px]">
                                                    {item.materials.name}
                                                </p>
                                                {item.materials.is_used && (
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                                                        ⚠ MATERIAL USADO
                                                    </p>
                                                )}
                                                <p className="text-[9px] text-muted-foreground font-medium italic truncate max-w-[250px]">
                                                    {item.materials.description || '-'}
                                                </p>
                                            </TableCell>

                                            <TableCell className="py-2 px-4 text-right">
                                                <span className={`text-sm font-black ${item.quantity <= 5 ? 'text-destructive' : 'text-primary'}`}>
                                                    {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-4 text-right">
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    S/. {(item.materials?.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-4 text-right">
                                                <span className="text-sm font-black text-primary">
                                                    S/. {(item.quantity * (item.materials?.unit_price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-4 border-t border-border/50">
                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                    Página {page + 1}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0 || loading}
                        className="text-[10px] font-black uppercase tracking-widest h-8"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasMore || loading}
                        className="text-[10px] font-black uppercase tracking-widest h-8"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
