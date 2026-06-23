'use client';

import * as React from 'react';
import { MasterMaterialTable } from '@/components/inventory/master-material-table';
import { cn } from '@/lib/utils';
import { Package, BookOpen, AlertCircle } from 'lucide-react';

export default function MaterialCatalogPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <header className="sticky-blur-header -mx-4 md:-mx-8 px-4 md:px-8 py-4 md:py-8 mb-6 border-b border-zinc-100 bg-white/80 backdrop-blur-md z-[50]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 pt-4 lg:pt-0">
            <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              MASTER DATA · MANTENIMIENTO
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-tight">
              Catálogo de <span className="text-primary italic">Materiales</span>
            </h1>
            <p className="text-[11px] md:text-sm text-zinc-500 font-medium max-w-2xl leading-relaxed">
              Gestión centralizada del maestro de artículos. Defina códigos, unidades y precios base para la operación de almacén.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-6 pb-2">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Estado Maestro</span>
                <span className="text-xs font-black text-green-600 uppercase flex items-center gap-1.5">
                   Sincronizado <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Info Alert */}
      <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex gap-3 items-start animate-in slide-in-from-top-2 duration-700 delay-150">
         <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
         <div>
            <p className="text-[11px] font-black uppercase text-primary tracking-tight mb-0.5">Nota de Mantenimiento</p>
            <p className="text-[10px] text-primary/70 font-medium leading-relaxed">
               Los cambios realizados en el catálogo maestro se verán reflejados en las búsquedas de "Ingresos" y "Transferencias" en todos los almacenes del sistema.
            </p>
         </div>
      </div>

      {/* Main Table Section */}
      <div className="pt-2">
        <MasterMaterialTable />
      </div>

      {/* Bottom Footer Meta */}
      <footer className="pt-12 pb-6 border-t border-zinc-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
               <BookOpen className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Manual de Codificación Interna v2.4</p>
         </div>
      </footer>
    </div>
  );
}
