'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell, ChevronRight, LayoutDashboard, Package, Truck, ShieldCheck, Activity } from 'lucide-react';

export default function ERPDashboard() {
  return (
    <div className="space-y-6 pb-10 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* ── Top Navigation Bar ────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-3 transition-transform">
            <span className="text-white font-black text-xl italic tracking-tighter">A</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
              Control <span className="text-blue-600">Project</span>
            </h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">
              Gestión de Activos 2024
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors relative">
              <Bell className="w-5 h-5 stroke-[2.5]" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-zinc-100">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-zinc-900 uppercase">C. Peña Aponte</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Almacén</p>
            </div>
            <div className="h-10 w-10 rounded-full border border-zinc-200 overflow-hidden bg-zinc-100">
              <img src="https://ui-avatars.com/api/?name=Carlo+Peña&background=0D0D0D&color=fff" alt="User" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] h-[220px] md:h-[380px] shadow-sm border border-zinc-100 group">
        <img
          alt="Banner Industrial"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
            Lunes, 27 de Abril
          </span>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Stock Total"      value="9"    change="+ 1.2%" trend="up"   icon="inventory_2" detail="Unid. en Almacén" />
        <KPICard title="Flota Activa"     value="12"   change="89%"    trend="up"   icon="local_shipping" detail="Equipos Operativos" />
        <KPICard title="Alertas Rojas"    value="07"   change="URGENTE" trend="down" icon="warning" detail="Bajo Umbral" variant="alert" />
        <KPICard title="Sincronización"   value="100%" change="NUBE"    trend="up"   icon="sensors" detail="Estado Conexión" variant="sync" />
      </div>

      {/* ── Bottom Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Alerts Center */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <div>
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-[0.1em]">Control de Stock Crítico</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monitoreo de umbrales en tiempo real</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              Gestionar Inventario <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <AlertItem title='REQUERIMIENTO: ABRAZADERA AJUSTABLE 6" INOX' />
            <AlertItem title='REQUERIMIENTO: ABRAZADERA CADDY GLV 3"' />
            <AlertItem title='REQUERIMIENTO: ABRAZADERA CADDY GLV 3/4"' />
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-8">
          {/* Blue Efficiency Card */}
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/60 mb-8">Eficiencia de Cadena</p>
              <div className="text-7xl font-black tracking-tighter mb-8 leading-none">98.2%</div>
              <div className="h-2 w-full bg-white/20 rounded-full mb-10 overflow-hidden">
                <div className="h-full bg-white rounded-full w-[98.2%] shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              </div>
              <p className="text-[11px] font-bold text-blue-50/80 uppercase tracking-widest leading-relaxed">
                Desempeño superior al promedio mensual.<br />
                Sin cuellos de botella detectados.
              </p>
            </div>
          </div>

          {/* Activity List */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-sm">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 pb-5 border-b border-zinc-50">
              Actividad Reciente
            </h3>
            <div className="space-y-6">
              <ActivityRow dot="bg-green-500" title="Sesión Iniciada" time="Ahora" />
              <ActivityRow dot="bg-blue-600" title="Stock Actualizado" time="Hace 15 min" />
              <ActivityRow dot="bg-zinc-200" title="Reporte Generado" time="Hace 1 hora" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, icon, detail, variant = 'default' }: any) {
  return (
    <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
          variant === 'alert' ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white"
        )}>
          <span className="material-symbols-outlined text-3xl leading-none">{icon}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight",
          trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? '▲' : '▼'} {change}
        </div>
      </div>
      <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 leading-none">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-zinc-950 tracking-tighter leading-none">{value}</span>
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{detail}</span>
      </div>
    </div>
  );
}

function AlertItem({ title }: { title: string }) {
  return (
    <div className="group bg-zinc-50/40 hover:bg-white border border-zinc-50 hover:border-zinc-200 rounded-2xl p-6 transition-all flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
        <div>
          <h4 className="text-[11px] font-black text-zinc-950 uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Stock actual por debajo del umbral mínimo</p>
        </div>
      </div>
      <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">AHORA</span>
    </div>
  );
}

function ActivityRow({ dot, title, time }: { dot: string, title: string, time: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-2 h-2 rounded-full", dot)} />
        <p className="text-[11px] font-black text-zinc-700 uppercase tracking-tight leading-none">{title}</p>
      </div>
      <span className="text-[9px] font-bold text-zinc-400 uppercase leading-none">{time}</span>
    </div>
  );
}
