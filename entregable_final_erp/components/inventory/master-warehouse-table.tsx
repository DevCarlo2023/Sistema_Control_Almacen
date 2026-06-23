'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Warehouse } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { 
  Search, Plus, Edit2, Trash2, Warehouse, MapPin, 
  Loader2, RotateCcw, Trash, Download, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpsertWarehouseDialog } from './upsert-warehouse-dialog';

export function MasterWarehouseTable() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Warehouse | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (err: any) {
      toast.error('Error al cargar almacenes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este almacén? Esto podría afectar a los equipos vinculados.')) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Almacén eliminado');
      fetchWarehouses();
    } catch (err: any) {
      toast.error('Error al eliminar');
      console.error(err);
    }
  };

  const filteredItems = warehouses.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── Header Actions ──────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Buscar por nombre o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 md:h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-xs md:text-sm font-medium w-full shadow-inner"
            />
          </div>

          <Button
            onClick={() => { setEditingItem(null); setDialogOpen(true); }}
            className="h-12 md:h-14 px-8 rounded-2xl bg-cyan-900 text-white font-black uppercase text-[10px] md:text-xs tracking-widest gap-2 shadow-xl hover:-translate-y-1 active:scale-95 transition-all w-full lg:w-auto shrink-0"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Nuevo Almacén</span>
          </Button>
        </div>
      </div>

      {/* ── Main List Container ────────────────────────── */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Card className="rounded-[2rem] border-zinc-100 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100">
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 w-[60px] text-center">#</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 font-outfit">ALMACÉN / IDENTIFICACIÓN</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 font-outfit">UBICACIÓN FÍSICA</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-center w-[150px] font-outfit">FECHA REGISTRO</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-right w-[150px] font-outfit">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                           <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                           <span className="text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">Cargando almacenes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">
                        No se encontraron almacenes registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, index) => (
                      <TableRow 
                        key={item.id} 
                        className="group border-b border-zinc-50 hover:bg-cyan-50/20 transition-colors duration-200"
                      >
                        <TableCell className="py-4 px-6 text-center text-[10px] font-black text-zinc-200">{index + 1}</TableCell>
                        <TableCell className="py-4 px-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100 group-hover:bg-cyan-100 transition-colors">
                                 <Warehouse className="w-5 h-5 text-cyan-700" />
                              </div>
                              <span className="text-[13px] font-semibold text-zinc-950 uppercase tracking-tight font-outfit">{item.name}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                           <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-[11px] font-medium text-zinc-500 uppercase font-outfit">{item.location}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                           <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">
                              {new Date(item.created_at).toLocaleDateString()}
                           </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-9 w-9 text-zinc-400 hover:text-cyan-800 hover:bg-white border rounded-xl shadow-sm transition-all"
                               onClick={() => { setEditingItem(item); setDialogOpen(true); }}
                             >
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                               onClick={() => handleDelete(item.id)}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Mobile View (Cards) */}
        <div className="lg:hidden space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[1.5rem] border border-zinc-100 shadow-sm space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-cyan-900 flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <Warehouse className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-sm font-black text-zinc-950 uppercase leading-tight">{item.name}</span>
                  </div>
                  <div className="flex gap-1">
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-10 w-10 text-cyan-700 bg-cyan-50 rounded-lg"
                       onClick={() => { setEditingItem(item); setDialogOpen(true); }}
                     >
                       <Edit2 className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-10 w-10 text-red-500 bg-red-50 rounded-lg"
                       onClick={() => handleDelete(item.id)}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
               <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{item.location}</span>
               </div>
            </div>
          ))}
        </div>
      </div>

      <UpsertWarehouseDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editingItem}
        onSuccess={fetchWarehouses}
      />
    </div>
  );
}
