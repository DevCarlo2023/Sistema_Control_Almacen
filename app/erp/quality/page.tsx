'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { InspectionForm } from '@/components/erp/quality/inspection-form';
import { InspectionCard } from '@/components/erp/quality/inspection-card';
import { supabase } from '@/lib/supabase';

export default function QualityPage() {
  const [showForm, setShowForm] = React.useState(false);
  const [inspections, setInspections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchInspections();
  }, []);

  async function fetchInspections() {
    setLoading(true);
    const { data, error } = await supabase
      .from('quality_inspections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setInspections(data);
    setLoading(false);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
            QUALITY CONTROL & ASSURANCE
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-3">
            Gestión de <span className="text-blue-600">Calidad</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed italic">
            Control de inspecciones técnicas, auditorías y cumplimiento de protocolos industriales.
          </p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-4 bg-zinc-950 text-white rounded-sm text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-zinc-200"
        >
          {showForm ? 'Cerrar Formulario' : 'Nueva Inspección'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-sm shadow-2xl p-8 animate-in zoom-in-95 duration-500">
           <InspectionForm onClear={() => setShowForm(false)} />
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Inspecciones" value={inspections.length.toString()} icon="fact_check" sub="TOTALES" />
        <MetricCard title="Aprobados" value={inspections.filter(i => i.status === 'approved').length.toString()} icon="verified" sub="CUMPLIMIENTO" />
        <MetricCard title="Observados" value={inspections.filter(i => i.status === 'rejected').length.toString()} icon="gpp_bad" sub="CRÍTICO" />
        <MetricCard title="Pendientes" value="0" icon="pending_actions" sub="AUDITORÍA" />
      </div>

      {/* Inspections List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-2 h-6 bg-blue-600 rounded-full" />
           <h3 className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em]">Listado de Inspecciones Recientes</h3>
        </div>
        
        {loading ? (
          <div className="h-64 bg-zinc-50 border border-zinc-100 rounded flex items-center justify-center">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Cargando Datos de Calidad...</span>
          </div>
        ) : inspections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspections.map(ins => (
              <InspectionCard key={ins.id} inspection={ins} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-zinc-100 rounded-xl p-20 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-zinc-100">folder_open</span>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No se encontraron registros de inspección</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, sub }: any) {
  return (
    <div className="bg-white border border-zinc-200 rounded p-6 group hover:border-blue-500 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="material-symbols-outlined text-2xl text-zinc-300 group-hover:text-blue-500 transition-colors">{icon}</span>
      </div>
      <div className="text-4xl font-black text-zinc-950 tracking-tighter mb-1">{value}</div>
      <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{sub}</div>
      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{title}</div>
    </div>
  );
}
