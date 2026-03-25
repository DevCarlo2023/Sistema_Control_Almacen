'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Loader2, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { formatText } from '@/lib/utils';

interface ImportButtonProps {
    warehouseId: string;
    onImportSuccess: () => void;
}

export function ImportButton({ warehouseId, onImportSuccess }: ImportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false); // For Revert
    const [importPreview, setImportPreview] = useState<any[] | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false); // For Import
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

            // 2. Find all movements from that same import session (within 10 minutes)
            const importTime = new Date(lastImport.created_at);
            const windowStart = new Date(importTime.getTime() - 10 * 60 * 1000).toISOString();

            const { data: batchMovements, error: batchError } = await supabase
                .from('inventory_movements')
                .select('id, material_id, quantity')
                .eq('warehouse_id', warehouseId)
                .eq('notes', 'Carga masiva desde Excel')
                .gte('created_at', windowStart)
                .lte('created_at', lastImport.created_at);

            if (batchError) throw batchError;

            if (!batchMovements || batchMovements.length === 0) {
                toast.info('No se encontraron movimientos para revertir.');
                setReverting(false);
                return;
            }

            console.log(`Reverting ${batchMovements.length} movements in chunks...`);

            // 3. Consolidate quantities to subtract
            const subtractionMap = new Map<string, number>();
            for (const mov of batchMovements) {
                const current = subtractionMap.get(mov.material_id) || 0;
                subtractionMap.set(mov.material_id, current + mov.quantity);
            }

            // 4. Chunked Processing
            const materialIds = Array.from(subtractionMap.keys());
            const CHUNK_SIZE = 100;
            const inventoryUpdates: any[] = [];
            const inventoryDeletions: any[] = [];

            for (let i = 0; i < materialIds.length; i += CHUNK_SIZE) {
                const chunk = materialIds.slice(i, i + CHUNK_SIZE);

                // Fetch inventory for this chunk
                const { data: currentInv, error: invFetchErr } = await supabase
                    .from('inventory')
                    .select('material_id, quantity, id')
                    .eq('warehouse_id', warehouseId)
                    .in('material_id', chunk);

                if (invFetchErr) throw invFetchErr;

                if (currentInv) {
                    for (const item of currentInv) {
                        const toSubtract = subtractionMap.get(item.material_id) || 0;
                        const newQty = item.quantity - toSubtract;

                        if (newQty <= 0) {
                            inventoryDeletions.push(item.id);
                        } else {
                            inventoryUpdates.push({
                                id: item.id,
                                warehouse_id: warehouseId,
                                material_id: item.material_id,
                                quantity: newQty,
                                updated_at: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            // 5. Execute Inventory Updates/Deletions in Chunks
            for (let i = 0; i < inventoryUpdates.length; i += CHUNK_SIZE) {
                const { error } = await supabase.from('inventory').upsert(inventoryUpdates.slice(i, i + CHUNK_SIZE));
                if (error) throw error;
            }

            for (let i = 0; i < inventoryDeletions.length; i += CHUNK_SIZE) {
                const { error } = await supabase.from('inventory').delete().in('id', inventoryDeletions.slice(i, i + CHUNK_SIZE));
                if (error) throw error;
            }

            // 6. Delete Movements in Chunks
            const movementIds = batchMovements.map(m => m.id);
            for (let i = 0; i < movementIds.length; i += CHUNK_SIZE) {
                const { error } = await supabase
                    .from('inventory_movements')
                    .delete()
                    .in('id', movementIds.slice(i, i + CHUNK_SIZE));
                if (error) throw error;
            }

            toast.success(`✅ Carga revertida: ${batchMovements.length} movimientos eliminados.`);
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

                const getRowValue = (row: any, keys: string[]) => {
                    const foundKey = Object.keys(row).find(k =>
                        keys.some(key => k.toLowerCase().trim() === key.toLowerCase())
                    );
                    return foundKey ? String(row[foundKey]).trim() : '';
                };

                const processedRows = data.map(row => {
                    const nombre = formatText(getRowValue(row, ['material', 'codigo', 'nombre', 'articulo', 'item']));
                    const descripcion = formatText(getRowValue(row, ['texto breve de material', 'descripcion', 'detalle', 'info']));
                    const unidad_medida = formatText(getRowValue(row, ['unidad medida base', 'uma', 'unidad', 'und', 'uom'])) || 'UNIDAD';
                    const ubicacion = formatText(getRowValue(row, ['denominación-almacén', 'ubicacion', 'almacen', 'estante']));
                    const qtyStr = getRowValue(row, ['libre utilización', 'stock total uma', 'cantidad_inicial', 'cantidad', 'stock', 'cant', 'qty']);
                    const qty = parseFloat(qtyStr.replace(/,/g, '')) || 0;
                    const unit_price = parseFloat(getRowValue(row, ['precio_unitario', 'precio', 'costo', 'p.unit'])) || 0;

                    return { nombre, descripcion, unidad_medida, ubicacion, qty, unit_price };
                }).filter(r => r.nombre !== '' && r.qty > 0);

                if (processedRows.length === 0) {
                    toast.error('No se detectaron filas válidas con material y cantidad.');
                    setLoading(false);
                    return;
                }

                setImportPreview(processedRows);
                setShowImportConfirm(true);
            } catch (err: any) {
                console.error('File read error:', err);
                toast.error(`Error al leer el archivo: ${err.message || 'Error desconocido'}`);
            } finally {
                setLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        if (!importPreview || !warehouseId) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Sesión expirada');

            // 1. Batch Process Materials
            const uniqueNames = Array.from(new Set(importPreview.map(r => r.nombre)));
            const existingMaterials: any[] = [];
            const chunkSize = 100;

            for (let i = 0; i < uniqueNames.length; i += chunkSize) {
                const chunk = uniqueNames.slice(i, i + chunkSize);
                const { data: found } = await supabase.from('materials').select('id, name').in('name', chunk);
                if (found) existingMaterials.push(...found);
            }

            const existingNamesSet = new Set(existingMaterials.map(m => m.name));
            const materialsToInsert = [];
            const addedNames = new Set();

            for (const row of importPreview) {
                if (!existingNamesSet.has(row.nombre) && !addedNames.has(row.nombre)) {
                    materialsToInsert.push({
                        name: row.nombre,
                        description: row.descripcion,
                        unit_of_measure: row.unidad_medida,
                        location: row.ubicacion,
                        unit_price: row.unit_price
                    });
                    addedNames.add(row.nombre);
                }
            }

            if (materialsToInsert.length > 0) {
                const { data: inserted, error: insertError } = await supabase
                    .from('materials')
                    .insert(materialsToInsert)
                    .select('id, name');
                if (insertError) throw insertError;
                if (inserted) existingMaterials.push(...inserted);
            }

            const materialMap = new Map(existingMaterials.map(m => [m.name, m.id]));

            // 2. Fetch Current Inventory
            const { data: currentInv } = await supabase
                .from('inventory')
                .select('material_id, quantity')
                .eq('warehouse_id', warehouseId);
            const currentInvMap = new Map(currentInv?.map(i => [i.material_id, i.quantity]) || []);

            // 3. Prepare Updates
            const inventoryMap = new Map<string, number>();
            const movementsInserts: any[] = [];

            for (const row of importPreview) {
                const materialId = materialMap.get(row.nombre);
                if (!materialId) continue;

                const currentTotal = inventoryMap.get(materialId) || 0;
                inventoryMap.set(materialId, currentTotal + row.qty);

                movementsInserts.push({
                    warehouse_id: warehouseId,
                    material_id: materialId,
                    movement_type: 'entrada',
                    quantity: row.qty,
                    notes: 'Carga masiva desde Excel',
                    user_id: user.id
                });
            }

            const inventoryUpserts = Array.from(inventoryMap.entries()).map(([materialId, qty]) => {
                const currentQty = currentInvMap.get(materialId) || 0;
                return {
                    warehouse_id: warehouseId,
                    material_id: materialId,
                    quantity: currentQty + qty,
                    updated_at: new Date().toISOString()
                };
            });

            // 4. Execute Batch Updates
            const { error: invError } = await supabase.from('inventory').upsert(inventoryUpserts, { onConflict: 'warehouse_id,material_id' });
            if (invError) throw invError;

            const { error: movError } = await supabase.from('inventory_movements').insert(movementsInserts);
            if (movError) throw movError;

            toast.success(`✅ Importación exitosa: ${importPreview.length} materiales procesados.`);
            setImportPreview(null);
            setShowImportConfirm(false);
            onImportSuccess();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error('Import error:', err);
            toast.error(`Error al importar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2">
                {!showImportConfirm ? (
                    <>
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
                                {loading ? 'Procesando...' : 'Subir Excel e Importar'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 text-primary">
                            <CheckCircle2 className="w-5 h-5" />
                            <h3 className="font-black uppercase tracking-wider text-[11px]">Resumen de Importación</h3>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Filas detectadas:</span>
                                <span className="text-primary">{importPreview?.length}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                <span>Total Unidades:</span>
                                <span className="text-primary">
                                    {importPreview?.reduce((acc, curr) => acc + curr.qty, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground leading-relaxed italic">
                            ⚠️ Por favor verifica que el contenido del archivo coincida con este resumen antes de confirmar.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 h-10 text-[10px] font-black uppercase bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20"
                                onClick={handleConfirmImport}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Carga'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-10 text-[10px] font-black uppercase rounded-lg border-border"
                                onClick={() => {
                                    setImportPreview(null);
                                    setShowImportConfirm(false);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                disabled={loading}
                            >
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Revert last import button */}
                {!showConfirm ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all"
                        onClick={() => setShowConfirm(true)}
                        disabled={reverting || !warehouseId || showImportConfirm}
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
                                disabled={reverting}
                            >
                                Sí, eliminar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg"
                                onClick={() => setShowConfirm(false)}
                                disabled={reverting}
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
