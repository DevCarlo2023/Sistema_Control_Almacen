'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WarehouseSelector } from '@/components/inventory/warehouse-selector';
import { MovementForm } from '@/components/inventory/movement-form';
import { TransferForm } from '@/components/inventory/transfer-form';
import { StockTable } from '@/components/inventory/stock-table';
import { GlobalStockSearch } from '@/components/inventory/global-stock-search';
import { ExportButton } from '@/components/inventory/export-button';
import { CriticalExportButton } from '@/components/inventory/critical-export-button';
import { ImportButton } from '@/components/inventory/import-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { type Material } from '@/lib/types';
import { MovementHistory } from '@/components/inventory/movement-history';
import { cn } from '@/lib/utils';

// ── Shared design tokens ────────────────────────────────────────────────
const CARD = 'bg-white rounded border border-zinc-200 shadow-sm';
const LABEL = 'text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] leading-none';
const SECTION_TITLE = 'text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] leading-none';
const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 px-4 h-9 rounded bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-sm';
const BTN_GHOST = 'inline-flex items-center justify-center gap-2 px-4 h-9 rounded text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:bg-zinc-100 transition-all';

export default function MaterialsERPPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isTabsCollapsed, setIsTabsCollapsed] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionMode, setActionMode] = useState<'movement' | 'transfer'>('movement');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
    });
  }, [router]);

  const handleWarehouseChange = async (newId: string) => {
    setWarehouseId(newId);
    setSelectedMaterial(null);
    const { data }: any = await supabase.from('warehouses').select('name').eq('id', newId).single();
    if (data) setWarehouseName(data.name);
  };

  const handleSuccess = () => {
    setSelectedMaterial(null);
    setRefreshTrigger(p => p + 1);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-400">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-200">
        <div className="space-y-1">
          <p className={cn(LABEL, 'flex items-center gap-1.5 text-primary')}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            INVENTORY CLUSTER · MATERIALS
          </p>
          <h1 className="text-2xl md:text-4xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Gestión de <span className="text-primary">Materiales</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className={cn(LABEL, 'text-zinc-400')}>Sincronizado</span>
        </div>
      </div>

      {/* ── Layout Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Panel */}
        <aside className="lg:col-span-3 space-y-4">

          {/* Warehouse */}
          <div className={cn(CARD, 'p-4 space-y-3')}>
            <p className={SECTION_TITLE}>Almacén activo</p>
            <WarehouseSelector value={warehouseId} onWarehouseChange={handleWarehouseChange} />
          </div>

          {/* Tools */}
          <div className={cn(CARD, 'p-4 space-y-2')}>
            <p className={SECTION_TITLE}>Exportación e importación</p>
            <div className="pt-1 space-y-2">
              <ExportButton warehouseId={warehouseId} warehouseName={warehouseName} />
              <CriticalExportButton warehouseId={warehouseId} warehouseName={warehouseName} />
              <ImportButton warehouseId={warehouseId} onImportSuccess={handleSuccess} />
            </div>
          </div>

          {/* Status */}
          <div className="bg-primary/5 border border-primary/20 rounded p-4 space-y-1.5 hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className={cn(LABEL, 'text-primary')}>Data Sync Active</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Nodo central operativo en tiempo real.
            </p>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-5">

          {/* Action Card */}
          <div className={cn(CARD, 'p-5')}>
            {/* Card header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
                </div>
                <span className="text-xs font-black text-zinc-900 uppercase tracking-[0.15em]">
                  {actionMode === 'movement' ? 'Registrar Movimiento' : 'Traslado entre Almacenes'}
                </span>
                
                {/* Form Collapse Eye Toggle */}
                <button
                  onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  title={isFormCollapsed ? 'Mostrar formulario' : 'Ocultar formulario'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isFormCollapsed ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Toggle switch */}
              <div className="flex bg-zinc-100 p-0.5 rounded gap-0.5 self-start sm:self-auto">
                <button
                  onClick={() => setActionMode('movement')}
                  className={cn(
                    'h-8 px-3 rounded text-[9px] font-black uppercase tracking-[0.15em] transition-all',
                    actionMode === 'movement'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  Ingreso / Salida
                </button>
                <button
                  onClick={() => setActionMode('transfer')}
                  className={cn(
                    'h-8 px-3 rounded text-[9px] font-black uppercase tracking-[0.15em] transition-all',
                    actionMode === 'transfer'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  Traslado
                </button>
              </div>
            </div>

            {/* Content wrapped in collapsible div */}
            <div className={cn("transition-all duration-300", isFormCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100")}>
              {actionMode === 'movement' ? (
                <MovementForm
                  warehouseId={warehouseId}
                  selectedMaterial={selectedMaterial}
                  onSelectMaterial={setSelectedMaterial}
                  onMovementSuccess={handleSuccess}
                />
              ) : (
                <TransferForm
                  fromWarehouseId={warehouseId}
                  selectedMaterial={selectedMaterial}
                  onSelectMaterial={setSelectedMaterial}
                  onTransferSuccess={handleSuccess}
                />
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-8">
            <Tabs defaultValue="global" className="space-y-0 relative">
              <div className="flex gap-2 mb-4 items-start">
                <TabsList className="bg-white border border-zinc-200 rounded p-1 gap-0.5 h-auto w-full shadow-sm flex flex-wrap flex-1">
                  {[
                  { value: 'global',  icon: 'search',      label: 'Consulta Global' },
                  { value: 'stock',   icon: 'inventory_2', label: 'Stock Almacén' },
                  { value: 'history', icon: 'history',     label: 'Historial' },
                  { value: 'admin',   icon: 'settings',    label: 'Administración' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    onClick={() => setIsTabsCollapsed(false)}
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
                
                {/* Tabs Collapse Eye Toggle */}
                <button
                  onClick={() => setIsTabsCollapsed(!isTabsCollapsed)}
                  className="w-10 h-10 mt-0.5 shrink-0 bg-white border border-zinc-200 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm"
                  title={isTabsCollapsed ? 'Mostrar paneles' : 'Ocultar paneles'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isTabsCollapsed ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              
            <div className={cn("transition-all duration-300", isTabsCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100")}>
              <TabsContent value="global">
              <div className={cn(CARD, 'p-5 md:p-6', 'animate-in fade-in duration-300')}>
                <GlobalStockSearch refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="stock">
              <div className={cn(CARD, 'overflow-hidden min-h-[400px]', 'animate-in fade-in duration-300')}>
                <StockTable warehouseId={warehouseId} refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className={cn(CARD, 'overflow-hidden', 'animate-in fade-in duration-300')}>
                <MovementHistory warehouseId={warehouseId} warehouseName={warehouseName} refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="admin">
              <div className={cn(CARD, 'p-5 md:p-6', 'animate-in fade-in duration-300')}>
                <AdminTabs userEmail={user?.email} />
              </div>
            </TabsContent>
            </div>
          </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
