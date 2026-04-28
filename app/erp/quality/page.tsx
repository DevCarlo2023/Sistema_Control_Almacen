'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const qualityMetrics = [
  { title: 'Protocolos de Inspección', value: '45', icon: 'verified', sub: 'ACTIVOS' },
  { title: 'No Conformidades', value: '3', icon: 'cancel', sub: 'ABIERTAS' },
  { title: 'Certificaciones', value: '12', icon: 'workspace_premium', sub: 'VIGENTES' },
  { title: 'Reportes Mensuales', value: '8', icon: 'assessment', sub: 'ESTE MES' },
];

const qualityModules = [
  { title: 'Inspecciones Técnicas', icon: 'fact_check', desc: 'Protocolos de control de calidad en campo y obra.', status: 'OPERATIVO' },
  { title: 'No Conformidades', icon: 'gpp_bad', desc: 'Registro, seguimiento y cierre de no conformidades.', status: '3 ABIERTAS' },
  { title: 'Auditorías Internas', icon: 'manage_search', desc: 'Planificación y ejecución de auditorías de procesos.', status: 'PRÓXIMA: 10 ABR' },
  { title: 'Certificaciones ISO', icon: 'workspace_premium', desc: 'Control de vigencias y documentación de certificaciones.', status: 'VIGENTE' },
];

export default function QualityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="pb-6 border-b border-zinc-200">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
          QUALITY CONTROL &amp; ASSURANCE
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-3">
          Gestión de <span className="text-blue-600">Calidad</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
          Monitoreo de parámetros técnicos, auditorías de procesos y control de no conformidades.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {qualityMetrics.map(m => (
          <div key={m.title} className="bg-white border border-zinc-200 rounded p-5 shadow-sm group hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined text-2xl text-zinc-300 group-hover:text-blue-500 transition-colors">{m.icon}</span>
            </div>
            <div className="text-4xl font-black text-zinc-950 tracking-tighter mb-1">{m.value}</div>
            <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{m.sub}</div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider leading-snug">{m.title}</div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {qualityModules.map(item => (
          <div
            key={item.title}
            className="bg-white border border-zinc-200 rounded p-6 group hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex gap-5"
          >
            <div className="w-12 h-12 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
              <span className="material-symbols-outlined text-xl text-blue-600 group-hover:text-white transition-colors duration-300">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight leading-tight">{item.title}</h3>
                <span className="text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded whitespace-nowrap tracking-wider flex-shrink-0">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded p-8 flex flex-col sm:flex-row items-center gap-6">
        <span className="material-symbols-outlined text-5xl text-blue-200">construction</span>
        <div>
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-1">Módulo en Desarrollo</h3>
          <p className="text-xs text-blue-600 leading-relaxed">
            Próximamente: Tablero de control de calidad con gráficas de tendencias, alertas automáticas y generación de reportes en PDF conforme a norma ISO 9001.
          </p>
        </div>
      </div>
    </div>
  );
}
