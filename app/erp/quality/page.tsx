'use client';

import * as React from 'react';
import {
  Activity,
  ShieldCheck,
  PlusCircle,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { InspectionForm } from '@/components/erp/quality/inspection-form';
import { InspectionCard } from '@/components/erp/quality/inspection-card';
import {
  getInspections,
  getQualityStats,
  subscribeToInspections,
  type QualityInspection,
  type QualityStats,
} from '@/lib/quality-service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'yellow';
  subtitle?: string;
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-600',   shadow: 'shadow-blue-500/5' },
    green:  { bg: 'bg-green-500/10',  text: 'text-green-600',  shadow: 'shadow-green-500/5' },
    red:    { bg: 'bg-red-500/10',    text: 'text-red-600',    shadow: 'shadow-red-500/5' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', shadow: 'shadow-yellow-500/5' },
  };
  const c = colorMap[color];

  return (
    <Card className="border border-slate-100 bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-md', c.bg, c.shadow)}>
          <Icon className={cn('w-6 h-6', c.text)} />
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">{label}</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNewInspection }: { onNewInspection: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-20 h-20 rounded-[2rem] bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
        <ClipboardList className="w-10 h-10 text-blue-400" />
      </div>
      <div className="space-y-2">
        <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Sin registros de calidad</p>
        <p className="text-xs text-slate-500 font-medium">Comience creando la primera inspección técnica para el inventario.</p>
      </div>
      <Button
        onClick={onNewInspection}
        className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-xl shadow-blue-500/20 transition-all border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Nueva Inspección
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QualityPage() {
  const [inspections, setInspections] = React.useState<QualityInspection[]>([]);
  const [stats, setStats] = React.useState<QualityStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('historial');

  // Load data
  const loadData = React.useCallback(async () => {
    try {
      const [rows, s] = await Promise.all([getInspections(), getQualityStats()]);
      setInspections(rows);
      setStats(s);
    } catch (err: any) {
      toast.error('Error cargando inspecciones', { description: err?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();

    // Realtime subscription
    const unsubscribe = subscribeToInspections((newInspection) => {
      setInspections((prev) => [newInspection, ...prev]);
      getQualityStats().then(setStats);
      toast.info('📋 Nueva inspección registrada', {
        description: `${newInspection.material_name} — ${newInspection.status === 'pass' ? 'CONFORME' : 'RECHAZADO'}`,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleFormSuccess = () => {
    setActiveTab('historial');
    loadData();
  };

  const conformityRate = stats?.conformity_rate ?? 0;
  const criticalAlerts = stats?.critical_alerts_week ?? 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestión Operativa</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
            Módulo de <span className="text-blue-600">Calidad</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Inspección técnica y cumplimiento normativo</p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          disabled={loading}
          className="rounded-xl border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-4 transition-all"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          label="Tasa de Conformidad"
          value={`${conformityRate}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Rendimiento global"
        />
        <StatCard
          label="Auditados Conforme"
          value={stats?.total_pass ?? '—'}
          icon={CheckCircle2}
          color="blue"
          subtitle="Total histórico"
        />
        <StatCard
          label="No Conformidades"
          value={stats?.total_fail ?? '—'}
          icon={XCircle}
          color="red"
          subtitle="Total histórico"
        />
        <StatCard
          label="Alertas (7 días)"
          value={criticalAlerts}
          icon={AlertCircle}
          color={criticalAlerts > 0 ? 'red' : 'yellow'}
          subtitle="Incidentes críticos"
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-100 border border-slate-200 p-1.5 rounded-2xl h-14 w-fit flex items-center">
          <TabsTrigger
            value="historial"
            className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-slate-500"
          >
            <History className="w-4 h-4" />
            Historial de Inspecciones
          </TabsTrigger>
          <TabsTrigger
            value="nueva"
            className="rounded-xl px-8 h-11 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-slate-500"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Inspección
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-white border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : inspections.length === 0 ? (
            <EmptyState onNewInspection={() => setActiveTab('nueva')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inspections.map((inspection) => (
                <InspectionCard key={inspection.id} inspection={inspection} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nueva" className="mt-0 animate-in slide-in-from-right-4 duration-500">
          <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 lg:p-16">
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-2 border-b border-slate-50 pb-8 text-center md:text-left">
                  <h2 className="text-2xl font-black flex items-center justify-center md:justify-start gap-4 text-slate-900 uppercase tracking-tighter">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    Registro Técnico de Inspección
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Complete los parámetros de evaluación y valide con firma digital
                  </p>
                </div>
                <InspectionForm onSuccess={handleFormSuccess} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
