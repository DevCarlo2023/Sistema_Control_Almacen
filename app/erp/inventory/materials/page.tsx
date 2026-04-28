'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Filter, 
  MoreHorizontal,
  ChevronRight,
  Database,
  RefreshCcw,
  Eye
} from 'lucide-react';

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = React.useState('stock');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* ── Header Area ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4 block">Inventory Cluster / Materials</span>
          <h1 className="text-5xl font-black text-zinc-950 uppercase tracking-tighter leading-none italic">
            Gestión de <span className="text-blue-600">Materiales</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sistema Sincronizado</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Stats & Operations */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-zinc-400">home_work</span>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Almacén Activo</h3>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-blue-600 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-xs font-black text-zinc-950 uppercase tracking-tighter">ALM-OF-01</span>
              </div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase">Oficina</span>
            </div>
          </div>

          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Data Sync Active</h3>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed tracking-wider">
              Nodo central operativo en tiempo real. Todos los movimientos están protegidos por SSL.
            </p>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-zinc-400">database</span>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Operaciones de Datos</h3>
            </div>
            <div className="space-y-3">
              <OperationButton icon="upload_file" label="Carga Masiva" color="text-blue-600" />
              <OperationButton icon="download" label="Stock (Excel)" color="text-green-600" />
              <OperationButton icon="warning" label="Bajo / Crítico" color="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Right Column: Table Section */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="bg-zinc-950 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-zinc-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white">bolt</span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Registrar Movimiento</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Entrada o salida de inventario rápido</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
              <button className="px-6 py-2.5 bg-white text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-widest">Ingreso / Salida</button>
              <button className="px-6 py-2.5 text-zinc-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Traslado</button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            
            {/* Table Header / Search */}
            <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-50">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
                <h2 className="text-lg font-black text-zinc-950 uppercase tracking-tighter">ALM-OF-01</h2>
              </div>
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar material o código..." 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4.5 pl-14 pr-6 text-xs font-bold text-zinc-600 outline-none focus:bg-white focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-10 border-b border-zinc-50 bg-zinc-50/30 flex items-center justify-center md:justify-start gap-8">
              <TableTab active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} label="Stock Almacén" icon="inventory_2" />
              <TableTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Historial" icon="history" />
              <TableTab active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Administración" icon="settings" />
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-10 py-6 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Código</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Descripción</th>
                    <th className="px-6 py-6 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Und.</th>
                    <th className="px-6 py-6 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cant.</th>
                    <th className="px-6 py-6 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">P. Unit</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  <TableRow code="40018067" desc="ABRAZADERA AJUSTABLE 6&quot; INOX" unit="UND" cant="1.0" price="S/. 5.00" total="S/. 5.00" isCritical />
                  <TableRow code="40015895" desc="ABRAZADERA CADDY GLV 3&quot;" unit="UND" cant="1.0" price="S/. 5.00" total="S/. 5.00" isCritical />
                  <TableRow code="40015885" desc="ABRAZADERA CADDY GLV 3/4&quot;" unit="UND" cant="1.0" price="S/. 5.00" total="S/. 5.00" isCritical />
                  <TableRow code="40015890" desc="ABRAZADERA CLEVIS 2&quot;" unit="UND" cant="1.0" price="S/. 5.00" total="S/. 5.00" isCritical />
                  <TableRow code="40019663" desc="ACOPLE CHICAGO HEMBRA 1/2&quot; ZINC" unit="UND" cant="2.0" price="S/. 5.00" total="S/. 10.00" isCritical />
                  <TableRow code="40018347" desc="ADAPTADOR UNION PRESION/ROSCA PVC 1&quot;" unit="UND" cant="27.0" price="S/. 5.00" total="S/. 135.00" isCritical />
                  <TableRow code="40012659" desc="CASCO SEG. T/JOCKEY BLANCO" unit="UND" cant="25.0" price="S/. 5.00" total="S/. 125.00" isCritical />
                  <TableRow code="54046112" desc="GUANTE ANTICORTE TALLA L" unit="PAA" cant="50.0" price="S/. 5.00" total="S/. 250.00" isHighlighted />
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-10 bg-zinc-50/50 border-t border-zinc-100 flex justify-end items-center gap-6">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Valoración Total del Almacén:</span>
              <span className="text-2xl font-black text-zinc-950 tracking-tighter">S/. 670.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableRow({ code, desc, unit, cant, price, total, isCritical, isHighlighted }: any) {
  return (
    <tr className={cn(
      "hover:bg-zinc-50/80 transition-colors group",
      isHighlighted && "bg-orange-50/60"
    )}>
      <td className="px-10 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-black text-zinc-950 tracking-tight">{code}</span>
          {isCritical && (
            <span className="w-fit px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Crítico</span>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="text-[11px] font-black text-zinc-950 uppercase tracking-tight">{desc}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="px-3 py-1 bg-zinc-100 text-zinc-400 text-[9px] font-black uppercase rounded-lg tracking-widest group-hover:bg-white transition-colors">{unit}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="text-sm font-black text-red-600 tracking-tighter italic">{cant}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="text-[10px] font-bold text-zinc-400 uppercase">{price}</span>
      </td>
      <td className="px-10 py-5 text-right">
        <div className="flex items-center justify-end gap-3">
          <FileText className="w-4 h-4 text-zinc-200 group-hover:text-blue-600 transition-colors" />
          <span className="text-xs font-black text-zinc-950 tracking-tight">{total}</span>
        </div>
      </td>
    </tr>
  );
}

function TableTab({ active, onClick, label, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-5 transition-all relative",
        active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      <span className={cn("material-symbols-outlined text-[20px]", active ? "text-zinc-950" : "text-zinc-300")}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-950 rounded-t-full" />
      )}
    </button>
  );
}

function OperationButton({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <button className="w-full flex items-center justify-center gap-4 bg-white border border-zinc-100 px-6 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-600 transition-all group">
      <span className={cn("material-symbols-outlined", color)}>{icon}</span>
      <span className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">{label}</span>
    </button>
  );
}
