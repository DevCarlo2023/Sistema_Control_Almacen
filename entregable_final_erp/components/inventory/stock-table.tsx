'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type InventoryItem } from '@/lib/types';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getStockThreshold } from '@/lib/utils';

interface StockTableProps {
  warehouseId: string;
  refreshTrigger: number;
}

export function StockTable({ warehouseId, refreshTrigger }: StockTableProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [warehouseInfo, setWarehouseInfo] = useState<any>(null);

  useEffect(() => {
    const fetchWarehouseInfo = async () => {
      if (!warehouseId) return;
      const { data } = await supabase.from('warehouses').select('name').eq('id', warehouseId).single();
      if (data) setWarehouseInfo(data);
    };
    fetchWarehouseInfo();
  }, [warehouseId]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!warehouseId) {
        setInventory([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select(
            `
            id,
            warehouse_id,
            material_id,
            quantity,
            updated_at,
            materials (*)
          `
          )
          .eq('warehouse_id', warehouseId)
          .order('materials(name)');

        if (error) throw error;
        setInventory((data as any) || []);
      } catch (err: any) {
        console.error('Error fetching inventory:', err);
        if (err.message?.includes('unit_price')) {
          toast.error('⚠️ Acción Requerida: Debes agregar la columna unit_price en Supabase.');
        }
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();

    // Set up Realtime subscription
    const channel = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `warehouse_id=eq.${warehouseId}`
        },
        () => {
          fetchInventory();
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
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [warehouseId, refreshTrigger]);

  if (!warehouseId) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Selecciona un almacén para ver el stock
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Cargando inventario...
      </Card>
    );
  }

  const filteredInventory = inventory.filter((item) => {
    const material = (item as any).materials;
    const searchLower = searchQuery.toLowerCase();
    return (
      material?.name?.toLowerCase().includes(searchLower) ||
      material?.description?.toLowerCase().includes(searchLower)
    );
  });

  if (inventory.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No hay materiales en este almacén
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Stock Disponible</h3>
          {warehouseInfo && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{warehouseInfo.name}</span>
          )}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            className="pl-10 h-10 rounded-xl bg-background/50 border-border/50 font-bold text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/50">
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground w-[120px]">Código</TableHead>
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground">Descripción</TableHead>
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground w-[80px]">Und.</TableHead>
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[80px]">Cant.</TableHead>
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[100px]">P. Unit</TableHead>
              <TableHead className="py-3 px-3 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground text-right w-[110px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground italic text-sm">
                  No se encontraron materiales que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const qty = item.quantity;
                const mat = (item as any).materials;
                const threshold = getStockThreshold(`${mat?.name || ''} ${mat?.description || ''}`);
                const isVeryLow = qty < threshold;
                const isLow = qty < threshold * 2;

                return (
                  <TableRow
                    key={item.id}
                    className={`
                      group border-b border-border/30 hover:bg-primary/5 transition-colors duration-200
                      ${isVeryLow ? 'bg-destructive/5 hover:bg-destructive/10' : isLow ? 'bg-orange-500/5 hover:bg-orange-500/10' : ''}
                    `}
                  >
                    <TableCell className="py-2 px-3 font-bold">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm tracking-tight uppercase">{(item as any).materials?.name || 'N/A'}</span>
                        <div className="flex gap-2">
                          {(item as any).materials?.is_used && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-white shadow-sm">
                              USADO
                            </span>
                          )}
                          {isVeryLow && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-destructive text-destructive-foreground animate-pulse-slow shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                              ⚠️ CRÍTICO
                            </span>
                          )}
                          {!isVeryLow && isLow && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                              ⚠ BAJO
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-sm text-muted-foreground font-medium italic group-hover:text-foreground transition-colors">
                        {(item as any).materials?.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-[11px] font-bold uppercase py-1 px-2 bg-muted rounded-md text-muted-foreground">
                        {(item as any).materials?.unit_of_measure || ''}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-3 text-right">
                      <div className={`
                        text-lg font-black tracking-tight
                        ${isVeryLow ? 'text-destructive' : isLow ? 'text-orange-500' : 'text-primary'}
                      `}>
                        {item.quantity.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-xs font-bold text-muted-foreground">
                        S/. {((item as any).materials?.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-black text-primary">
                        S/. {(item.quantity * ((item as any).materials?.unit_price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <tfoot className="bg-primary/5 border-t border-border/50">
            <TableRow>
              <TableCell colSpan={5} className="py-6 px-6 text-right text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                Valoración Total del Stock:
              </TableCell>
              <TableCell className="py-6 px-6 text-right">
                <span className="text-lg font-black text-primary glow-primary">
                  S/. {filteredInventory.reduce((acc, item) => acc + (item.quantity * ((item as any).materials?.unit_price || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </div>
    </div>
  );
}
