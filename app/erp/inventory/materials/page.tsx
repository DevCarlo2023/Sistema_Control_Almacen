'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  Search, 
  FileText, 
  ChevronDown,
  Eye,
  Settings,
  History,
  Database,
  SearchIcon,
  Check
} from 'lucide-react';

const warehouses = [
  { id: 'ALM-J1', name: 'CANTERA', color: 'bg-orange-500' },
  { id: 'ALM-MIR-01', name: 'MIRADOR', color: 'bg-blue-500' },
  { id: 'ALM-OF-01', name: 'OFICINA', color: 'bg-blue-500', selected: true },
  { id: 'ALM-OF-02', name: 'OFICINA', color: 'bg-red-500' },
  { id: 'ALM-SAT-01', name: 'SATELITE', color: 'bg-blue-500' },
  { id: 'JAULA-ALM-01', name: 'OFICINA', color: 'bg-red-500' },
  { id: 'JAULA-VEST-01', name: 'VESTIDORES', color: 'bg-green-500' },
  { id: 'PATIO-OF', name: 'OFICINA', color: 'bg-blue-500' },
  { id: 'PATIO-SAT', name: 'SATELITE', color: 'bg-red-500' },
];

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = React.useState('stock');
  const [activeOperation, setActiveOperation] = React.useState('ingreso');
  const [showWarehouses, setShowWarehouses] = React.useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState(warehouses[2]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-3 block">Inventory Cluster / Materials</span>
          <h1 className="text-5xl font-black text-zinc-950 uppercase tracking-tighter leading-none italic">
            Gestión de <span className="text-blue-600">Materiales</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sistema Sincronizado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ── Left Column ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Almacén Activo Selector WITH DROPDOWN AS PER PHOTO 2 */}
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-zinc-400">home_work</span>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Almacén Activo</h3>
            </div>
            
            <div 
              onClick={() => setShowWarehouses(!showWarehouses)}
              className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-600 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", selectedWarehouse.color)} />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-zinc-950 uppercase tracking-tighter">{selectedWarehouse.id}</span>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase leading-none">{selectedWarehouse.name}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-300" />
            </div>

            {/* FLOATING DROPDOWN LIST (MATCHES PHOTO 2) */}
            {showWarehouses && (
              <div className="absolute left-6 right-6 top-[120px] bg-white border border-zinc-100 rounded-2xl shadow-2xl z-[100] py-4 max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                {warehouses.map((wh) => (
                  <div 
                    key={wh.id}
                    onClick={() => {
                      setSelectedWarehouse(wh);
                      setShowWarehouses(false);
                    }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-2 h-2 rounded-full", wh.color)} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-zinc-950 uppercase tracking-tighter">{wh.id}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{wh.name}</span>
                      </div>
                    </div>
                    {wh.id === selectedWarehouse.id && <Check className="w-3.5 h-3.5 text-zinc-400" />}
                  </div>
                ))}
              </div>
            )}
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
              <Database className="w-4 h-4 text-zinc-300" />
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Operaciones de Datos</h3>
            </div>
            <div className="space-y-3">
              <SidebarButton icon="upload_file" label="Carga Masiva" color="text-blue-600" />
              <SidebarButton icon="download" label="Stock (Excel)" color="text-green-600" />
              <SidebarButton icon="warning" label="Bajo / Crítico" color="text-orange-600" />
            </div>
          </div>
        </div>

        {/* ── Main Section ──────────────────────────────── */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Registrar Movimiento Panel (IDENTICAL TO PHOTO 2) */}
          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200">
                  <span className="material-symbols-outlined text-white">bolt</span>
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">Registrar Movimiento</h3>
                  <Eye className="w-4 h-4 text-zinc-300" />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                <button 
                  onClick={() => setActiveOperation('ingreso')}
                  className={cn(
                    "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeOperation === 'ingreso' ? "bg-zinc-950 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Ingreso / Salida
                </button>
                <button 
                  onClick={() => setActiveOperation('traslado')}
                  className={cn(
                    "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeOperation === 'traslado' ? "bg-zinc-950 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Traslado
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Operación</label>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-black text-zinc-950 uppercase">▲ Entrada</span>
                  <ChevronDown className="w-4 h-4 text-zinc-300" />
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Buscar Producto (Código o Nombre)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Escribe el código o el nombre..."
                    className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-bold text-zinc-950 outline-none focus:bg-white focus:border-blue-600 transition-all shadow-sm"
                  />
                  <button className="px-6 py-4 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Buscar</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad Neta</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-black text-zinc-950 outline-none focus:bg-white focus:border-blue-600 transition-all shadow-sm"
                />
              </div>

              <div className="md:col-span-3 space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Notas de Auditoría (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Entrega de proveedor..."
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-bold text-zinc-950 outline-none focus:bg-white focus:border-blue-600 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-end pb-1">
                <button className="w-full py-4 bg-green-500/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 cursor-not-allowed">
                  Registrar 0 Items
                </button>
              </div>
            </div>
          </div>

          {/* Table Area (Pixel Perfect Rows from previous step preserved) */}
          <div className="bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-50">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
                <h2 className="text-lg font-black text-zinc-950 uppercase tracking-tighter">{selectedWarehouse.id}</h2>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input 
                  type="text" 
                  placeholder="Buscar material o código..." 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4.5 pl-14 pr-6 text-xs font-bold text-zinc-600 outline-none focus:bg-white focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="px-10 border-b border-zinc-50 bg-zinc-50/30 flex items-center justify-center md:justify-start gap-8">
              <TableTab active={activeTab === 'global'} label="Consulta Global" icon={<SearchIcon className="w-4 h-4" />} />
              <TableTab active={activeTab === 'stock'} label="Stock Almacén" icon={<Database className="w-4 h-4" />} />
              <TableTab active={activeTab === 'history'} label="Historial" icon={<History className="w-4 h-4" />} />
              <TableTab active={activeTab === 'admin'} label="Administración" icon={<Settings className="w-4 h-4" />} />
            </div>

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
                  <TableRow code="54046112" desc="GUANTE ANTICORTE TALLA L" unit="PAA" cant="50.0" price="S/. 5.00" total="S/. 250.00" isHighlighted />
                </tbody>
              </table>
            </div>

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

function TableTab({ active, label, icon }: any) {
  return (
    <button className={cn(
      "flex items-center gap-3 px-6 py-5 transition-all relative",
      active ? "text-zinc-950 border-b-2 border-zinc-950" : "text-zinc-400 hover:text-zinc-600"
    )}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function SidebarButton({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <button className="w-full flex items-center justify-center gap-4 bg-white border border-zinc-100 px-6 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-600 transition-all group">
      <span className={cn("material-symbols-outlined", color)}>{icon}</span>
      <span className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">{label}</span>
    </button>
  );
}
