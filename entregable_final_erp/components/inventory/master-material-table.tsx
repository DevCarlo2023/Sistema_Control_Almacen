'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, FileText, Download, Edit2, Trash2, Package, Wand2, Trash, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UpsertMaterialDialog } from './upsert-material-dialog';
import { CatalogBulkImport } from './catalog-bulk-import';
import { smartMaterialSanitizer } from '@/lib/catalog-utils';
import { exportMaterialsToExcel } from '@/lib/excel-export';
import { VibeToolbar } from '@/components/ui/vibe-toolbar';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MasterMaterialTable() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;
  
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Custom Confirm Alert State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    actionClass?: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: () => {}
  });

  const router = useRouter();

  const confirmAction = (options: Omit<typeof confirmDialog, 'open'>) => {
    setConfirmDialog({ ...options, open: true });
  };


  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let allRecords: Material[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        const fetched = (data as unknown as Material[]) || [];
        allRecords = [...allRecords, ...fetched];
        
        if (fetched.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setMaterials(allRecords);
      setSelectedIds(new Set()); // Clear selection on refresh
      
      // Eliminamos el log temporal
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      toast.error('Error al cargar catálogo de materiales');
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear search when closing dialog after success
  const handleDialogSuccess = () => {
    setSearchQuery('');
    setPage(1);
    fetchMaterials();
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  // ── Single delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    confirmAction({
      title: 'Eliminar Material',
      description: '¿Está seguro de eliminar este material del catálogo? Esta acción no se puede deshacer.',
      actionLabel: 'Sí, Eliminar',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('materials').delete().eq('id', id);
          if (error) throw error;
          toast.success('Material eliminado del catálogo');
          fetchMaterials();
        } catch (err: any) {
          toast.error('Error al eliminar: ' + err.message);
        }
      }
    });
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const allVisibleSelected =
    filteredMaterials().length > 0 &&
    filteredMaterials().every((m) => selectedIds.has(m.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMaterials().map((m) => m.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Delete selected ────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    confirmAction({
      title: `Eliminar ${selectedIds.size} materiales`,
      description: `¿Está seguro de eliminar los ${selectedIds.size} artículos seleccionados del catálogo? Esta acción es irreversible.`,
      actionLabel: 'Eliminar Selección',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading(`🗑️ Eliminando ${selectedIds.size} registros...`);
        try {
          const { error } = await supabase
            .from('materials')
            .delete()
            .in('id', Array.from(selectedIds));

          if (error) throw error;
          toast.success(`✅ ${selectedIds.size} artículos eliminados.`, { id: toastId });
          await fetchMaterials();
        } catch (err: any) {
          toast.error('Error al eliminar: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ── Delete ALL ─────────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    confirmAction({
      title: '⚠️ PELIGRO: VACIAR CATÁLOGO',
      description: `¿Está TOTALMENTE SEGURO de eliminar TODOS los ${materials.length} artículos del catálogo maestro? Esta acción destruirá la base de datos de artículos permanentemente.`,
      actionLabel: 'SÍ, VACIAR BASE DE DATOS',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-800 shadow-xl shadow-red-700/30 font-black animate-pulse',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading('🗑️ Eliminando catálogo completo...');
        try {
          const { error } = await supabase
            .from('materials')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

          if (error) throw error;
          toast.success('✅ Catálogo eliminado completamente.', { id: toastId });
          await fetchMaterials();
        } catch (err: any) {
          toast.error('Error al vaciar catálogo: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ── Revert Last Import ──────────────────────────────────────────────────────
  const handleRevertLastImport = async () => {
    try {
      setLoading(true);
      // Get the absolute latest record created
      const { data: latestRecords, error: latestError } = await supabase
        .from('materials')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<{ created_at: string }[]>();
        
      if (latestError) throw latestError;
      if (!latestRecords || latestRecords.length === 0) {
        toast.info('No hay registros en la base de datos para revertir.');
        setLoading(false);
        return;
      }

      const latestTime = new Date(latestRecords[0].created_at);
      // Create a 5-minute window back from the latest record to catch all chunked rows in that batch
      const windowStart = new Date(latestTime.getTime() - 5 * 60 * 1000).toISOString();

      // Count how many records fall in this latest "action window"
      const { count, error: countError } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', windowStart);
        
      if (countError) throw countError;
      if (!count || count === 0) {
        setLoading(false);
        return;
      }

      setLoading(false);
      
      confirmAction({
        title: 'Deshacer Última Operación',
        description: `El sistema detectó un lote reciente de ${count} artículo(s) creado(s) juntos (fecha más reciente: ${latestTime.toLocaleString()}). ¿Desea eliminarlos para revertir esta carga? Esta acción no se puede deshacer.`,
        actionLabel: 'Sí, Revertir Lote',
        actionClass: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20',
        onConfirm: async () => {
          setLoading(true);
          const toastId = toast.loading(`↩️ Revirtiendo ${count} registros...`);
          try {
            const { error } = await supabase
              .from('materials')
              .delete()
              .gte('created_at', windowStart);

            if (error) throw error;
            toast.success(`✅ Lote de ${count} artículos revertido.`, { id: toastId });
            await fetchMaterials();
          } catch (err: any) {
            toast.error('Error al revertir: ' + err.message, { id: toastId });
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (err: any) {
      toast.error('Error calculando última carga: ' + err.message);
      setLoading(false);
    }
  };

  // ── Excel Export ─────────────────────────────────────────────────────────────
  const handleExportFullCatalog = async () => {
    try {
      setLoading(true);
      const toastId = toast.loading('📊 Generando catálogo maestro en Excel...');
      await exportMaterialsToExcel(materials);
      toast.success('✅ Catálogo exportado con éxito.', { id: toastId });
    } catch (err: any) {
      toast.error('Error al exportar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Export Selected to Excel ───────────────────────────────────────────────
  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      setLoading(true);
      const toastId = toast.loading(`📊 Generando Excel con ${selectedIds.size} artículos...`);
      
      const response = await fetch('/api/inventory/materials/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error('Error al generar el archivo en el servidor');
      }

      const blob = await response.blob();
      const { saveAs } = await import('file-saver');
      
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `Catalogo_Materiales_${timestamp}.xlsx`);
      
      toast.success('✅ Archivo Excel generado con éxito.', { id: toastId });
    } catch (err: any) {
      console.error('Export Error:', err);
      toast.error('Error al exportar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  function filteredMaterials() {
    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return materials;
    return materials.filter((m) =>
      m.name?.toLowerCase().includes(searchLower) ||
      m.description?.toLowerCase().includes(searchLower) ||
      m.codigo?.toLowerCase().includes(searchLower)
    );
  }

  // ── Optimize ───────────────────────────────────────────────────────────────
  const optimizeCatalog = async () => {
    confirmAction({
      title: 'Optimización Automática',
      description: 'El sistema escaneará todo el catálogo, extraerá los códigos ocultos en los nombres y corregirá unidades de medida inválidas.',
      actionLabel: 'Iniciar Optimización',
      actionClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading('🔍 Analizando catálogo maestro...');
        try {
          const updates = materials.map(m => {
            const recordToSanitize = {
              id: m.id,
              codigo: m.codigo,
              name: m.name,
              unit_of_measure: m.unit_of_measure,
              description: m.description,
              unit_price: m.unit_price,
              updated_at: new Date().toISOString()
            };
            const sanitized = smartMaterialSanitizer(recordToSanitize);
            const isCurrentCodigoEmpty = !m.codigo || m.codigo.trim().toUpperCase() === 'SIN SKU';
            const hasCodigoChanged = sanitized.codigo !== m.codigo && !(sanitized.codigo === null && isCurrentCodigoEmpty);
            const hasNameChanged = sanitized.name !== m.name;
            const hasDescriptionChanged = sanitized.description !== m.description;
            const hasUomChanged = sanitized.unit_of_measure !== m.unit_of_measure;
            if (hasCodigoChanged || hasNameChanged || hasDescriptionChanged || hasUomChanged) return sanitized;
            return null;
          }).filter(Boolean);

          if (updates.length === 0) {
            toast.info('✅ El catálogo ya se encuentra optimizado.', { id: toastId });
            setLoading(false);
            return;
          }
          toast.loading(`🛠️ Corrigiendo ${updates.length} registros...`, { id: toastId });
          const { error } = await supabase.from('materials').upsert(updates);
          if (error) throw error;
          toast.success(`✅ ¡Éxito! Se corrigieron ${updates.length} registros.`, { id: toastId });
          await fetchMaterials();
        } catch (err: any) {
          toast.error('Error durante la optimización: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const visibleProps = filteredMaterials();
  const totalPages = Math.ceil(visibleProps.length / rowsPerPage);
  const paginatedVisible = visibleProps.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  const allVisibleSel = paginatedVisible.length > 0 && paginatedVisible.every((m) => selectedIds.has(m.id));

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── Header Actions ──────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Tier 1: Search and Primary Action */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Buscar por código, nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 md:h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-xs md:text-sm font-medium w-full shadow-inner"
            />
          </div>

          <Button
            onClick={() => { setEditingMaterial(null); setDialogOpen(true); }}
            className="h-12 md:h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black uppercase text-[10px] md:text-xs tracking-widest gap-2 shadow-xl hover:-translate-y-1 active:scale-95 transition-all w-full lg:w-auto shrink-0"
          >
            <Package className="w-5 h-5 shrink-0" />
            <span className="truncate">Nuevo Material</span>
          </Button>
        </div>

        {/* Universal Action Toolbar */}
        <div className="relative z-40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-zinc-200/50 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <VibeToolbar 
              actions={[
                {
                  type: 'optimizar',
                  onClick: optimizeCatalog,
                  disabled: loading
                },
                {
                  type: 'exportar',
                  label: 'Exportar Todo (Excel)',
                  onClick: handleExportFullCatalog,
                  disabled: loading || materials.length === 0
                },
                {
                  type: 'excel',
                  label: `EXCEL (${selectedIds.size})`,
                  onClick: handleExportSelected,
                  hidden: selectedIds.size === 0,
                  disabled: loading
                },
                {
                  type: 'eliminar',
                  label: `ELIMINAR (${selectedIds.size})`,
                  onClick: handleDeleteSelected,
                  hidden: selectedIds.size === 0,
                  disabled: loading
                }
              ]}
            />
            
            <div className="flex items-center gap-2">
              <CatalogBulkImport type="material" onSuccess={handleDialogSuccess} />
            </div>
          </div>

          <VibeToolbar 
            actions={[
              {
                type: 'revertir',
                onClick: handleRevertLastImport,
                disabled: loading || materials.length === 0
              },
              {
                type: 'vaciar',
                onClick: handleDeleteAll,
                disabled: loading || materials.length === 0
              }
            ]}
          />
        </div>
      </div>

      {/* ── Main List Container ────────────────────────── */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Card className="rounded-[2rem] border-zinc-100 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
                    <TableHead className="py-4 pl-6 pr-2 w-[48px]">
                      <Checkbox
                        checked={allVisibleSel}
                        onCheckedChange={toggleAll}
                        aria-label="Seleccionar todos"
                        className="rounded-md border-zinc-300"
                      />
                    </TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 w-[140px] font-outfit text-center">Código</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 font-outfit">Descripción Técnica</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 w-[100px] font-outfit text-center">Unidad</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-right w-[120px] font-outfit">Precio Unit.</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-right w-[150px] font-outfit">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">
                        Cargando catálogo maestro...
                      </TableCell>
                    </TableRow>
                  ) : visibleProps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">
                        No se encontraron artículos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVisible.map((m) => {
                      const isSelected = selectedIds.has(m.id);
                      return (
                        <TableRow
                          key={m.id}
                          className={cn(
                            "group border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors duration-200",
                            isSelected && "bg-red-50/40 hover:bg-red-50/60"
                          )}
                        >
                          <TableCell className="py-4 pl-6 pr-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOne(m.id)}
                              className="rounded-md border-zinc-300"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            <span className={cn(
                              "inline-flex items-center font-outfit font-bold text-[10px] tracking-wider px-2.5 py-1 rounded-lg border bg-zinc-950 text-zinc-100 uppercase shadow-sm",
                              !m.codigo && "bg-zinc-100 text-zinc-400 border-zinc-200 font-medium italic shadow-none"
                            )}>
                              {m.codigo || 'S/C'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 max-w-[340px]">
                            <p className="text-[13px] font-semibold text-zinc-900 leading-snug line-clamp-2 tracking-tight">
                              {m.name || m.description || 'Sin descripción técnica registrada.'}
                            </p>
                            {m.description && m.name && m.description !== m.name && (
                              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{m.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-500 font-outfit font-bold">
                              {m.unit_of_measure || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <span className="font-mono text-[13px] font-black text-zinc-800 tracking-tight">
                              S/. {(m.unit_price || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                title="Ver Documentación"
                                onClick={() => router.push(`/erp/inventory/documentation?asset_id=${m.id}&type=material`)}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-white border rounded-lg"
                                onClick={() => { setEditingMaterial(m); setDialogOpen(true); }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                onClick={() => handleDelete(m.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {loading ? (
             <div className="py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary/30" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cargando Catálogo Maestro...</p>
             </div>
          ) : paginatedVisible.length === 0 ? (
             <div className="py-20 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No se encontraron resultados</p>
             </div>
          ) : paginatedVisible.map((m) => {
            const isSelected = selectedIds.has(m.id);
            return (
              <div 
                key={m.id}
                className={cn(
                  "p-5 rounded-[1.5rem] border transition-all duration-300 relative overflow-hidden active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2",
                  isSelected ? "bg-red-50 border-red-200" : "bg-white border-zinc-100 shadow-sm"
                )}
                onClick={() => toggleOne(m.id)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase border",
                          m.codigo ? "bg-zinc-950 text-white border-zinc-800" : "bg-zinc-50 text-zinc-400 border-zinc-200"
                       )}>
                          {m.codigo || 'SIN CÓDIGO'}
                       </span>
                       <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border border-zinc-100 bg-zinc-50/50 text-zinc-500 uppercase tracking-widest">
                          {m.unit_of_measure || 'UND'}
                       </span>
                    </div>
                    <h3 className="text-sm font-black text-zinc-950 leading-tight tracking-tight uppercase">
                       {m.name || m.description || 'SIN DESCRIPCIÓN'}
                    </h3>
                    {m.description && m.name && m.description !== m.name && (
                       <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                          {m.description}
                       </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0 pt-1">
                     <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Costo Unitario</span>
                     <span className="text-xl font-black text-zinc-950 font-mono tracking-tighter">
                        S/. {(m.unit_price || 0).toFixed(2)}
                     </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100/50">
                   <div className="flex items-center gap-3">
                      <div className="relative">
                         <Checkbox checked={isSelected} className="rounded-md w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Seleccionar</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-zinc-400 bg-zinc-50 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/erp/inventory/documentation?asset_id=${m.id}&type=material`);
                        }}
                      >
                        <FileText className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-zinc-400 bg-zinc-50 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMaterial(m);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-red-100 bg-red-50/50 rounded-xl active:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </Button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination Controls ────────────────────────── */}
        {visibleProps.length > 0 && !loading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-6 rounded-[2rem] bg-white border border-zinc-100 shadow-sm mt-4">
            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center sm:text-left">
              Registros <span className="text-zinc-950">{(page - 1) * rowsPerPage + 1}</span> al <span className="text-zinc-950">{Math.min(page * rowsPerPage, visibleProps.length)}</span> de <span className="text-primary">{visibleProps.length}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <div className="text-[10px] font-black text-zinc-500 bg-zinc-50 border border-zinc-100 h-11 flex items-center px-5 rounded-xl tracking-tighter uppercase min-w-[100px] justify-center">
                Pág. {page} / {totalPages || 1}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <UpsertMaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editingMaterial}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={confirmDialog.open} onOpenChange={(val) => setConfirmDialog(prev => ({ ...prev, open: val }))}>
        <AlertDialogContent className="rounded-[2.5rem] border-zinc-100 shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-zinc-950 uppercase tracking-tighter">
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-zinc-500 font-medium leading-relaxed mt-2">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-2 sm:flex-col">
            <AlertDialogAction 
              onClick={() => confirmDialog.onConfirm()}
              className={cn(
                "rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all text-white w-full",
                confirmDialog.actionClass || "bg-zinc-950 hover:bg-zinc-800"
              )}
            >
              {confirmDialog.actionLabel}
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest border-zinc-200 hover:bg-zinc-50 w-full sm:order-last">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
