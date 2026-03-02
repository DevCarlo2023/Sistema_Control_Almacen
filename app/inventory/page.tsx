'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WarehouseSelector } from '@/components/inventory/warehouse-selector';
import { MaterialSearch } from '@/components/inventory/material-search';
import { MovementForm } from '@/components/inventory/movement-form';
import { StockTable } from '@/components/inventory/stock-table';
import { GlobalStockSearch } from '@/components/inventory/global-stock-search';
import { ExportButton } from '@/components/inventory/export-button';
import { ImportButton } from '@/components/inventory/import-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type Material } from '@/lib/types';
import { MovementHistory } from '@/components/inventory/movement-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function InventoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is in the whitelist
      const { data: authorized, error } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('email', session.user.email)
        .single();

      if (!authorized || error) {
        console.error('Unauthorized access attempt:', session.user.email);
        await supabase.auth.signOut();
        router.push('/login?error=Unauthorized');
        return;
      }

      setUser(session.user);
      // Artificial delay to ensure user sees the professional loading screen
      setTimeout(() => setLoading(false), 1200);
    };

    checkAuth();
  }, [router]);

  const handleWarehouseChange = async (newWarehouseId: string) => {
    setWarehouseId(newWarehouseId);
    setSelectedMaterial(null);

    // Get warehouse name
    const { data } = await supabase
      .from('warehouses')
      .select('name, location')
      .eq('id', newWarehouseId)
      .single();

    if (data) {
      setWarehouseName(data.name);
      setWarehouseLocation(data.location || '');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleMovementSuccess = () => {
    setSelectedMaterial(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // No longer using internal loading screen to prioritize speed
  const isInitialLoad = !user && loading;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center p-1.5 bg-white/5 rounded-xl border border-white/10 shadow-lg transition-transform hover:scale-105 duration-300 hidden sm:flex">
              <img
                src="/logo-promet.png"
                alt="PROMET Logo"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col border-l border-border/50 pl-3 sm:pl-4 hidden sm:flex">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-none uppercase">
                CONTROL <span className="text-primary">ALMACÉN</span>
              </h1>
              <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground opacity-60">Industrial Tech v2.0</span>
            </div>
            {/* Mobile-only title (Order: ALMACÉN PROMET) */}
            <div className="flex-col flex sm:hidden">
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground">ALMACÉN <span className="text-primary text-xs">PROMET</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 sm:h-10 px-3 sm:px-5 font-black uppercase text-[9px] sm:text-[10px] tracking-widest rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/60 transition-all gap-2 hidden sm:flex"
              onClick={() => router.push('/equipment')}
            >
              🔧 Equipos
            </Button>
            <div className="hidden md:flex flex-col items-end bg-muted/30 px-4 py-1.5 rounded-xl border border-border/30 backdrop-blur-sm">
              <span className="text-[10px] uppercase font-black text-primary tracking-widest opacity-80">Usuario Activo</span>
              <span className="text-sm font-bold text-foreground">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              className="h-9 sm:h-10 px-3 sm:px-4 hover:bg-destructive/10 hover:text-destructive font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all rounded-xl border border-transparent hover:border-destructive/20"
              onClick={handleLogout}
            >
              <span className="hidden sm:inline">Salir</span>
              <span className="sm:hidden">X</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Sidebar - Controls */}
          <div className="lg:col-span-3 space-y-6 print:hidden">
            <Card className="p-4 glass-card rounded-2xl border-primary/10">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Seleccionar Almacén</label>
                <WarehouseSelector
                  value={warehouseId}
                  onWarehouseChange={handleWarehouseChange}
                />
              </div>

              <div className="mt-3 space-y-3 pt-2 border-t border-border/50">
                <h3 className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gestión</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <ExportButton warehouseId={warehouseId} warehouseName={warehouseName} />
                  <ImportButton warehouseId={warehouseId} onImportSuccess={handleMovementSuccess} />
                </div>
              </div>
            </Card>

            {/* Quick Status Card - Hidden on very small mobile for space */}
            <Card className="p-6 glass shadow-xl rounded-2xl hidden sm:block border-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.1em] text-foreground">PROYECTO SAN GABRIEL</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                Sistema de Gestión implementado para el control de inventario en el proyecto.
              </p>
            </Card>
          </div>

          {/* Main Work Area */}
          <div className="lg:col-span-9 space-y-6 sm:space-y-8">
            {/* Quick Action Bar (Unified) */}
            <Card className="p-4 sm:p-6 glass-card rounded-2xl border-l-4 border-l-primary shadow-2xl overflow-visible relative print:hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <span className="text-primary">⚡</span>
                </div>
                Registrar Movimiento Rápido
              </h2>
              <MovementForm
                warehouseId={warehouseId}
                selectedMaterial={selectedMaterial}
                onSelectMaterial={setSelectedMaterial}
                onMovementSuccess={handleMovementSuccess}
              />
            </Card>

            {/* Tabs for Table & History */}
            <Tabs defaultValue="global" className="w-full">
              <div className="overflow-x-auto compact-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-full sm:w-fit bg-muted/30 p-1 rounded-xl glass border border-border/50 print:hidden min-w-max">
                  <TabsTrigger value="global" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-xs sm:text-sm">
                    🔍 Consulta
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-xs">
                    📦 Stock
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-xs sm:text-sm">
                    📜 Log
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-xs">
                    ⚙️ Admin
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="global" className="mt-0 focus-visible:outline-none">
                <Card className="glass-card rounded-2xl p-8 border-primary/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                  <GlobalStockSearch refreshTrigger={refreshTrigger} />
                </Card>
              </TabsContent>

              <TabsContent value="stock" className="mt-0 focus-visible:outline-none">
                <Card className="glass-card rounded-2xl overflow-hidden min-h-[400px]">
                  <StockTable warehouseId={warehouseId} refreshTrigger={refreshTrigger} />
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-0 focus-visible:outline-none">
                <Card className="glass-card rounded-2xl overflow-hidden">
                  <MovementHistory warehouseId={warehouseId} refreshTrigger={refreshTrigger} />
                </Card>
              </TabsContent>

              <TabsContent value="admin" className="mt-0 focus-visible:outline-none">
                <Card className="glass-card rounded-2xl p-6">
                  <AdminTabs userEmail={user?.email} />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center gap-4 text-center pb-20 print:hidden">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-8" />
        <div className="flex items-center gap-4 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
            Industrial Logic System
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <p className="text-xs font-bold text-muted-foreground/60 tracking-wider">
          Desarrollado por <span className="text-primary/70">Carlo Peña 2026</span> &copy; Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}
