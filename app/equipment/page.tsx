'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquipmentMovementForm } from '@/components/equipment/movement-form';
import { EquipmentMovementHistory } from '@/components/equipment/movement-history';
import { EquipmentTable } from '@/components/equipment/equipment-table';
import { WorkerTable } from '@/components/equipment/worker-table';
import { toast } from 'sonner';
import { FileDown, Package, Users, Loader2, RotateCcw } from 'lucide-react';
import { formatText } from '@/lib/utils';
import { ImportEquipment } from '@/components/equipment/import-equipment';
import { ImportWorkers } from '@/components/equipment/import-workers';
import { LoadingScreen } from '@/components/ui/loading-screen';

// ── Compact icon-only import toolbar ──────────────────────────────────────────
function CompactImportBar({ onSuccess }: { onSuccess: () => void }) {
    const equipFileRef = useRef<HTMLInputElement>(null);
    const workerFileRef = useRef<HTMLInputElement>(null);
    const [loadingEq, setLoadingEq] = useState(false);
    const [loadingWk, setLoadingWk] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const downloadEquipTemplate = () => {
        const data = [{ nombre: 'Amoladora Angular 7" DEWALT DWE402', numero_serie: 'AM-001', marca: 'DeWalt', modelo: 'DWE402', estado: 'operativo', ubicacion: 'ALMACÉN PRINCIPAL', precio_unitario: 350 }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb1 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb1, ws, 'Equipos');
        XLSX.writeFile(wb1, 'plantilla_equipos.xlsx');
    };

    const downloadWorkerTemplate = () => {
        const data = [{ numero_trabajador: 'T-001', dni: '45678901', nombre_completo: 'Juan Pérez López', cargo: 'Operario de campo' }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb2 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb2, ws, 'Trabajadores');
        XLSX.writeFile(wb2, 'plantilla_trabajadores.xlsx');
    };

    const importFile = async (file: File, type: 'equipment' | 'workers') => {
        const setter = type === 'equipment' ? setLoadingEq : setLoadingWk;
        setter(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
                if (!rows.length) { toast.error('Archivo vacío'); setter(false); return; }

                const { data: whs } = await supabase.from('warehouses').select('id, name');
                const warehouseMap = new Map((whs || []).map(w => [w.name.toLowerCase(), w.id]));

                let ok = 0;
                for (const row of rows) {
                    const get = (k: string) => { const f = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase()); return f ? String(row[f]).trim() : ''; };
                    if (type === 'equipment') {
                        const name = formatText(get('nombre'));
                        if (!name) continue;
                        const locName = get('ubicacion').toLowerCase();
                        const warehouse_id = warehouseMap.get(locName) || null;
                        const { error } = await supabase.from('equipment').upsert({
                            name,
                            serial_number: get('numero_serie') || null,
                            brand: formatText(get('marca')) || null,
                            model: formatText(get('modelo')) || null,
                            status: get('estado') || 'operativo',
                            warehouse_id,
                            unit_price: parseFloat(get('precio_unitario')) || 0,
                            current_location: 'almacen'
                        }, { onConflict: 'serial_number' });
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
        reader.readAsBinaryString(file);
    };

    const handleRevert = async () => {
        setReverting(true); setShowConfirm(false);
        try {
            const { data: used } = await supabase.from('equipment_movements').select('equipment_id');
            const ids = (used || []).map((m: any) => m.equipment_id);
            const q = ids.length > 0
                ? supabase.from('equipment').delete().not('id', 'in', `(${ids.map((id: string) => `'${id}'`).join(',')})`)
                : supabase.from('equipment').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error } = await q;
            if (error) throw error;
            toast.success('Equipos sin movimientos eliminados.');
            onSuccess();
        } catch (err: any) { toast.error(err.message); }
        finally { setReverting(false); }
    };

    const iconBtn = 'relative group flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 bg-background hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer';
    const tooltip = 'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50';

    return (
        <Card className="p-3 glass-card rounded-2xl border-border/20 shadow-lg">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Gestión de Base de Datos</p>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    <div className="w-1 h-1 rounded-full bg-primary/20" />
                </div>
            </div>
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={equipFileRef} onChange={e => e.target.files?.[0] && importFile(e.target.files[0], 'equipment')} />
            <input type="file" accept=".xlsx,.xls" className="hidden" ref={workerFileRef} onChange={e => e.target.files?.[0] && importFile(e.target.files[0], 'workers')} />
            <div className="flex items-center gap-2.5 flex-wrap">
                {/* Download equip template */}
                <button className={iconBtn} onClick={downloadEquipTemplate}>
                    <FileDown className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className={tooltip}>Plantilla Equipos</span>
                </button>
                {/* Import equip */}
                <button className={iconBtn} onClick={() => equipFileRef.current?.click()} disabled={loadingEq}>
                    {loadingEq ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Package className="w-4 h-4 text-blue-500 shrink-0" />}
                    <span className={tooltip}>Importar Equipos</span>
                </button>

                <div className="w-px h-6 bg-border/50 mx-0.5" />

                {/* Download workers template */}
                <button className={iconBtn} onClick={downloadWorkerTemplate}>
                    <FileDown className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className={tooltip}>Plantilla Personal</span>
                </button>
                {/* Import workers */}
                <button className={iconBtn} onClick={() => workerFileRef.current?.click()} disabled={loadingWk}>
                    {loadingWk ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Users className="w-4 h-4 text-purple-500 shrink-0" />}
                    <span className={tooltip}>Importar Personal</span>
                </button>

                <div className="flex-1" />

                {/* Revert */}
                {showConfirm ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                        <button onClick={handleRevert} className="h-9 px-3 text-[9px] font-black uppercase bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">Confirmar</button>
                        <button onClick={() => setShowConfirm(false)} className="h-9 px-3 text-[9px] font-black uppercase bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all">No</button>
                    </div>
                ) : (
                    <button className={`${iconBtn} hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900/50`} onClick={() => setShowConfirm(true)} disabled={reverting}>
                        {reverting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <RotateCcw className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className={`${tooltip} bg-red-700`}>Revertir Carga</span>
                    </button>
                )}
            </div>
        </Card>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function EquipmentPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }
            const { data: authorized } = await supabase.from('authorized_users').select('email').eq('email', session.user.email).single();
            if (!authorized) { await supabase.auth.signOut(); router.push('/login?error=Unauthorized'); return; }
            setUser(session.user);

            // Check for initial tab in URL
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab === 'workers') {
                setActiveTab('workers');
            } else if (tab === 'equipment') {
                setActiveTab('equipment');
            }

            // Artificial delay for visibility
            setTimeout(() => setLoading(false), 1200);
        };
        checkAuth();

        const setActiveTab = (val: string) => {
            const tabsElement = document.querySelector('[role="tablist"]');
            if (tabsElement) {
                const trigger = tabsElement.querySelector(`[value="${val}"]`) as HTMLElement;
                if (trigger) trigger.click();
            }
        };
    }, [router]);

    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
    const refresh = () => setRefreshTrigger(p => p + 1);

    // No longer using internal loading screen to prioritize speed
    const isInitialLoad = !user && loading;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl print:hidden">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Desktop & Tablet Header (Logo + Title) */}
                        <div className="flex items-center gap-3 max-[480px]:hidden">
                            <div className="flex items-center p-1.5 bg-white/5 rounded-xl border border-white/10 shadow-lg">
                                <img src="/logo-promet.png" alt="PROMET Logo" className="h-8 sm:h-10 w-auto object-contain" />
                            </div>
                            <div className="flex flex-col border-l border-border/50 pl-3 sm:pl-4">
                                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-none uppercase">
                                    CONTROL <span className="text-primary">EQUIPOS</span>
                                </h1>
                                <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground opacity-60">Industrial Tech v2.0</span>
                            </div>
                        </div>

                        {/* Mobile Header (Title Only - Order: EQUIPOS PROMET) */}
                        <div className="flex-col hidden max-[480px]:flex">
                            <h1 className="text-sm font-black uppercase tracking-tight text-foreground">EQUIPOS <span className="text-primary text-xs">PROMET</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button variant="outline" size="sm" className="font-black uppercase text-[9px] sm:text-[10px] tracking-widest rounded-xl hidden sm:flex h-9 sm:h-10 px-3 sm:px-5" onClick={() => router.push('/inventory')}>
                            ← <span className="hidden md:inline ml-1">Inventario</span>
                        </Button>
                        <div className="hidden md:flex flex-col items-end bg-muted/30 px-4 py-1.5 rounded-xl border border-border/30">
                            <span className="text-[10px] uppercase font-black text-primary tracking-widest opacity-80">Usuario Activo</span>
                            <span className="text-sm font-bold">{user?.email}</span>
                        </div>
                        <Button variant="ghost" className="h-9 sm:h-10 px-3 sm:px-4 hover:bg-destructive/10 hover:text-destructive font-black uppercase text-[9px] sm:text-[10px] tracking-widest rounded-xl transition-all" onClick={handleLogout}>
                            <span className="hidden sm:inline">Salir</span>
                            <span className="sm:hidden text-base">✕</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

                    {/* Sidebar */}
                    <div className="lg:col-span-3 space-y-4 print:hidden">
                        {/* Quick Navigation - Mobile only */}
                        <div className="flex lg:hidden gap-3 mb-2">
                            <Button variant="outline" size="sm" className="flex-1 font-black uppercase text-[9px] tracking-widest rounded-xl h-10" onClick={() => router.push('/inventory')}>
                                ← Inventario
                            </Button>
                        </div>

                        {/* Movement form */}
                        <Card className="p-4 glass-card rounded-2xl border-primary/10 overflow-visible">
                            <h2 className="text-xs font-black uppercase text-primary tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span>⚡</span> Registrar Movimiento
                            </h2>
                            <EquipmentMovementForm onSuccess={refresh} />
                        </Card>

                        {/* Import sections - Collapsible or Grid on small tablet */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <Card className="p-4 glass-card rounded-2xl border-blue-500/10">
                                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-3">📦 Importar Equipos</h3>
                                <ImportEquipment onSuccess={refresh} />
                            </Card>

                            <Card className="p-4 glass-card rounded-2xl border-purple-500/10">
                                <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-3">👷 Importar Personal</h3>
                                <ImportWorkers onSuccess={refresh} />
                            </Card>
                        </div>
                    </div>

                    {/* Main area */}
                    <div className="lg:col-span-9 space-y-6 sm:space-y-8">
                        <Tabs defaultValue="history" className="w-full">
                            <div className="overflow-x-auto compact-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                                <TabsList className="inline-flex w-full sm:w-fit bg-muted/30 p-1 rounded-xl glass border border-border/50 print:hidden min-w-max">
                                    <TabsTrigger value="history" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-xs sm:text-sm">
                                        📜 Historial
                                    </TabsTrigger>
                                    <TabsTrigger value="equipment" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-xs sm:text-sm">
                                        🔧 Equipos
                                    </TabsTrigger>
                                    <TabsTrigger value="workers" className="flex-1 sm:flex-none rounded-lg font-bold px-4 sm:px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all text-xs sm:text-sm">
                                        👷 Trabajadores
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="history" className="mt-0">
                                <Card className="glass-card rounded-2xl overflow-hidden">
                                    <EquipmentMovementHistory refreshTrigger={refreshTrigger} />
                                </Card>
                            </TabsContent>

                            <TabsContent value="equipment" className="mt-0">
                                <Card className="glass-card rounded-2xl overflow-hidden">
                                    <EquipmentTable refreshTrigger={refreshTrigger} />
                                </Card>
                            </TabsContent>

                            <TabsContent value="workers" className="mt-0">
                                <Card className="glass-card rounded-2xl overflow-hidden">
                                    <WorkerTable refreshTrigger={refreshTrigger} />
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
