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
    blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   shadow: 'shadow-blue-500/10' },
    green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  shadow: 'shadow-green-500/10' },
    red:    { bg: 'bg-red-500/10',    text: 'text-red-400',    shadow: 'shadow-red-500/10' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', shadow: 'shadow-yellow-500/10' },
  };
  const c = colorMap[color];

  return (
    <Card className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', c.bg, c.shadow)}>
          <Icon className={cn('w-6 h-6', c.text)} />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNewInspection }: { onNewInspection: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-gray-600" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-white uppercase tracking-wide">Sin inspecciones registradas</p>
        <p className="text-sm text-gray-500">Comienza creando la primera inspección de calidad</p>
      </div>
      <Button
        onClick={onNewInspection}
        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs px-6 h-10 shadow-lg shadow-blue-500/20"
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
      // Refresh stats
      getQualityStats().then(setStats);
      toast.info('📋 Nueva inspección registrada', {
        description: `${newInspection.material_name} — ${newInspection.status === 'pass' ? 'CONFORME' : 'RECHAZADO'}`,
      });
    });

    return unsubscribe;
  }, [loadData]);

  // After form success, switch to history tab and refresh
  const handleFormSuccess = () => {
    setActiveTab('historial');
    loadData();
  };

  const conformityRate = stats?.conformity_rate ?? 0;
  const criticalAlerts = stats?.critical_alerts_week ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Módulo de Calidad</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-r from-white via-gray-100 to-gray-500 bg-clip-text text-transparent uppercase">
            Gestión de Calidad
          </h1>
          <p className="text-gray-500 text-sm">Registro y seguimiento de inspecciones de materiales y equipos</p>
        </div>

        <Button
          onClick={loadData}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="self-start md:self-auto rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 gap-2 text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Conformidad"
          value={`${conformityRate}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Tasa global"
        />
        <StatCard
          label="Aprobados"
          value={stats?.total_pass ?? '—'}
          icon={CheckCircle2}
          color="blue"
          subtitle="Total histórico"
        />
        <StatCard
          label="Rechazados"
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
          subtitle="Rechazos recientes"
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl h-14 w-fit">
          <TabsTrigger
            value="historial"
            className="rounded-xl px-6 h-12 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 text-gray-400"
          >
            <History className="w-4 h-4" />
            Historial
            {inspections.length > 0 && (
              <span className="ml-1 bg-white/10 rounded-full px-2 py-0.5 text-[9px]">
                {inspections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="nueva"
            className="rounded-xl px-6 h-12 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 text-gray-400"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Inspección
          </TabsTrigger>
        </TabsList>

        {/* ── History tab ── */}
        <TabsContent value="historial" className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : inspections.length === 0 ? (
            <EmptyState onNewInspection={() => setActiveTab('nueva')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspections.map((inspection) => (
                <InspectionCard key={inspection.id} inspection={inspection} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── New inspection tab ── */}
        <TabsContent value="nueva" className="mt-0">
          <Card className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <CardContent className="p-8 lg:p-12">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-1 border-b border-white/5 pb-6">
                  <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Registro Técnico de Inspección
                  </h2>
                  <p className="text-sm text-gray-500">
                    Complete el formulario y firme digitalmente para validar el cumplimiento del material.
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
