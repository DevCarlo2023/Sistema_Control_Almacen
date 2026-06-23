'use client';

import { MasterWarehouseTable } from '@/components/inventory/master-warehouse-table';
import { Warehouse } from 'lucide-react';

export default function WarehouseCatalogPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
        {/* Aesthetic Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 transition-opacity group-hover:opacity-100 duration-500" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-zinc-50 rounded-full blur-2xl -ml-24 -mb-24 opacity-40" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-cyan-900 flex items-center justify-center shadow-xl shadow-cyan-900/20 group-hover:scale-105 transition-transform duration-500">
             <Warehouse className="w-6 h-6 md:w-8 md:h-8 text-white transition-all group-hover:rotate-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600/80">Gestión de Centros</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-zinc-950 tracking-tight uppercase leading-none font-outfit">
              Catálogo de <span className="text-cyan-800">Almacenes</span>
            </h1>
            <p className="text-[10px] md:text-xs font-semibold text-zinc-400 mt-2 italic flex items-center gap-1.5 font-outfit">
               Administración centralizada de ubicaciones físicas y depósitos de activos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
           <div className="hidden sm:flex flex-col items-end px-4 border-r border-zinc-100">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estado Sistema</span>
              <span className="text-xs font-black text-green-500 uppercase flex items-center gap-1.5 mt-0.5 font-outfit">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                 Conectado
              </span>
           </div>
        </div>
      </div>

      {/* ── Content Section ────────────────────────────── */}
      <div className="relative z-10">
         <MasterWarehouseTable />
      </div>
    </div>
  );
}
