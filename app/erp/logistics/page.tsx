'use client';

import * as React from 'react';

const logisticsItems = [
  { 
    title: 'Órdenes de Compra', 
    icon: 'shopping_cart', 
    status: '12 ACTIVAS',
    desc: 'Seguimiento de solicitudes y aprobaciones de compra.',
    color: 'bg-primary/5 border-primary/15',
    iconColor: 'text-primary',
  },
  { 
    title: 'Gestión de Proveedores', 
    icon: 'local_shipping', 
    status: '85 REGISTRADOS',
    desc: 'Base de datos de proveedores homologados y evaluaciones.',
    color: 'bg-zinc-50 border-zinc-200',
    iconColor: 'text-zinc-700',
  },
  { 
    title: 'Control de Despachos', 
    icon: 'conveyor_belt', 
    status: 'TURNO CONTINUO',
    desc: 'Registro de salidas y confirmaciones de entrega a pie de obra.',
    color: 'bg-zinc-50 border-zinc-200',
    iconColor: 'text-zinc-700',
  },
];

export default function LogisticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="pb-6 border-b border-zinc-200">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          SUPPLY CHAIN &amp; LOGISTICS
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-3">
          Gestión <span className="text-primary">Logística</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
          Control de la cadena de suministro, gestión de proveedores y optimización de despachos a obra.
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Pendientes', value: '7', color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'En Tránsito', value: '3', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Completados', value: '41', color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-2.5 rounded border ${s.color} text-xs font-black uppercase tracking-widest`}>
            <span className="text-xl font-black">{s.value}</span>
            <span className="opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {logisticsItems.map((item) => (
          <div
            key={item.title}
            className={`${item.color} border rounded p-8 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
          >
            <span className={`material-symbols-outlined text-4xl mb-6 block group-hover:scale-110 transition-transform duration-300 ${item.iconColor}`}>
              {item.icon}
            </span>
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight mb-2">{item.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">{item.desc}</p>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">{item.status}</span>
          </div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded p-8 flex flex-col sm:flex-row items-center gap-6">
        <span className="material-symbols-outlined text-5xl text-zinc-300">construction</span>
        <div>
          <h3 className="text-sm font-black text-zinc-700 uppercase tracking-widest mb-1">Módulo en Desarrollo</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Las vistas completas de Logística estarán disponibles próximamente. Los KPIs y el flujo de órdenes se integrarán con el módulo de Materiales.
          </p>
        </div>
      </div>
    </div>
  );
}
