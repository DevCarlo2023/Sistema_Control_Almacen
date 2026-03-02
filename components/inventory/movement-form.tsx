'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
import { formatText } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { MaterialSearch } from '@/components/inventory/material-search';

interface MovementFormProps {
  warehouseId: string;
  selectedMaterial: Material | null;
  onSelectMaterial: (material: Material | null) => void;
  onMovementSuccess: () => void;
}

export function MovementForm({
  warehouseId,
  selectedMaterial,
  onSelectMaterial,
  onMovementSuccess,
}: MovementFormProps) {
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!warehouseId) {
      setError('Por favor selecciona un almacén');
      return;
    }

    if (!selectedMaterial) {
      setError('Por favor selecciona un material');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      const quantityNum = parseFloat(quantity);

      // Create movement record
      const { error: movementError } = await supabase.from('inventory_movements').insert({
        warehouse_id: warehouseId,
        material_id: selectedMaterial.id,
        movement_type: movementType,
        quantity: quantityNum,
        notes: formatText(notes) || null,
        user_id: user.id,
      });

      if (movementError) throw movementError;

      // Update inventory
      const { data: currentInventory } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('warehouse_id', warehouseId)
        .eq('material_id', selectedMaterial.id)
        .single();

      const currentQuantity = currentInventory?.quantity || 0;

      if (movementType === 'salida' && currentQuantity < quantityNum) {
        setError(`Stock insuficiente en este almacén. Disponible: ${currentQuantity}`);
        setLoading(false);
        return;
      }

      const newQuantity =
        movementType === 'entrada'
          ? currentQuantity + quantityNum
          : currentQuantity - quantityNum;

      if (currentInventory) {
        await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', currentInventory.id);
      } else {
        if (movementType === 'entrada') {
          await supabase.from('inventory').insert({
            warehouse_id: warehouseId,
            material_id: selectedMaterial.id,
            quantity: quantityNum,
          });
        }
      }

      setSuccess(true);
      setQuantity('');
      setNotes('');
      onMovementSuccess();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar el movimiento. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="md:col-span-1 space-y-2">
          <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Tipo de Operación</label>
          <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
            <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada" className="font-bold text-green-600">▲ Entrada</SelectItem>
              <SelectItem value="salida" className="font-bold text-destructive">▼ Salida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Buscar Producto (Código o Nombre)</label>
          <MaterialSearch
            onSelectMaterial={onSelectMaterial}
            selectedMaterial={selectedMaterial}
          />
        </div>

        <div className="md:col-span-1 space-y-2">
          <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Cantidad neta</label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-lg"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      {selectedMaterial && (
        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 glass animate-in fade-in slide-in-from-top-2">
          <div className="bg-primary text-primary-foreground h-12 w-12 rounded-xl flex items-center justify-center shadow-lg glow-primary">
            <span className="text-[10px] font-black uppercase text-center leading-tight">
              {selectedMaterial.unit_of_measure}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-tight">{selectedMaterial.name}</p>
            <p className="text-xs text-muted-foreground font-medium italic">{selectedMaterial.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onSelectMaterial(null)}
          >
            ✕
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-center pt-2">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Notas de Auditoría (Opcional)</label>
          <Input
            type="text"
            placeholder="Ej: Entrega de proveedor / Salida de taller..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl"
          />
        </div>
        <div className="w-full md:w-auto md:pt-6">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !warehouseId || !selectedMaterial}
            className={`
              h-12 w-full md:w-56 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300
              ${movementType === 'entrada'
                ? 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)]'
                : 'bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando</span>
              </div>
            ) : (
              `Ejecutar ${movementType}`
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-bold flex items-center gap-3">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
          <span className="text-xl">✅</span> Registro exitoso en la base de datos
        </div>
      )}
    </div>
  );
}
