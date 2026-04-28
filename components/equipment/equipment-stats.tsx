'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Construction, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { type Equipment } from '@/lib/types';
import { cn } from '@/lib/utils';

const LABEL = 'text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none';
const VALUE = 'text-2xl font-black text-zinc-950 tracking-tighter leading-none';
const CARD = 'bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5';

interface Stats {
  total: number;
  inField: number;
  maintenance: number;
  criticalCal: number;
}

export function EquipmentStats({ refreshTrigger, onFilterClick }: { refreshTrigger: number; onFilterClick?: (filter: any) => void }) {
  const [stats, setStats] = useState<Stats>({ total: 0, inField: 0, maintenance: 0, criticalCal: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data: all, error } = await supabase
        .from('equipment')
        .select('*')
        .returns<Equipment[]>();
      if (error) throw error;

      const total = all.length;
      const inField = all.filter(e => e.current_location === 'campo').length;
      const maintenance = all.filter(e => e.status === 'en_reparacion').length;
      
      const today = new Date();
      const criticalCal = all.filter(e => {
        if (e.category !== 'instrumentacion' || !e.calibration_end) return false;
        const end = new Date(e.calibration_end);
        const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // Vencidos o por vencer en 30 días
      }).length;

      setStats({ total, inField, maintenance, criticalCal });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { id: 'all', label: 'Total Activos', value: stats.total, icon: Package, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { id: 'campo', label: 'Equipos en Campo', value: stats.inField, icon: Construction, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'mantenimiento', label: 'En Mantenimiento', value: stats.maintenance, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'critico', label: 'Calibración Crítica', value: stats.criticalCal, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-600/10', alert: stats.criticalCal > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500">
      {items.map((item, i) => (
        <div 
          key={i} 
          onClick={() => onFilterClick?.(item.id)}
          className={cn(CARD, 'cursor-pointer active:scale-95 transition-transform', item.alert && 'border-red-200 bg-red-50/30')}
        >
          <div className="flex justify-between items-start">
            <div className={cn('p-2.5 rounded-xl', item.bg)}>
              <item.icon className={cn('w-5 h-5', item.color)} strokeWidth={2.5} />
            </div>
            {item.alert && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className={VALUE}>{item.value}</p>
            <p className={cn(LABEL, 'mt-1')}>{item.label}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 group-hover:rotate-12">
            <item.icon size={100} />
          </div>
        </div>
      ))}
    </div>
  );
}
