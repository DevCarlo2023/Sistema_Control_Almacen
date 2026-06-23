'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const alertFilters = [
  { name: 'Todas (24)', active: true },
  { name: 'Críticas (3)', active: false },
  { name: 'Importantes (12)', active: false },
  { name: 'Informativas (9)', active: false },
];

const alerts = [
  {
    type: 'CRÍTICA',
    time: 'Hace 2 min',
    title: 'Fallo Crítico: Reactor 04 - Sobrepresión',
    description: 'Se ha detectado una anomalía en la válvula de alivio. Desviación del +15% sobre el límite de seguridad nominal.',
    color: 'border-error',
    iconColor: 'text-error',
    iconBg: 'bg-error/10',
    actions: true
  },
  {
    type: 'IMPORTANTE',
    time: 'Hace 14 min',
    title: 'Retraso en Logística: Ruta S-102',
    description: 'El transporte de materia prima presenta un retraso de 45 minutos. ETA actualizada: 16:30 hrs.',
    color: 'border-tertiary',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/10',
    actions: false
  },
  {
    type: 'INFORMATIVA',
    time: 'Hace 1 h',
    title: 'Mantenimiento Programado',
    description: 'La sección B-12 entrará en revisión preventiva a las 22:00 hrs. No se requiere acción del operador.',
    color: 'border-primary',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    actions: false
  },
  {
    type: 'CRÍTICA',
    time: 'Hace 3 h',
    title: 'Corte de Energía - Ala Norte',
    description: 'Activación de generadores auxiliares por caída de red externa. Carga actual al 92%.',
    color: 'border-error',
    iconColor: 'text-error',
    iconBg: 'bg-error/10',
    actions: false
  },
  {
    type: 'IMPORTANTE',
    time: 'Hace 5 h',
    title: 'Stock Bajo: Lubricante Industrial CL-4',
    description: 'Inventario por debajo del umbral de seguridad (5%). Pedido automático generado.',
    color: 'border-tertiary',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/10',
    actions: false
  },
];

export default function AlertsPage() {
  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-outline font-black text-[10px] uppercase tracking-[0.3em]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          SYSTEM MONITORING
        </div>
        <h1 className="text-5xl font-black text-on-surface tracking-tighter uppercase">Centro de Alertas</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 pb-4 border-b border-outline-variant/10">
        {alertFilters.map((filter) => (
          <button
            key={filter.name}
            className={cn(
              "px-6 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all",
              filter.active 
                ? "brutalist-gradient text-white shadow-lg" 
                : "bg-surface-container-high text-outline hover:bg-surface-container-highest"
            )}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-6">
        {alerts.map((alert, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-surface-container-lowest rounded-sm border-l-4 p-8 shadow-sm transition-all hover:shadow-md group relative",
              alert.color
            )}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded flex items-center justify-center", alert.iconBg)}>
                   <span className={cn("material-symbols-outlined text-2xl", alert.iconColor)}>
                    {alert.type === 'CRÍTICA' ? 'warning' : alert.type === 'IMPORTANTE' ? 'priority_high' : 'info'}
                  </span>
                </div>
                <div>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", alert.iconColor)}>
                    {alert.type}
                  </span>
                  <h3 className="text-xl font-black text-on-surface tracking-tight uppercase group-hover:text-primary transition-colors">
                    {alert.title}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container px-2 py-1 rounded">
                {alert.time}
              </span>
            </div>

            <p className="text-sm text-outline-variant font-medium leading-relaxed mb-8 max-w-3xl">
              {alert.description}
            </p>

            {alert.actions && (
              <div className="flex gap-4">
                <button className="bg-error text-white px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-error/90 transition-all shadow-lg active:scale-95">
                  INTERVENIR
                </button>
                <button className="bg-surface-container-highest text-outline px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all active:scale-95">
                  VER DATOS
                </button>
              </div>
            )}

            {/* Subtle background decoration */}
            <div className="absolute right-0 bottom-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <span className="material-symbols-outlined text-9xl">shield</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer metadata placeholder */}
      <div className="pt-12 text-center">
        <p className="text-[9px] font-black text-outline/40 uppercase tracking-[0.4em]">
          End of secure monitoring log — Encryption Active
        </p>
      </div>
    </div>
  );
}
