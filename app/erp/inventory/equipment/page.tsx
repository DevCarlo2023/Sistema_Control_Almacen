'use client';

import { useState } from 'react';
import { MasterEquipmentTable } from '@/components/inventory/master-equipment-table';
import { UpsertEquipmentDialog } from '@/components/inventory/upsert-equipment-dialog';
import { Card } from '@/components/ui/card';
import { Wrench, Plus, Gauge, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EquipmentPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* ── Header Section ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse inline-block" />
            Heavy Equipment & Assets
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Control de <span className="text-cyan-600 italic">Maquinaria</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium italic">Gestión de activos, horómetros, mantenimiento y asignación de flota pesada.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
           <UpsertEquipmentDialog onSuccess={handleRefresh} />
        </div>

        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      {/* ── Stats Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Flota Total', value: '...', icon: Wrench, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'En Operación', value: '...', icon: Gauge, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Mantenimiento', value: '...', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Disponibilidad', value: '94%', icon: Gauge, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-lg font-black text-zinc-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Area ────────────────────────────── */}
      <Card className="rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden bg-white">
        <div className="bg-zinc-950 p-8 text-white flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center">
                 <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Inventario Maestro de Equipos</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">Monitoreo de estado y horómetros en tiempo real</p>
              </div>
           </div>
        </div>
        <div className="p-0">
          <MasterEquipmentTable key={refreshTrigger} />
        </div>
      </Card>
    </div>
  );
}
