'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquipmentMovementForm } from '@/components/equipment/movement-form';
import { EquipmentMovementHistory } from '@/components/equipment/movement-history';
import { EquipmentTable } from '@/components/equipment/equipment-table';
import { WorkerTable } from '@/components/equipment/worker-table';
import { toast } from 'sonner';
import { FileDown, Package, Users, Loader2, RotateCcw } from 'lucide-react';
import { formatText, cn } from '@/lib/utils';
import { ImportEquipment } from '@/components/equipment/import-equipment';
import { ImportWorkers } from '@/components/equipment/import-workers';

// ── Shared design tokens ────────────────────────────────────────────────
const CARD = 'bg-white rounded border border-zinc-200 shadow-sm';
const LABEL = 'text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] leading-none';
const SECTION_TITLE = 'text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] leading-none';

// ── Import Toolbar ────────────────────────────────────────────────────────
function ImportBar({ onSuccess }: { onSuccess: () => void }) {
  const equipFileRef = useRef<HTMLInputElement>(null);
  const workerFileRef = useRef<HTMLInputElement>(null);
  const [loadingEq, setLoadingEq] = useState(false);
  const [loadingWk, setLoadingWk] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const downloadTemplate = (type: 'equipment' | 'workers') => {
    if (type === 'equipment') {
      const data = [{ nombre: 'Amoladora Angular 7" DEWALT', numero_serie: 'AM-001', marca: 'DeWalt', modelo: 'DWE402', estado: 'operativo', categoría: 'PODER', almacen: 'ALMACÉN PRINCIPAL', ubicacion: 'Rack-A1', precio_unitario: 350 }];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
      XLSX.writeFile(wb, 'plantilla_equipos.xlsx');
    } else {
      const data = [{ numero_trabajador: 'T-001', dni: '45678901', nombre_completo: 'Juan Pérez López', cargo: 'Operario de campo' }];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores');
      XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
    }
  };

  const importFile = async (file: File, type: 'equipment' | 'workers') => {
    const setter = type === 'equipment' ? setLoadingEq : setLoadingWk;
    setter(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'array', cellDates: true });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: true, defval: '' }) as any[];
        if (!rows.length) { toast.error('Archivo vacío'); setter(false); return; }
        const { data: whs } = await supabase.from('warehouses').select('id, name');
        const warehouseMap = new Map((whs || []).map(w => [w.name.toLowerCase(), w.id]));
        let ok = 0;
        for (const row of rows) {
          const get = (k: string) => {
            const f = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase());
            if (!f) return '';
            const val = row[f];
            return val instanceof Date ? val.toISOString().split('T')[0] : String(val).trim();
          };
          if (type === 'equipment') {
            const name = formatText(get('nombre'));
            if (!name) continue;
            const whName = (get('almacen') || get('ubicación general') || get('ubicacion')).toLowerCase();
            const warehouse_id = warehouseMap.get(whName) || null;
            const catRaw = get('categoría').toLowerCase();
            const nameLow = name.toLowerCase();
            let category: 'poder' | 'computo' | 'instrumentacion' | 'izaje' = 'poder';
            const isIzaje = catRaw.includes('izaje') || nameLow.includes('eslinga') || nameLow.includes('estrobo') || nameLow.includes('grillete') || nameLow.includes('tecle');
            if (isIzaje) category = 'izaje';
            else if (catRaw.includes('computo') || catRaw.includes('cómputo')) category = 'computo';
            else if (catRaw.includes('instrument')) category = 'instrumentacion';
            const { error } = await supabase.from('equipment').upsert({ name, serial_number: get('numero_serie') || null, brand: formatText(get('marca')) || null, model: formatText(get('modelo')) || null, status: get('estado') || 'operativo', category, warehouse_id, unit_price: parseFloat(get('precio_unitario')) || 0, location: get('ubicacion') || null, current_location: 'almacen' }, { onConflict: 'serial_number' });
            if (!error) ok++;
          } else {
            const full_name = formatText(get('nombre_completo'));
            if (!full_name) continue;
            const { error } = await supabase.from('workers').upsert({ worker_number: get('numero_trabajador') || null, dni: get('dni') || null, full_name, position: formatText(get('cargo')) || null }, { onConflict: 'dni' });
            if (!error) ok++;
          }
        }
        toast.success(`✅ ${ok} ${type === 'equipment' ? 'equipos' : 'trabajadores'} importados`);
        onSuccess();
      } catch { toast.error('Error al procesar el archivo'); }
      finally { setter(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRevert = async () => {
    setReverting(true); setShowConfirm(false);
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      const { data: used } = await supabase.from('equipment_movements').select('equipment_id');
      const ids = (used || []).map((m: any) => m.equipment_id);
      let q = supabase.from('equipment').delete().gt('created_at', tenMinutesAgo);
      if (ids.length > 0) q = q.not('id', 'in', `(${ids.map((id: string) => `'${id}'`).join(',')})`);
      const { error } = await q;
      if (error) throw error;
      toast.success('Carga revertida correctamente.');
      onSuccess();
    } catch (err: any) { toast.error(err.message); }
    finally { setReverting(false); }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <button 
        onClick={() => downloadTemplate('equipment')}
        className="flex items-center justify-center p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all gap-3 shadow-sm group"
      >
        <FileDown className="w-6 h-6 text-zinc-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-700 mt-0.5">
          Plantilla Equipos
        </span>
      </button>

      <button 
        onClick={() => equipFileRef.current?.click()} 
        disabled={loadingEq}
        className="flex items-center justify-center p-3.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all gap-3 shadow-sm group disabled:opacity-50"
      >
        {loadingEq ? (
          <Loader2 className="w-6 h-6 border-[3px] border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
        ) : (
          <Package className="w-6 h-6 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        )}
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-700 mt-0.5">
          Importar Equipos
        </span>
      </button>

      <button 
        onClick={() => workerFileRef.current?.click()} 
        disabled={loadingWk}
        className="flex items-center justify-center p-3.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all gap-3 shadow-sm group disabled:opacity-50"
      >
        {loadingWk ? (
           <Loader2 className="w-6 h-6 border-[3px] border-purple-300 border-t-purple-600 rounded-full animate-spin shrink-0" />
        ) : (
           <Users className="w-6 h-6 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        )}
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-700 mt-0.5">
          Importar Personal
        </span>
      </button>

      {showConfirm ? (
        <div className="flex items-center gap-2 p-3.5 rounded-lg border border-red-200 bg-red-50 shadow-sm animate-in fade-in zoom-in duration-200">
          <button
            onClick={handleRevert}
            className="flex-1 h-9 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            Eliminar
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 h-9 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.15em] transition-all rounded border border-red-200 bg-white hover:bg-red-50 text-red-600"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowConfirm(true)}
          disabled={reverting}
          className="flex items-center justify-center p-3.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-all gap-3 shadow-sm group disabled:opacity-50"
        >
          {reverting ? (
            <Loader2 className="w-6 h-6 border-[3px] border-red-300 border-t-red-600 rounded-full animate-spin shrink-0" />
          ) : (
            <RotateCcw className="w-6 h-6 text-red-600 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          )}
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-700 mt-0.5">
            Deshacer Carga
          </span>
        </button>
      )}

      <input type="file" accept=".xlsx,.xls" className="hidden" ref={equipFileRef}
        onChange={e => e.target.files?.[0] && importFile(e.target.files[0], 'equipment')} />
      <input type="file" accept=".xlsx,.xls" className="hidden" ref={workerFileRef}
        onChange={e => e.target.files?.[0] && importFile(e.target.files[0], 'workers')} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
function EquipmentERPContent() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'history';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, [router]);

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`/erp/inventory/equipment?${params.toString()}`);
  };

  const refresh = () => setRefreshTrigger(p => p + 1);

  return (
    <div className="space-y-5 animate-in fade-in duration-400">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-200">
        <div className="space-y-1">
          <p className={cn(LABEL, 'flex items-center gap-1.5 text-zinc-600')}>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
            ASSET MANAGEMENT · EQUIPMENT
          </p>
          <h1 className="text-2xl md:text-4xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Control de <span className="text-zinc-700">Equipos</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className={cn(LABEL, 'text-zinc-400')}>Flota Operativa</span>
        </div>
      </div>

      {/* ── Layout Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Panel */}
        <aside className="lg:col-span-3 space-y-4">

          {/* Movement Form */}
          <div className={cn(CARD, 'p-4 space-y-3')}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
              <p className={SECTION_TITLE}>Registrar Movimiento</p>
            </div>
            <EquipmentMovementForm onSuccess={refresh} activeTab={activeTab} />
          </div>

          {/* Import cards */}
          <div className={cn(CARD, 'p-4 space-y-3')}>
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-zinc-500" />
              <p className={SECTION_TITLE}>Importar equipos</p>
            </div>
            <ImportEquipment onSuccess={refresh} />
          </div>

          <div className={cn(CARD, 'p-4 space-y-3')}>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <p className={SECTION_TITLE}>Importar personal</p>
            </div>
            <ImportWorkers onSuccess={refresh} />
          </div>
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-4">
          <ImportBar onSuccess={refresh} />

          <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-0">
            <TabsList className="bg-white border border-zinc-200 rounded p-1 gap-0.5 h-auto w-full shadow-sm mb-4 flex flex-wrap">
              {[
                { value: 'history',   icon: 'history',                 label: 'Historial' },
                { value: 'equipment', icon: 'precision_manufacturing',  label: 'Equipos' },
                { value: 'workers',   icon: 'groups',                  label: 'Trabajadores' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'flex-1 h-9 flex items-center justify-center gap-1.5 rounded',
                    'text-[9px] font-black uppercase tracking-[0.15em] transition-all',
                    'text-zinc-500 data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-sm'
                  )}
                >
                  <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="history">
              <div className={cn(CARD, 'overflow-hidden animate-in fade-in duration-300')}>
                <EquipmentMovementHistory refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="equipment">
              <div className={cn(CARD, 'overflow-hidden animate-in fade-in duration-300')}>
                <EquipmentTable refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="workers">
              <div className={cn(CARD, 'overflow-hidden animate-in fade-in duration-300')}>
                <WorkerTable refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function EquipmentERPPage() {
  return (
    <Suspense fallback={
      <div className="h-[50vh] flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Cargando módulo...</span>
      </div>
    }>
      <EquipmentERPContent />
    </Suspense>
  );
}
