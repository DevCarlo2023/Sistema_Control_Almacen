'use client';

import * as React from 'react';
import Link from 'next/link';

const inventoryModules = [
  {
    title: 'Materiales',
    description: 'Gestión maestro de artículos, lotes y trazabilidad de stock por almacén.',
    icon: 'package_2',
    href: '/erp/inventory/materials',
    stats: [
      { label: 'Total SKUs', value: '1,245' },
      { label: 'Críticos', value: '12' },
    ],
    accent: 'border-primary/30 hover:border-primary',
    iconBg: 'bg-primary',
    badge: 'bg-primary/10 text-primary',
  },
  {
    title: 'Equipos',
    description: 'Control de activos críticos, mantenimiento y disponibilidad de flota y personal.',
    icon: 'precision_manufacturing',
    href: '/erp/inventory/equipment',
    stats: [
      { label: 'Equipos Activos', value: '84' },
      { label: 'En Obra', value: '31' },
    ],
    accent: 'border-zinc-300 hover:border-zinc-600',
    iconBg: 'bg-zinc-800',
    badge: 'bg-zinc-100 text-zinc-700',
  },
];

export default function InventoryLandingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="pb-6 border-b border-zinc-200">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          OPERATIONAL CONTROL · ALMACÉN
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-3">
          Gestión de <span className="text-primary">Inventario</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
          Seleccione el módulo de control operativo para el despliegue de recursos y monitoreo de activos.
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {inventoryModules.map((mod) => (
          <Link href={mod.href} key={mod.title} className="group">
            <div className={`bg-white border-2 ${mod.accent} rounded shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative`}>
              {/* Top accent line */}
              <div className={`h-1 w-full ${mod.iconBg}`} />

              <div className="p-8 space-y-6">
                {/* Icon */}
                <div className={`w-14 h-14 ${mod.iconBg} rounded flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-white text-3xl">{mod.icon}</span>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{mod.description}</p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
                  {mod.stats.map(s => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-xl font-black text-zinc-950 tracking-tighter">{s.value}</span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
                  <div className="flex-1 flex justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded ${mod.badge} text-[9px] font-black uppercase tracking-[0.2em]`}>
                      ACCEDER
                      <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="flex items-center gap-4 pt-4">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-sm">
              {i}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          3 Nodos de Seguridad Activos — Inventario Sincronizado
        </p>
      </div>
    </div>
  );
}
