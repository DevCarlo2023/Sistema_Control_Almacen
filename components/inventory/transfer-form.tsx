'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialSearch } from '@/components/inventory/material-search';
import { WarehouseSelector } from '@/components/inventory/warehouse-selector';
import { toast } from 'sonner';

interface TransferFormProps {
    fromWarehouseId: string;
    selectedMaterial: Material | null;
    onSelectMaterial: (material: Material | null) => void;
    onTransferSuccess: () => void;
}

export function TransferForm({
    fromWarehouseId,
    selectedMaterial,
    onSelectMaterial,
    onTransferSuccess,
}: TransferFormProps) {
    const [toWarehouseId, setToWarehouseId] = useState('');
    
    // State for multi-item list
    interface TransferItem {
        material: Material;
        quantity: number;
    }
    const [items, setItems] = useState<TransferItem[]>([]);
    
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
            setError('Se alcanzó el límite de 10 productos por traslado');
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

        if (!fromWarehouseId) {
            setError('Por favor selecciona un almacén de origen');
            return;
        }

        if (!toWarehouseId) {
            setError('Por favor selecciona un almacén de destino');
            return;
        }

        if (fromWarehouseId === toWarehouseId) {
            setError('El origen y el destino deben ser diferentes');
            return;
        }

        if (items.length === 0) {
            setError('Por favor añade al menos un material a la lista');
            return;
        }

        setLoading(true);

        try {
            for (const item of items) {
                const response = await fetch('/api/inventory/transfer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_warehouse_id: fromWarehouseId,
                        to_warehouse_id: toWarehouseId,
                        material_id: item.material.id,
                        quantity: item.quantity,
                        notes: notes.trim() || undefined
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || `Error al procesar el traslado de ${item.material.name}`);
                }
            }

            setSuccess(true);
            setItems([]);
            setNotes('');
            onTransferSuccess();
            toast.success('Traslado realizado con éxito');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Transfer Error:', err);
            setError(err.message || 'Error al procesar el traslado.');
            toast.error(err.message || 'Error al procesar el traslado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-end">

                {/* Destination Warehouse */}
                <div className="md:col-span-3 space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1 flex items-center gap-1">
                        <span className="text-primary">➡️</span> Almacén de Destino
                    </label>
                    <WarehouseSelector
                        value={toWarehouseId}
                        onWarehouseChange={setToWarehouseId}
                    />
                </div>

                {/* Material Search */}
                <div className="md:col-span-6 space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] uppercase font-black text-primary tracking-widest ml-1">Producto a trasladar</label>
                    <MaterialSearch
                        onSelectMaterial={onSelectMaterial}
                        selectedMaterial={selectedMaterial}
                    />
                </div>

                {/* Quantity */}
                <div className="md:col-span-3 space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Cantidad</label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="h-10 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary/20"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                </div>
            </div>

            {selectedMaterial && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-zinc-100/80 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 w-full">
                        <div className="bg-zinc-900 text-white h-10 w-10 flex-[0_0_40px] rounded flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-[10px] font-black uppercase text-center leading-tight">
                                {selectedMaterial.unit_of_measure}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-black uppercase tracking-tight truncate leading-tight">{selectedMaterial.name}</p>
                                {selectedMaterial.is_used && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-500 text-white shadow-sm shrink-0">USADO</span>
                                )}
                            </div>
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
                            Productos a Trasladar ({items.length}/10)
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
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-[10px] font-black text-zinc-900 uppercase truncate leading-none mb-0.5">{item.material.name}</p>
                                            {item.material.is_used && (
                                                <span className="px-1 py-0.5 rounded-sm text-[7px] font-black bg-amber-500 text-white leading-none">USADO</span>
                                            )}
                                        </div>
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

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center pt-2">
                <div className="flex-1 w-full space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Referencia o Motivo del Traslado</label>
                    <Input
                        type="text"
                        placeholder="Ej: Reabastecimiento de oficina, préstamo temporal..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-10 bg-white dark:bg-slate-900 border-border rounded-xl focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="w-full md:w-auto md:pt-6">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !fromWarehouseId || !toWarehouseId || items.length === 0}
                        className="h-11 flex items-center justify-center w-full md:w-64 rounded-xl font-black uppercase tracking-widest text-[10px] text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Procesando Traslado</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>⚡ Trasladar {items.length} Item{items.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 md:p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-[11px] md:text-sm font-bold flex items-center gap-3 animate-in shake-1">
                    <span className="text-lg">⚠️</span> {error}
                </div>
            )}

            {success && (
                <div className="p-3 md:p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-[11px] md:text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
                    <span className="text-lg">✅</span> Traslado registrado correctamente
                </div>
            )}
        </div>
    );
}
