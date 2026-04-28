'use client';

import * as React from 'react';
import { MasterEquipmentTable } from '@/components/inventory/master-equipment-table';
import { cn } from '@/lib/utils';
import { Wrench, ShieldCheck, Info } from 'lucide-react';

export default function EquipmentCatalogPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <header className="sticky top-0 -mx-4 px-4 py-8 md:py-10 mb-6 border-b border-cyan-100 bg-white/90 backdrop-blur-md z-[100] transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-[1600px] mx-auto">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-[10px] font-black text-cyan-700 uppercase tracking-[0.4em] flex items-center justify-center lg:justify-start gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              ASSET MANAGEMENT · MAESTRO FLOTA
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-950 tracking-tighter uppercase leading-[0.9]">
              Catálogo de <span className="text-cyan-700 italic">Equipos</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-500 font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Gestión centralizada de activos fijos. Identificación única por número de serie, marcas y modelos para el control de inventario.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-6 pb-2">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Base de Activos</span>
                <span className="text-xs font-black text-cyan-700 uppercase flex items-center gap-1.5">
                   Sincronizado <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-glow" />
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Info Alert: Flota */}
      <div className="bg-cyan-50 border border-cyan-100 p-5 rounded-2xl flex gap-3 items-start animate-in slide-in-from-top-2 duration-700 delay-150">
         <Info className="w-5 h-5 text-cyan-700 mt-1 shrink-0" />
         <div>
            <p className="text-[11px] font-black uppercase text-cyan-800 tracking-tight mb-0.5">Control de Trazabilidad</p>
            <p className="text-[10px] text-cyan-700/70 font-medium leading-relaxed">
               Cada equipo registrado aquí es un activo único identificado por su número de serie. El historial de documentación (certificados de izaje, mantenimiento) se vincula a esta ficha maestra.
            </p>
         </div>
      </div>

      {/* Main Table Section */}
      <div className="pt-2">
        <MasterEquipmentTable />
      </div>

      {/* Bottom Footer Meta */}
      <footer className="pt-12 pb-6 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
               <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Normativa ISO 9001:2015 · Gestión de Activos</p>
         </div>
      </footer>
    </div>
  );
}
