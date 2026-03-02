'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { formatText } from '@/lib/utils';

interface ImportButtonProps {
    warehouseId: string;
    onImportSuccess: () => void;
}

export function ImportButton({ warehouseId, onImportSuccess }: ImportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const template = [
            {
                codigo: 'Calamina Galvanizada',
                descripcion: 'Calamina de 0.3mm x 3m',
                unidad_medida: 'Placa',
                ubicacion: 'Estante A-1',
                precio_unitario: 15.50,
                cantidad_inicial: 100
            },
            {
                codigo: 'Cemento Sol',
                descripcion: 'Bolsa de 42.5kg',
                unidad_medida: 'Bolsa',
                ubicacion: 'Zona Piso 1',
                precio_unitario: 42.50,
                cantidad_inicial: 50
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_carga_inventario.xlsx');
    };

    const handleRevertLastImport = async () => {
        if (!warehouseId) {
            toast.error('Selecciona un almacén primero');
            return;
        }

        setReverting(true);
        setShowConfirm(false);

        try {
            // 1. Find the most recent import batch date
            const { data: lastImport, error: fetchError } = await supabase
                .from('inventory_movements')
                .select('created_at')
                .eq('warehouse_id', warehouseId)
                .eq('notes', 'Carga masiva desde Excel')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (!lastImport) {
                toast.info('No se encontró ninguna carga masiva para este almacén.');
                setReverting(false);
                return;
            }

            // 2. Find all movements from that same import session (within 5 minutes)
            const importTime = new Date(lastImport.created_at);
            const windowStart = new Date(importTime.getTime() - 5 * 60 * 1000).toISOString();

            const { data: batchMovements, error: batchError } = await supabase
                .from('inventory_movements')
                .select('id, material_id, quantity')
                .eq('warehouse_id', warehouseId)
                .eq('notes', 'Carga masiva desde Excel')
                .gte('created_at', windowStart)
                .lte('created_at', importTime.toISOString());

            if (batchError) throw batchError;

            if (!batchMovements || batchMovements.length === 0) {
                toast.info('No se encontraron movimientos para revertir.');
                setReverting(false);
                return;
            }

            let revertedCount = 0;

            // 3. For each movement, subtract the quantity from inventory
            for (const mov of batchMovements) {
                const { data: invData } = await supabase
                    .from('inventory')
                    .select('id, quantity')
                    .eq('warehouse_id', warehouseId)
                    .eq('material_id', mov.material_id)
                    .maybeSingle();

                if (invData) {
                    const newQty = invData.quantity - mov.quantity;
                    if (newQty <= 0) {
                        // Remove the inventory record entirely
                        await supabase.from('inventory').delete().eq('id', invData.id);
                    } else {
                        await supabase
                            .from('inventory')
                            .update({ quantity: newQty, updated_at: new Date().toISOString() })
                            .eq('id', invData.id);
                    }
                }

                // 4. Delete the movement record
                await supabase.from('inventory_movements').delete().eq('id', mov.id);
                revertedCount++;
            }

            toast.success(`✅ Carga revertida: ${revertedCount} registros eliminados del stock.`);
            onImportSuccess();
        } catch (err: any) {
            console.error('Revert error:', err);
            toast.error(`Error al revertir: ${err.message || 'Error desconocido'}`);
        } finally {
            setReverting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !warehouseId) {
            if (!warehouseId) toast.error('Selecciona un almacén primero');
            return;
        }

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                if (data.length === 0) {
                    toast.error('El archivo está vacío');
                    setLoading(false);
                    return;
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    toast.error('Sesión expirada. Por favor inicia sesión de nuevo.');
                    setLoading(false);
                    return;
                }

                let successCount = 0;
                let errorCount = 0;
                let lastErrorMessage = '';

                for (const row of data) {
                    try {
                        const getValue = (key: string) => {
                            const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
                            return foundKey ? String(row[foundKey]).trim() : '';
                        };

                        const nombre = formatText(getValue('codigo'));
                        const descripcion = formatText(getValue('descripcion'));
                        const unidad_medida = getValue('unidad_medida') || 'Unidad';
                        const ubicacion = formatText(getValue('ubicacion'));
                        const unit_price = parseFloat(getValue('precio_unitario')) || 0;
                        const cantidad_inicial = getValue('cantidad_inicial');

                        if (!nombre || nombre === '') {
                            continue;
                        }

                        // 1. Create or get material
                        const { data: materialData, error: materialFetchError } = await supabase
                            .from('materials')
                            .select('id')
                            .eq('name', nombre)
                            .maybeSingle();

                        if (materialFetchError) throw materialFetchError;

                        let materialId = materialData?.id;

                        if (!materialId) {
                            const { data: newMaterial, error: materialCreateError } = await supabase
                                .from('materials')
                                .insert({
                                    name: nombre,
                                    description: descripcion,
                                    unit_of_measure: unidad_medida,
                                    location: ubicacion,
                                    unit_price: unit_price
                                })
                                .select('id')
                                .single();

                            if (materialCreateError) throw materialCreateError;
                            materialId = newMaterial.id;
                        }

                        // 2. Update/Insert inventory
                        const qty = parseFloat(cantidad_inicial) || 0;
                        if (qty > 0) {
                            const { data: invData, error: invFetchError } = await supabase
                                .from('inventory')
                                .select('id, quantity')
                                .eq('warehouse_id', warehouseId)
                                .eq('material_id', materialId)
                                .maybeSingle();

                            if (invFetchError) throw invFetchError;

                            if (invData) {
                                const { error: invUpdateError } = await supabase
                                    .from('inventory')
                                    .update({
                                        quantity: invData.quantity + qty,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', invData.id);

                                if (invUpdateError) throw invUpdateError;
                            } else {
                                const { error: invInsertError } = await supabase
                                    .from('inventory')
                                    .insert({
                                        warehouse_id: warehouseId,
                                        material_id: materialId,
                                        quantity: qty
                                    });

                                if (invInsertError) throw invInsertError;
                            }

                            // 3. Register movement
                            const { error: movementError } = await supabase.from('inventory_movements').insert({
                                warehouse_id: warehouseId,
                                material_id: materialId,
                                movement_type: 'entrada',
                                quantity: qty,
                                notes: 'Carga masiva desde Excel',
                                user_id: user.id
                            });

                            if (movementError) throw movementError;
                        }
                        successCount++;
                    } catch (err: any) {
                        console.error('Error in row:', row, err);
                        errorCount++;
                        if (!lastErrorMessage) {
                            lastErrorMessage = err.message || 'Error desconocido';
                        }
                    }
                }

                if (successCount > 0) {
                    toast.success(`Carga completada: ${successCount} filas procesadas.`);
                }

                if (errorCount > 0) {
                    toast.error(`${errorCount} filas fallaron. Motivo: ${lastErrorMessage}`);
                }

                onImportSuccess();
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err) {
                console.error('Import error:', err);
                toast.error('Error al procesar el archivo Excel');
            } finally {
                setLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    onClick={downloadTemplate}
                >
                    <FileDown className="w-3.5 h-3.5" />
                    Descargar Plantilla Excel
                </Button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={loading || !warehouseId}
                    />
                    <Button
                        variant="default"
                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-green-600 hover:bg-green-700 shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(22,163,74,0.5)] transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || !warehouseId}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {loading ? 'Importando...' : 'Subir Excel e Importar'}
                    </Button>
                </div>

                {/* Revert last import button */}
                {!showConfirm ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all"
                        onClick={() => setShowConfirm(true)}
                        disabled={reverting || !warehouseId}
                    >
                        {reverting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                        {reverting ? 'Revirtiendo...' : 'Revertir Última Carga'}
                    </Button>
                ) : (
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700 font-bold leading-snug">
                                ¿Eliminar la última carga masiva de este almacén? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 rounded-lg"
                                onClick={handleRevertLastImport}
                            >
                                Sí, eliminar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {!warehouseId && (
                <p className="text-[10px] text-center text-muted-foreground font-bold uppercase opacity-60 tracking-widest italic animate-pulse">
                    Selección de almacén requerida
                </p>
            )}
        </div>
    );
}
