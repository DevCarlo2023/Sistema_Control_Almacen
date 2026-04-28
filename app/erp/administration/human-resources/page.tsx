'use client';

import { useState } from 'react';
import { WorkerManagement } from '@/components/admin/human-resources/worker-management';
import { HRImportBar } from '@/components/admin/human-resources/hr-import-bar';
import { Card } from '@/components/ui/card';
import { Users, UserPlus, FileSpreadsheet, Shield } from 'lucide-react';

export default function HumanResourcesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block" />
            Human Resources Management
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Gestión de <span className="text-blue-600 italic">Personal</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium italic">Control de trabajadores, cargos, DNI y asignaciones de personal al proyecto.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
           <HRImportBar onImportSuccess={handleRefresh} />
        </div>

        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Personal', value: '...', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Nuevos Ingresos', value: '...', icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Carga Masiva', value: 'Activo', icon: FileSpreadsheet, color: 'text-zinc-600', bg: 'bg-zinc-50' },
          { label: 'Seguridad', value: 'Verificado', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <p className="text-lg font-black text-zinc-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <Card className="rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden bg-white">
        <div className="bg-zinc-950 p-8 text-white flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                 <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Padrón de Trabajadores</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">Listado maestro sincronizado con nube</p>
              </div>
           </div>
        </div>
        <div className="p-0">
          <WorkerManagement key={refreshTrigger} />
        </div>
      </Card>
    </div>
  );
}
