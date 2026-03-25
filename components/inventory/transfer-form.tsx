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
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
            const response = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_warehouse_id: fromWarehouseId,
                    to_warehouse_id: toWarehouseId,
                    material_id: selectedMaterial.id,
                    quantity: parseFloat(quantity),
                    notes: notes.trim() || undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al procesar el traslado');
            }

            setSuccess(true);
            setQuantity('');
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
                        className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary/20"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                </div>
            </div>

            {selectedMaterial && (
                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-primary/10 rounded-2xl border border-primary/20 glass animate-in fade-in slide-in-from-top-2">
                    <div className="bg-primary text-primary-foreground h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shadow-lg glow-primary shrink-0">
                        <span className="text-[9px] md:text-[10px] font-black uppercase text-center leading-tight">
                            {selectedMaterial.unit_of_measure}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-xs md:text-sm font-black uppercase tracking-tight truncate">{selectedMaterial.name}</p>
                            {selectedMaterial.is_used && (
                                <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-500 text-white shadow-sm">USADO</span>
                            )}
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium italic truncate">{selectedMaterial.description}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onSelectMaterial(null)}
                    >
                        ✕
                    </Button>
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
                        className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="w-full md:w-auto md:pt-6">
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !fromWarehouseId || !toWarehouseId || !selectedMaterial}
                        className="h-12 w-full md:w-64 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Procesando Traslado</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>⚡ Procesar Traslado</span>
                            </div>
                        )}
                    </Button>
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
