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
const CARD = 'bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden';
const LABEL = 'text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none';
const SECTION_TITLE = 'text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none';

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
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
            Inventory Cluster · Materials
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase italic leading-none">
            Gestión de <span className="text-blue-600">Materiales</span>
          </h1>
        </div>
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sistema Sincronizado</span>
          </div>
        </div>
      </div>

      {/* ── Layout Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Sidebars Panel */}
        <aside className="lg:col-span-3 space-y-6">

          {/* Warehouse Card */}
          <div className={cn(CARD, 'p-6 space-y-4')}>
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-zinc-400">home_work</span>
               <p className={SECTION_TITLE}>Almacén activo</p>
            </div>
            <WarehouseSelector value={warehouseId} onWarehouseChange={handleWarehouseChange} />
          </div>

          {/* Sync Status Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-3">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Data Sync Active
            </p>
            <p className="text-[10px] font-medium text-blue-600/70 leading-relaxed">
              Nodo central operativo en tiempo real. Todos los movimientos están protegidos por SSL.
            </p>
          </div>

          {/* Data Operations Card */}
          <div className={cn(CARD, 'p-6 space-y-4')}>
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-zinc-400">database</span>
               <p className={SECTION_TITLE}>Operaciones de Datos</p>
            </div>
            <div className="space-y-3 pt-2">
              <ImportButton warehouseId={warehouseId} onImportSuccess={handleSuccess} />
              <ExportButton warehouseId={warehouseId} warehouseName={warehouseName} />
              <CriticalExportButton warehouseId={warehouseId} warehouseName={warehouseName} />
            </div>
          </div>
        </aside>

        {/* Main Center Panel */}
        <div className="lg:col-span-9 space-y-8">

          {/* Registrar Movimiento Card */}
          <div className={cn(CARD, 'p-8')}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-lg transform -rotate-3">
                  <span className="material-symbols-outlined text-white text-xl">bolt</span>
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-[0.1em]">
                  {actionMode === 'movement' ? 'Registrar Movimiento' : 'Traslado entre Almacenes'}
                </h3>
                
                <button
                  onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                  className="ml-3 p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isFormCollapsed ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="flex bg-zinc-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setActionMode('movement')}
                  className={cn(
                    'h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    actionMode === 'movement' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
                  )}
                >
                  Ingreso / Salida
                </button>
                <button
                  onClick={() => setActionMode('transfer')}
                  className={cn(
                    'h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    actionMode === 'transfer' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
                  )}
                >
                  Traslado
                </button>
              </div>
            </div>

            <div className={cn("transition-all duration-500 ease-in-out", isFormCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-[1000px] opacity-100")}>
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

          {/* Main Tabs Navigation */}
          <Tabs defaultValue="stock" className="space-y-6">
            <div className="flex items-center gap-3">
              <TabsList className="bg-white border border-zinc-100 rounded-2xl p-1.5 h-auto flex-1 shadow-sm">
                {[
                  { value: 'global',  icon: 'search',      label: 'Consulta Global' },
                  { value: 'stock',   icon: 'inventory_2', label: 'Stock Almacén' },
                  { value: 'history', icon: 'history',     label: 'Historial' },
                  { value: 'admin',   icon: 'settings',    label: 'Administración' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 h-11 flex items-center justify-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-zinc-400 data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <button
                onClick={() => setIsTabsCollapsed(!isTabsCollapsed)}
                className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-zinc-950 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">
                  {isTabsCollapsed ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            
            <div className={cn("transition-all duration-500 ease-in-out", isTabsCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-[2000px] opacity-100")}>
              <TabsContent value="global" className="m-0">
                <div className={cn(CARD, 'p-8')}>
                  <GlobalStockSearch refreshTrigger={refreshTrigger} />
                </div>
              </TabsContent>

              <TabsContent value="stock" className="m-0">
                <div className={cn(CARD, 'min-h-[600px]')}>
                  <StockTable warehouseId={warehouseId} refreshTrigger={refreshTrigger} />
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <div className={cn(CARD)}>
                  <MovementHistory warehouseId={warehouseId} warehouseName={warehouseName} refreshTrigger={refreshTrigger} />
                </div>
              </TabsContent>

              <TabsContent value="admin" className="m-0">
                <div className={cn(CARD, 'p-8')}>
                  <AdminTabs userEmail={user?.email} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
