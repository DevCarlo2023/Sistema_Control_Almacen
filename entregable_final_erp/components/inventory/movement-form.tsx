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

import { db } from '@/lib/offline-db';
import { useOfflineSync } from '@/hooks/use-offline-sync';

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
  const { performOperation } = useOfflineSync();
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  
  // State for multi-item list
  interface MovementItem {
    material: Material;
    quantity: number;
  }
  const [items, setItems] = useState<MovementItem[]>([]);
  
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Add Item to List
  const handleAddItem = () => {
    if (!selectedMaterial) return;
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Ingresa una cantidad mayor a 0 para añadir');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (items.length >= 10) {
      setError('Se alcanzó el límite de 10 productos por movimiento');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (items.some(i => i.material.id === selectedMaterial.id)) {
      setError('Este material ya fue añadido a la lista abajo');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setItems([...items, { material: selectedMaterial, quantity: parseFloat(quantity) }]);
    onSelectMaterial(null);
    setQuantity('');
    setError('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.material.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!warehouseId) {
      setError('Por favor selecciona un almacén');
      return;
    }

    if (items.length === 0) {
      setError('Por favor añade al menos un material a la lista');
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

      for (const item of items) {
        // Check Inventory (Hybrid approach)
        let currentQuantity = 0;
        let inventoryRecord: any = null;

        if (navigator.onLine) {
          const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('warehouse_id', warehouseId)
            .eq('material_id', item.material.id)
            .single();
          inventoryRecord = data;
          currentQuantity = data?.quantity || 0;
        } else {
          // Offline check using Dexie
          const localInv = await db.inventory
            .where({ warehouse_id: warehouseId, material_id: item.material.id })
            .first();
          inventoryRecord = localInv;
          currentQuantity = localInv?.quantity || 0;
        }

        if (movementType === 'salida' && currentQuantity < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.material.name}. Disponible: ${currentQuantity}`);
        }

        const newQuantity =
          movementType === 'entrada'
            ? currentQuantity + item.quantity
            : currentQuantity - item.quantity;

        // Register Movement
        const movementData = {
          warehouse_id: warehouseId,
          material_id: item.material.id,
          movement_type: movementType,
          quantity: item.quantity,
          notes: formatText(notes) || null,
          user_id: user.id,
        };

        await performOperation('inventory_movements', 'INSERT', movementData);

        // Update Inventory
        const invData = inventoryRecord
          ? { ...inventoryRecord, quantity: newQuantity }
          : { warehouse_id: warehouseId, material_id: item.material.id, quantity: newQuantity };

        const action = inventoryRecord ? 'UPDATE' : 'INSERT';
        await performOperation('inventory', action, invData);
      }

      setSuccess(true);
      setItems([]);
      setNotes('');
      onMovementSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar el movimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
        <div className="md:col-span-1 space-y-1.5 md:space-y-2">
          <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Tipo de Operación</label>
          <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
            <SelectTrigger className="h-10 bg-white dark:bg-slate-900 border-border rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada" className="font-bold text-green-600">▲ Entrada</SelectItem>
              <SelectItem value="salida" className="font-bold text-destructive">▼ Salida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5 md:space-y-2">
          <label className="text-[9px] md:text-[10px] uppercase font-black text-zinc-800 tracking-widest ml-1">Buscar Producto (Código o Nombre)</label>
          <MaterialSearch
            onSelectMaterial={onSelectMaterial}
            selectedMaterial={selectedMaterial}
          />
        </div>

        <div className="md:col-span-1 space-y-1.5 md:space-y-2">
          <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Cantidad neta</label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            className="h-10 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-lg"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      {selectedMaterial && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-zinc-100/80 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 w-full">
            <div className="bg-zinc-900 text-white h-10 w-10 flex-[0_0_40px] rounded flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-black uppercase text-center leading-tight">
                {selectedMaterial.unit_of_measure}
              </span>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[11px] font-black uppercase tracking-tight truncate leading-tight">{selectedMaterial.name}</p>
              <p className="text-[9px] text-muted-foreground font-medium italic truncate">{selectedMaterial.description}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded text-zinc-400 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { onSelectMaterial(null); setQuantity(''); }}
                title="Cancelar"
              >
                ✕
              </Button>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-8 px-4 bg-zinc-900 text-white rounded text-[9px] font-black uppercase tracking-widest shadow-sm hover:translate-y-[-1px] transition-transform"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Item List */}
      {items.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Productos a {movementType === 'entrada' ? 'Ingresar' : 'Retirar'} ({items.length}/10)
            </h4>
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto compact-scrollbar pr-1">
            {items.map((item, index) => (
              <div key={item.material.id} className="flex items-center justify-between bg-white border border-zinc-200 p-2 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-zinc-300 ml-1">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="bg-zinc-100 text-zinc-700 h-8 w-8 rounded flex items-center justify-center border border-zinc-200 shrink-0">
                    <span className="text-[8px] font-black uppercase">{item.material.unit_of_measure}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-zinc-900 uppercase truncate leading-none mb-0.5">{item.material.name}</p>
                    {item.material.description && (
                      <p className="text-[8.5px] font-bold text-zinc-500 italic truncate mb-0.5">{item.material.description}</p>
                    )}
                    <p className="text-[9px] font-black text-primary">CANTIDAD: {item.quantity}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.material.id)}
                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded shrink-0 transition-colors"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center pt-1 md:pt-2">
        <div className="flex-1 w-full space-y-1.5 md:space-y-2">
          <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Notas de Auditoría (Opcional)</label>
          <Input
            type="text"
            placeholder="Ej: Entrega de proveedor..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-10 bg-white dark:bg-slate-900 border-border rounded-xl"
          />
        </div>
        <div className="w-full md:w-auto md:pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !warehouseId || items.length === 0}
            className={`
              h-11 flex items-center justify-center w-full md:w-56 rounded-xl font-black uppercase tracking-widest text-[10px] text-white transition-all duration-300 shadow-sm hover:-translate-y-0.5
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
              ${movementType === 'entrada'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando</span>
              </div>
            ) : (
              `Registrar ${items.length} Item${items.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 md:p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-[11px] md:text-sm font-bold flex items-center gap-3">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-3 md:p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-[11px] md:text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
          <span className="text-lg">✅</span> Registro exitoso
        </div>
      )}
    </div>
  );
}
