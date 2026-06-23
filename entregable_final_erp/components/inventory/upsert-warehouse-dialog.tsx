'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Warehouse } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Warehouse, Loader2, Save, X, Info, MapPin } from 'lucide-react';

interface UpsertWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
  onSuccess: () => void;
}

export function UpsertWarehouseDialog({ open, onOpenChange, warehouse, onSuccess }: UpsertWarehouseDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || '');
      setLocation(warehouse.location || '');
    } else {
      setName('');
      setLocation('');
    }
  }, [warehouse, open]);

  const handleSave = async () => {
    if (!name || !location) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim().toUpperCase(),
        location: location.trim().toUpperCase(),
      };

      if (warehouse?.id) {
        const { error } = await supabase
          .from('warehouses')
          .update(payload)
          .eq('id', warehouse.id);
        if (error) throw error;
        toast.success('Almacén actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('warehouses')
          .insert([payload]);
        if (error) throw error;
        toast.success('Almacén creado correctamente');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving warehouse:', err);
      toast.error(err.message || 'Error al guardar el almacén');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-zinc-100 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-cyan-900 border-b border-cyan-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Warehouse className="w-24 h-24 text-white -rotate-12" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                <Warehouse className="w-5 h-5 text-white" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">
                  {warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}
                </DialogTitle>
                <DialogDescription className="text-xs text-cyan-200/60 font-medium italic">
                  Definición de ubicaciones físicas para control de inventario.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-cyan-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700">Configuración de Ubicación</span>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nombre del Almacén</Label>
                <div className="relative group">
                  <Input 
                    placeholder="EJ. ALMACÉN CENTRAL" 
                    className="rounded-xl h-12 font-bold text-xs bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-cyan-500 transition-all uppercase pl-10" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Warehouse className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-cyan-600 transition-colors" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Ubicación Física / Dirección</Label>
                <div className="relative group">
                  <Textarea 
                    placeholder="Ej. Sede Principal - Sector A / Lima, Perú" 
                    className="rounded-xl min-h-[100px] font-medium text-xs resize-none bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-cyan-500 transition-all uppercase pl-10 pt-3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <MapPin className="absolute left-3.5 top-4 w-4 h-4 text-zinc-400 group-focus-within:text-cyan-600 transition-colors" />
                </div>
                <p className="text-[9px] text-zinc-400 font-bold italic uppercase tracking-tighter ml-1">Sea específico para facilitar la localización de los activos.</p>
             </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-zinc-200 hover:bg-white transition-all text-zinc-500"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 h-12 rounded-xl bg-cyan-900 font-black uppercase text-[10px] tracking-widest text-white shadow-xl hover:-translate-y-0.5 active:scale-95 hover:bg-cyan-950 transition-all gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {warehouse ? 'Guardar Cambios' : 'Registrar Almacén'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
