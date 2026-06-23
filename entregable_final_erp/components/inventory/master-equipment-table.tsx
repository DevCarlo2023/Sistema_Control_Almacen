'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Equipment, type Warehouse } from '@/lib/types';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
import { 
  Search, FileText, Download, Edit2, Trash2, Wrench, ShieldCheck, 
  Activity, Loader2, RotateCcw, Trash, Wand2,
  CalendarClock, ShieldAlert, ShieldX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { UpsertEquipmentDialog } from './upsert-equipment-dialog';
import { CatalogBulkImport } from './catalog-bulk-import';
import { smartEquipmentSanitizer } from '@/lib/catalog-utils';
import { VibeToolbar } from '@/components/ui/vibe-toolbar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function MasterEquipmentTable() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
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

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*, warehouse:warehouses(*)')
        .order('name');

      if (error) throw error;
      setEquipment((data as any[]) || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Error fetching equipment:', err);
      toast.error('Error al cargar catálogo de equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleDelete = async (id: string) => {
    confirmAction({
      title: 'Eliminar Equipo',
      description: '¿Está seguro de eliminar este equipo del catálogo? Esta acción no se puede deshacer.',
      actionLabel: 'Sí, Eliminar',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('equipment')
            .delete()
            .eq('id', id);

          if (error) throw error;
          toast.success('Equipo eliminado del catálogo');
          fetchEquipment();
        } catch (err: any) {
          toast.error('Error al eliminar: ' + err.message);
        }
      }
    });
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const filteredItems = equipment.filter((e) => {
    // 1. Filtro por Búsqueda
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    const uiStatus = e.status === 'operativo' ? 'operativo ok funcionando' : 
                     e.status === 'en_reparacion' ? 'reparacion mantenimiento taller soporte' : 
                     'baja inoperativo malogrado descartado';
    
    const uiOwnership = e.ownership === 'alquilado' ? 'alquiler rentado externo' :
                        e.ownership === 'propio' ? 'propio de la casa de la empresa' :
                        e.ownership === 'prestado' ? 'comodato prestado' : 'propio';

    const content = [
      e.name,
      e.description,
      e.serial_number,
      e.brand,
      e.model,
      e.category,
      uiStatus,
      uiOwnership
    ].filter(Boolean).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return content.includes(query);
  });

  const toggleAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((e) => e.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk Delete ────────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    confirmAction({
      title: `Eliminar ${selectedIds.size} equipos`,
      description: '¿Está seguro de eliminar los artículos seleccionados? Esta acción es irreversible.',
      actionLabel: 'Eliminar Selección',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading(`🗑️ Eliminando ${selectedIds.size} registros...`);
        try {
          const { error } = await supabase
            .from('equipment')
            .delete()
            .in('id', Array.from(selectedIds));

          if (error) throw error;
          toast.success(`✅ ${selectedIds.size} equipos eliminados.`, { id: toastId });
          await fetchEquipment();
        } catch (err: any) {
          toast.error('Error al eliminar: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ── Vaciar Catálogo ────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    confirmAction({
      title: '⚠️ PELIGRO: VACIAR CATÁLOGO',
      description: `¿Desea eliminar TODOS los ${equipment.length} equipos del catálogo? Esta acción no se puede deshacer.`,
      actionLabel: 'SÍ, VACIAR TODO',
      actionClass: 'bg-red-600 hover:bg-red-700 text-white font-black animate-pulse',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading('🗑️ Vaciando catálogo completo...');
        try {
          const { error } = await supabase
            .from('equipment')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

          if (error) throw error;
          toast.success('✅ Catálogo vaciado completamente.', { id: toastId });
          await fetchEquipment();
        } catch (err: any) {
          toast.error('Error al vaciar catálogo: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ── Export Selected to Excel ───────────────────────────────────────────────
  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      const toastId = toast.loading(`📊 Generando Excel con ${selectedIds.size} equipos...`);
      
      const response = await fetch('/api/inventory/equipment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) throw new Error('Error en el servidor');

      const blob = await response.blob();
      const { saveAs } = await import('file-saver');
      saveAs(blob, `Catalogo_Equipos_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('✅ Archivo Excel generado.', { id: toastId });
    } catch (err: any) {
      toast.error('Error al exportar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Revert Last batch ──────────────────────────────────────────────────────
  const handleRevertLastImport = async () => {
    try {
      setLoading(true);
      const { data: latestRecords, error: latestError } = await supabase
        .from('equipment')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<{ created_at: string }[]>();
        
      if (latestError) throw latestError;
      if (!latestRecords || latestRecords.length === 0) {
        toast.info('No hay registros para revertir.');
        setLoading(false);
        return;
      }

      const latestTime = new Date(latestRecords[0].created_at);
      const windowStart = new Date(latestTime.getTime() - 5 * 60 * 1000).toISOString();

      const { count, error: countError } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', windowStart);
        
      if (countError) throw countError;
      setLoading(false);

      if (!count || count === 0) return;
      
      confirmAction({
        title: 'Deshacer Última Carga',
        description: `Se encontraron ${count} equipos creados recientemente. ¿Desea eliminarlos?`,
        actionLabel: 'Sí, Revertir',
        actionClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        onConfirm: async () => {
          setLoading(true);
          try {
            const { error } = await supabase
              .from('equipment')
              .delete()
              .gte('created_at', windowStart);
            if (error) throw error;
            toast.success(`✅ Lote de ${count} equipos revertido.`);
            await fetchEquipment();
          } catch (err: any) {
            toast.error('Error al revertir: ' + err.message);
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
      setLoading(false);
    }
  };

  // ── Optimize ───────────────────────────────────────────────────────────────
  const optimizeCatalog = async () => {
    confirmAction({
      title: 'Optimización Automática',
      description: 'El sistema normalizará nombres, marcas y números de serie de toda la flota.',
      actionLabel: 'Iniciar Optimización',
      actionClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
      onConfirm: async () => {
        setLoading(true);
        const toastId = toast.loading('🔍 Analizando flota maestra...');
        try {
          const updates = equipment.map(item => {
            const sanitized = smartEquipmentSanitizer(item);
            const hasChanged = sanitized.serial_number !== item.serial_number || 
                             sanitized.brand !== item.brand || 
                             sanitized.status !== item.status || 
                             sanitized.name !== item.name;
            return hasChanged ? sanitized : null;
          }).filter(Boolean);

          if (updates.length === 0) {
            toast.info('✅ La flota ya se encuentra optimizada.', { id: toastId });
            setLoading(false);
            return;
          }
          const { error } = await supabase.from('equipment').upsert(updates);
          if (error) throw error;
          toast.success(`✅ Se optimizaron ${updates.length} equipos.`, { id: toastId });
          await fetchEquipment();
        } catch (err: any) {
          toast.error('Error: ' + err.message, { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getCalibrationStatus = (endDate?: string) => {
    if (!endDate) return 'none';
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'vencido';
    if (diffDays <= 30) return 'proximo';
    return 'vigente';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return 'Err';
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Catálogo Equipos');

      // Define columns
      worksheet.columns = [
        { header: 'NOMBRE DEL EQUIPO', key: 'name', width: 45 },
        { header: 'MARCA', key: 'brand', width: 25 },
        { header: 'MODELO', key: 'model', width: 25 },
        { header: 'NÚMERO DE SERIE', key: 'serial_number', width: 30 },
        { header: 'CATEGORÍA', key: 'category', width: 25 },
        { header: 'ESTADO ACTUAL', key: 'status', width: 20 },
        { header: 'INICIO CALIB.', key: 'cal_start', width: 20 },
        { header: 'VENC. CALIB.', key: 'cal_end', width: 20 },
        { header: 'FREQ. (MESES)', key: 'cal_freq', width: 15 },
        { header: 'VALORIZACIÓN (S/)', key: 'unit_price', width: 25 },
        { header: 'PROPIEDAD', key: 'ownership', width: 20 },
      ];

      // Add rows
      equipment.forEach(e => {
        worksheet.addRow({
          name: (e.name || '').toUpperCase(),
          brand: (e.brand || 'N/A').toUpperCase(),
          model: (e.model || 'N/A').toUpperCase(),
          serial_number: (e.serial_number || 'S/N').toUpperCase(),
          category: (e.category || 'GENERAL').toUpperCase(),
          status: (e.status || 'OPERATIVO').toUpperCase(),
          cal_start: e.calibration_start ? formatDate(e.calibration_start) : '—',
          cal_end: e.calibration_end ? formatDate(e.calibration_end) : '—',
          cal_freq: e.calibration_frequency || '—',
          unit_price: e.unit_price ? Number(e.unit_price).toFixed(2) : '0.00',
          ownership: (e.ownership || 'PROPIO').toUpperCase(),
        });
      });

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 35;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF083344' } // Cyan 950
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 10
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'FF164E63' } }
        };
      });

      // Alternating row colors
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' }
              };
            });
          }
        }
      });

      // Write to buffer and save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `CATALOGO_EQUIPOS_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('✅ Excel profesional generado.');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al generar el archivo Excel');
    }
  };

  const allVisibleSelected = filteredItems.length > 0 && 
                             filteredItems.every(e => selectedIds.has(e.id));

  return (
    <div className="w-full space-y-6 pb-20">

      {/* ── Header Actions ──────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Tier 1: Search and Primary Action */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Buscar por serie, modelo, marca, categoría, estatus o propiedad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 md:h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-xs md:text-sm font-medium w-full shadow-inner"
            />
          </div>

          <Button
            onClick={() => { setEditingItem(null); setDialogOpen(true); }}
            className="h-12 md:h-14 px-8 rounded-2xl bg-cyan-900 text-white font-black uppercase text-[10px] md:text-xs tracking-widest gap-2 shadow-xl hover:-translate-y-1 active:scale-95 transition-all w-full lg:w-auto shrink-0"
          >
            <Wrench className="w-5 h-5 shrink-0" />
            <span className="truncate">Nuevo Equipo</span>
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
                  label: 'Exportar Excel',
                  onClick: exportToExcel,
                  disabled: loading || equipment.length === 0
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
              <CatalogBulkImport type="equipment" onSuccess={fetchEquipment} />
            </div>
          </div>

          <VibeToolbar 
            actions={[
              {
                type: 'revertir',
                onClick: handleRevertLastImport,
                disabled: loading || equipment.length === 0
              },
              {
                type: 'vaciar',
                onClick: handleDeleteAll,
                disabled: loading || equipment.length === 0
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
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100 hover:bg-transparent text-center">
                    <TableHead className="py-4 pl-6 pr-2 w-[48px]">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleAll}
                        className="rounded-md border-zinc-300"
                      />
                    </TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 w-[240px] font-outfit">IDENTIFICACIÓN / SERIE</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 font-outfit">MARCA / MODELO</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 w-[120px] font-outfit">CATEGORÍA</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-center w-[150px] font-outfit">CALIBRACIÓN</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-center w-[120px] font-outfit">VALORIZACIÓN</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-center w-[110px] font-outfit text-nowrap">ESTATUS ACTIVO</TableHead>
                    <TableHead className="py-4 px-6 font-black uppercase text-[8px] tracking-[0.15em] text-zinc-300 text-right w-[150px] font-outfit font-outfit">PROPIEDAD / ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">
                        Cargando flota maestra...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-zinc-400 italic text-xs font-outfit uppercase tracking-widest">
                        No se encontraron equipos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <TableRow 
                          key={item.id} 
                          className={cn(
                            "group border-b border-zinc-50 hover:bg-cyan-50/20 transition-colors duration-200",
                            isSelected && "bg-cyan-50/40 hover:bg-cyan-50/60"
                          )}
                        >
                          <TableCell className="py-4 pl-6 pr-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOne(item.id)}
                              className="rounded-md border-zinc-300"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 items-start">
                               <span className="text-[13px] font-semibold text-zinc-950 uppercase tracking-tight line-clamp-2 font-outfit">{item.name}</span>
                               <span className="font-outfit text-[9px] font-black tracking-widest text-zinc-100 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 self-start shadow-sm">
                                  {item.serial_number || 'S/N: N/A'}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-medium text-zinc-800 uppercase font-outfit">{item.brand || '-'}</span>
                              <span className="text-[9px] text-zinc-400 uppercase tracking-widest leading-none mt-1">{item.model || 'MODELO NO REG.'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                             <div className="flex items-center gap-2 justify-center">
                                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.1em] font-outfit">
                                  {item.category || 'General'}
                                </span>
                             </div>
                          </TableCell>

                          <TableCell className="py-4 px-6 text-center">
                             <div className="flex flex-col items-center gap-1">
                                {item.calibration_end ? (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                                        getCalibrationStatus(item.calibration_end) === 'vigente' ? "bg-green-500/10 text-green-700 border border-green-500/20" :
                                        getCalibrationStatus(item.calibration_end) === 'proximo' ? "bg-amber-500/10 text-amber-700 border border-amber-500/20" :
                                        "bg-red-500/10 text-red-700 border border-red-500/20"
                                      )}>
                                        {getCalibrationStatus(item.calibration_end) === 'vigente' ? <ShieldCheck className="w-2 h-2" /> :
                                         getCalibrationStatus(item.calibration_end) === 'proximo' ? <ShieldAlert className="w-2 h-2" /> :
                                         <ShieldX className="w-2 h-2" />}
                                        {getCalibrationStatus(item.calibration_end) === 'vigente' ? 'Vigente' :
                                         getCalibrationStatus(item.calibration_end) === 'proximo' ? 'Próximo' : 'Vencido'}
                                      </span>
                                      <span className="text-[10px] font-black text-zinc-950 font-outfit">
                                        {formatDate(item.calibration_end)}
                                      </span>
                                    </div>
                                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Vencimiento</span>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                       {item.calibration_start && (
                                          <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-tight">Inicio: {formatDate(item.calibration_start)}</span>
                                       )}
                                       {item.calibration_frequency && (
                                          <span className="text-[7px] font-black text-cyan-600 bg-cyan-50/50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter self-center border border-cyan-100">
                                             Cada {item.calibration_frequency} meses
                                          </span>
                                       )}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-zinc-300 italic uppercase">Sin Calibrar</span>
                                )}
                             </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                             <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-zinc-950 font-outfit">
                                   {item.unit_price ? `S/. ${item.unit_price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/. 0.00'}
                                </span>
                                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Valor Actual</span>
                             </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex justify-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 font-outfit",
                                item.status === 'operativo' ? "bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm shadow-green-500/5" : 
                                item.status === 'en_reparacion' ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                "bg-red-500/10 text-red-600 border border-red-500/20"
                              )}>
                                <Activity className={cn("w-2.5 h-2.5", item.status === 'operativo' && "animate-pulse")} />
                                {item.status === 'operativo' ? 'OPERATIVO' : item.status === 'en_reparacion' ? 'REPARACIÓN' : 'BAJA'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0",
                                item.ownership === 'propio' ? "bg-zinc-100 text-zinc-500 border-zinc-200" :
                                item.ownership === 'alquilado' ? "bg-cyan-50 text-cyan-700 border-cyan-100" :
                                "bg-orange-50 text-orange-700 border-orange-100 shadow-sm shadow-orange-500/5"
                              )}>
                                {item.ownership || 'PROPIO'}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg"
                                  title="Ver Documentación"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/erp/inventory/documentation?asset_id=${item.id}&type=equipment`); }}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-cyan-800 hover:bg-white border rounded-lg shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); setEditingItem(item); setDialogOpen(true); }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-600/30" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cargando Flota Maestra...</p>
             </div>
          ) : filteredItems.length === 0 ? (
             <div className="py-20 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No se encontraron equipos</p>
             </div>
          ) : filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleOne(item.id)}
                className={cn(
                  "p-5 rounded-[1.5rem] border transition-all duration-300 relative overflow-hidden active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 cursor-pointer",
                  isSelected 
                    ? "bg-cyan-50 border-cyan-200 shadow-md ring-2 ring-cyan-500/10" 
                    : "bg-white border-zinc-100 shadow-sm"
                )}
              >
                 <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-2 flex-1">
                       <div className="flex flex-wrap items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-md border-zinc-300"
                          />
                          <span className="font-outfit text-[9px] font-black tracking-widest text-zinc-100 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shadow-sm">
                             {item.serial_number || 'SIN SERIE'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border border-zinc-100 bg-zinc-50/50 text-zinc-500 uppercase tracking-widest">
                             {item.category || 'GENERAL'}
                          </span>
                       </div>
                       <h3 className="text-sm font-black text-zinc-950 leading-tight tracking-tight uppercase">
                          {item.name}
                       </h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                       <span className={cn(
                          "px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5",
                          item.status === 'operativo' ? "bg-green-50 text-green-600 border border-green-100" : 
                          item.status === 'en_reparacion' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          <Activity className={cn("w-3 h-3", item.status === 'operativo' && "animate-pulse")} />
                          {item.status === 'operativo' ? 'OK' : item.status === 'en_reparacion' ? 'REP' : 'BAJA'}
                        </span>
                       <span className="px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter bg-zinc-100 text-zinc-400 border border-zinc-200 mt-2">
                          {item.ownership || 'PROPIO'}
                       </span>
                    </div>
                 </div>

                 {/* Info Grid for Mobile */}
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 flex flex-col items-center justify-center gap-1">
                       <span className="text-[11px] font-black text-zinc-950 font-outfit">
                          {item.unit_price ? `S/. ${item.unit_price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/. 0.00'}
                       </span>
                       <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Valorización</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 flex flex-col items-center justify-center gap-1">
                       {item.calibration_end ? (
                          <>
                             <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                                getCalibrationStatus(item.calibration_end) === 'vigente' ? "bg-green-500/10 text-green-700 border border-green-500/20" :
                                getCalibrationStatus(item.calibration_end) === 'proximo' ? "bg-amber-500/10 text-amber-700 border border-amber-500/20" :
                                "bg-red-500/10 text-red-700 border border-red-500/20"
                             )}>
                                {getCalibrationStatus(item.calibration_end) === 'vigente' ? <ShieldCheck className="w-2.5 h-2.5" /> :
                                 getCalibrationStatus(item.calibration_end) === 'proximo' ? <ShieldAlert className="w-2.5 h-2.5" /> :
                                 <ShieldX className="w-2.5 h-2.5" />}
                                {getCalibrationStatus(item.calibration_end) === 'vigente' ? 'Vigente' :
                                 getCalibrationStatus(item.calibration_end) === 'proximo' ? 'Próximo' : 'Vencido'}
                             </span>
                             <span className="text-[9px] font-black text-zinc-950 font-outfit">
                                {formatDate(item.calibration_end)}
                             </span>
                          </>
                       ) : (
                          <span className="text-[8px] font-black text-zinc-300 italic uppercase">Sin Calibrar</span>
                       )}
                    </div>
                 </div>

                 <div className="flex items-center justify-end gap-1.5 pt-4 border-t border-zinc-100/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-zinc-400 bg-zinc-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/erp/inventory/documentation?asset_id=${item.id}&type=equipment`);
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
                        setEditingItem(item);
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
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </Button>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      <UpsertEquipmentDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={editingItem}
        onSuccess={fetchEquipment}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(val) => setConfirmDialog(prev => ({ ...prev, open: val }))}>
        <AlertDialogContent className="rounded-[2.5rem] border-zinc-100 shadow-2xl p-8 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-zinc-950 uppercase tracking-tighter text-center">
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-zinc-500 font-medium leading-relaxed mt-2 text-center">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-2 sm:flex-col">
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
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
