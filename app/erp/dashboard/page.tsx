'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Search, Bell, ChevronRight, Share2, Download, Filter } from 'lucide-react';

export default function ERPDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* ── Dashboard Header ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl italic">A</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
              Control <span className="text-blue-600">Project</span>
            </h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">
              Gestión de Activos 2024
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-zinc-400 hover:text-zinc-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="h-8 w-px bg-zinc-200 mx-2" />
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-zinc-900 uppercase">C. Peña Aponte</p>
              <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Almacén</p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-zinc-100 overflow-hidden shadow-sm">
              <img src="https://ui-avatars.com/api/?name=Carlo+Peña&background=0D0D0D&color=fff" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cinematic Hero Banner ─────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] h-[220px] md:h-[400px] shadow-2xl border border-zinc-100">
        <img
          alt="Minería Pesada"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Lunes, 27 de Abril</span>
        </div>
      </section>

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Stock Total"      value="9"    change="+ 1.2%" trend="up"   icon="inventory_2" detail="Unid. en Almacén" />
        <KPICard title="Flota Activa"     value="12"   change="89%"    trend="up"   icon="local_shipping" detail="Equipos Operativos" />
        <KPICard title="Alertas Rojas"    value="07"   change="URGENTE" trend="down" icon="warning" detail="Bajo Umbral" variant="alert" />
        <KPICard title="Sincronización"   value="100%" change="NUBE"    trend="up"   icon="sensors" detail="Estado Conexión" variant="sync" />
      </div>

      {/* ── Main Dashboard Content ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts and Stock Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-[0.1em]">Control de Stock Crítico</h3>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Monitoreo de umbrales en tiempo real</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                Gestionar Inventario <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <StockAlertItem title='REQUERIMIENTO: ABRAZADERA AJUSTABLE 6" INOX' msg="Stock actual 1 unidades por debajo del umbral mínimo de Carlo ERP." />
              <StockAlertItem title='REQUERIMIENTO: ABRAZADERA CADDY GLV 3"' msg="Stock actual 1 unidades por debajo del umbral mínimo de Carlo ERP." />
              <StockAlertItem title='REQUERIMIENTO: ABRAZADERA CADDY GLV 3/4"' msg="Stock actual 1 unidades por debajo del umbral mínimo de Carlo ERP." />
            </div>
          </div>
        </div>

        {/* Right Column: Efficiency & Activity */}
        <div className="space-y-6">
          {/* Efficiency Card (Solid Blue) */}
          <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/60 mb-6">Eficiencia de Cadena</p>
            <div className="text-6xl font-black tracking-tighter mb-6">98.2%</div>
            <div className="h-2 w-full bg-white/20 rounded-full mb-8 relative">
              <div className="absolute inset-y-0 left-0 bg-white rounded-full w-[98.2%] shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
            <p className="text-[10px] font-bold text-blue-50/80 uppercase tracking-widest leading-relaxed">
              Desempeño superior al promedio mensual.<br />
              Sin cuellos de botella detectados.
            </p>
          </div>

          {/* Activity Section */}
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 pb-4 border-b border-zinc-50">
              Actividad Reciente
            </h3>
            <div className="space-y-5">
              <ActivityItem dot="bg-green-500" title="Sesión Iniciada" time="Ahora" />
              <ActivityItem dot="bg-blue-600" title="Stock Actualizado" time="Hace 15 min" />
              <ActivityItem dot="bg-zinc-200" title="Reporte Generado" time="Hace 1 hora" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function KPICard({ title, value, change, trend, icon, detail, variant = 'default' }: any) {
  return (
    <div className="bg-white border border-zinc-100 rounded-[2rem] p-7 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
          variant === 'alert' ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-500 group-hover:bg-blue-600 group-hover:text-white"
        )}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-tight",
          trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? '▲' : '▼'} {change}
        </div>
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-zinc-950 tracking-tighter">{value}</span>
        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">{detail}</span>
      </div>
    </div>
  );
}

function StockAlertItem({ title, msg }: { title: string, msg: string }) {
  return (
    <div className="group bg-zinc-50/50 hover:bg-white border border-zinc-100/50 hover:border-zinc-200 rounded-2xl p-6 transition-all flex items-start gap-4">
      <div className="w-2 h-2 mt-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
      <div className="flex-1">
        <h4 className="text-[10px] font-black text-zinc-950 uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{msg}</p>
      </div>
      <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-1">AHORA</span>
    </div>
  );
}

function ActivityItem({ dot, title, time }: { dot: string, title: string, time: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", dot)} />
        <p className="text-[11px] font-black text-zinc-700 uppercase tracking-tight">{title}</p>
      </div>
      <span className="text-[9px] font-bold text-zinc-400 uppercase">{time}</span>
    </div>
  );
}
