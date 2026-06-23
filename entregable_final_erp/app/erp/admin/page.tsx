'use client';

import * as React from 'react';

export default function AdminPage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-outline font-black text-[10px] uppercase tracking-[0.4em]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          SECURE ADMINISTRATIVE NODE
        </div>
        <h1 className="text-6xl font-black text-on-surface tracking-tighter uppercase leading-[0.8] mb-2">
          Administración <span className="text-primary">Estratégica</span>
        </h1>
        <p className="text-outline-variant font-bold text-xs tracking-widest uppercase max-w-2xl">
          Gestión de procesos transversales, control financiero y auditoría de operaciones globales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
        {[
          { title: 'Gestión Humana', icon: 'badge' },
          { title: 'Finanzas & Costos', icon: 'payments' },
          { title: 'Documentación', icon: 'description' },
        ].map((item) => (
          <div key={item.title} className="bg-surface-container p-10 rounded shadow-sm border border-outline-variant/10 group hover:shadow-xl transition-all">
            <span className="material-symbols-outlined text-4xl text-primary mb-6 group-hover:scale-110 transition-transform">{item.icon}</span>
            <h3 className="text-xl font-black uppercase tracking-tight">{item.title}</h3>
            <div className="mt-6 h-1 w-10 bg-primary/20 group-hover:w-full transition-all duration-500"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
