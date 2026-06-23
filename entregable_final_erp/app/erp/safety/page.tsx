'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const safetyMetrics = [
  { title: 'Días Sin Accidentes', value: '187', icon: 'emergency_home', trend: '+3 vs mes ant.', trendUp: true },
  { title: 'EPP Verificados', value: '98%', icon: 'safety_check', trend: 'Cumplimiento', trendUp: true },
  { title: 'Checklists Activos', value: '24', icon: 'assignment_turned_in', trend: '3 pendientes', trendUp: false },
  { title: 'Observaciones Abiertas', value: '5', icon: 'report_problem', trend: '-2 esta semana', trendUp: true },
];

const safetyItems = [
  { title: 'Registro de Incidentes', icon: 'emergency', color: 'text-red-600', bg: 'bg-red-50 border-red-200', desc: 'Gestión y seguimiento de incidentes, casi-accidentes y accidentes.' },
  { title: 'Control de EPP', icon: 'safety_check', color: 'text-primary', bg: 'bg-primary/5 border-primary/15', desc: 'Inventario y asignación de equipos de protección personal.' },
  { title: 'Checklists SSOMA', icon: 'assignment_turned_in', color: 'text-zinc-700', bg: 'bg-zinc-50 border-zinc-200', desc: 'Formularios de inspección diaria y permisos de trabajo.' },
  { title: 'Medio Ambiente', icon: 'eco', color: 'text-green-600', bg: 'bg-green-50 border-green-200', desc: 'Gestión de residuos, emisiones y cumplimiento ambiental.' },
];

export default function SafetyPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="pb-6 border-b border-zinc-200">
        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          SAFETY · HEALTH · ENVIRONMENT
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-3">
          SSOMA <span className="text-amber-600">Industrial</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
          Seguridad, Salud Ocupacional y Medio Ambiente. Control preventivo de riesgos y cumplimiento normativo.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {safetyMetrics.map(m => (
          <div key={m.title} className="bg-white border border-zinc-200 rounded p-5 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-2xl text-zinc-400 group-hover:text-amber-500 transition-colors">{m.icon}</span>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded",
                m.trendUp ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              )}>
                {m.trend}
              </span>
            </div>
            <div className="text-3xl font-black text-zinc-950 tracking-tighter mb-1">{m.value}</div>
            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{m.title}</div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {safetyItems.map(item => (
          <div
            key={item.title}
            className={`${item.bg} border rounded p-7 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
          >
            <span className={`material-symbols-outlined text-3xl mb-5 block group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
              {item.icon}
            </span>
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight mb-2">{item.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded p-8 flex flex-col sm:flex-row items-center gap-6">
        <span className="material-symbols-outlined text-5xl text-amber-300">construction</span>
        <div>
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-1">Módulo en Desarrollo</h3>
          <p className="text-xs text-amber-600 leading-relaxed">
            El módulo completo de SSOMA incluirá generación de reportes, matrices de riesgos y seguimiento de capacitaciones. Disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}
