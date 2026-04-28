'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ERPDashboard() {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">

      {/* ── Cinematic Hero ────────────────────────────────── */}
      <section className="relative overflow-hidden rounded h-[180px] md:h-[360px] flex items-end p-6 md:p-12 bg-zinc-900 group shadow-2xl">
        <img
          alt="Infraestructura Minera"
          className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-1000"
          src="/images/mining_banner_final.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent" />
      </section>

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Stock Total"      value="12,482" change="+4.2%"  trend="up"   icon="inventory_2"    detail="UNID. REGISTRADAS" />
        <KPICard title="Flota Activa"     value="84"     change="92%"    trend="up"   icon="local_shipping" detail="OPERATIVIDAD" />
        <KPICard title="Alertas Críticas" value="03"     change="-2"     trend="down" icon="warning"        detail="PENDIENTES" variant="alert" />
        <KPICard title="Productividad"    value="98.4%"  change="+1.5%"  trend="up"   icon="equalizer"      detail="EFICIENCIA" />
      </div>

      {/* ── Bento Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded border border-zinc-200 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-7 bg-primary rounded-full" />
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-[0.15em]">Centro de Alertas</h3>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Monitoreo en tiempo real</p>
                </div>
              </div>
              <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">
                Ver Historial
              </button>
            </div>

            <div className="space-y-3">
              <AlertItem type="critical" title="REQUERIMIENTO DE REPUESTO CRÍTICO"  msg="Excavadora CAT-7495 requiere mantenimiento inmediato en orugas." time="Hace 12 min" />
              <AlertItem type="warning"  title="STOCK BAJO: LUBRICANTES"            msg="Nivel crítico detectado en Almacén Central (AC-04)."           time="Hace 45 min" />
              <AlertItem type="info"     title="ACTUALIZACIÓN DE PROTOCOLO SSOMA"   msg="Nuevos lineamientos de seguridad para el área de chancado."    time="Hace 2 horas" />
            </div>
          </div>

          {/* Quick Links Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickLink title="Logística de Obra"    desc="Materiales y suministros." icon="foundation"    href="/erp/inventory/materials" />
            <QuickLink title="Truck Shop & Talleres" desc="Avance de obra y montaje." icon="construction"  href="/erp/inventory/equipment" />
          </div>
        </div>

        {/* Right: Status */}
        <div className="space-y-6">
          {/* Efficiency Card */}
          <div className="bg-primary rounded p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 group-hover:translate-x-2 transition-transform duration-700 pointer-events-none">
              <span className="material-symbols-outlined text-[90px] md:text-[110px]">analytics</span>
            </div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-5">Eficiencia Global</h3>
            <div className="text-5xl font-black tracking-tighter mb-4">94.8%</div>
            <div className="h-1.5 w-full bg-white/20 rounded-full mb-5">
              <div className="h-full bg-white rounded-full w-[94.8%] shadow-sm" />
            </div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider leading-relaxed">
              Desempeño superior al promedio mensual.<br />
              Sin cuellos de botella detectados.
            </p>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded border border-zinc-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-5 pb-4 border-b border-zinc-100">
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-tight">Sistema Operativo</p>
                  <p className="text-[10px] text-zinc-400">Acceso registrado · Carlos Rodríguez</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-tight">Inventario Sincronizado</p>
                  <p className="text-[10px] text-zinc-400">Última actualización: hace 4 min</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-tight">3 Alertas Activas</p>
                  <p className="text-[10px] text-zinc-400">Requieren atención operativa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub Components ────────────────────────────────────────────────────────────

function KPICard({ title, value, change, trend, icon, detail, variant = 'default' }: any) {
  return (
    <div className="bg-white border border-zinc-200 rounded p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded flex items-center justify-center transition-all",
          variant === 'alert'
            ? "bg-red-50 text-red-600"
            : "bg-zinc-50 text-zinc-500 group-hover:bg-primary group-hover:text-white"
        )}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className={cn(
          "flex items-center gap-0.5 px-2 py-1 rounded text-[9px] font-black tracking-tight",
          trend === 'up' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          {trend === 'up' ? '▲' : '▼'} {change}
        </div>
      </div>
      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tighter">{value}</span>
        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-wider hidden sm:inline">{detail}</span>
      </div>
    </div>
  );
}

function AlertItem({ type, title, msg, time }: any) {
  const styles: any = {
    critical: { border: 'border-red-500', bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
    warning:  { border: 'border-amber-400', bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' },
    info:     { border: 'border-primary', bg: 'bg-blue-50', dot: 'bg-primary', text: 'text-primary' },
  };
  const s = styles[type];

  return (
    <div className={`${s.bg} border-l-4 ${s.border} rounded-r p-4 flex flex-col sm:flex-row justify-between items-start gap-2`}>
      <div className="flex items-start gap-3 flex-1">
        <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${s.dot} flex-shrink-0 animate-pulse`} />
        <div>
          <h4 className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${s.text}`}>{title}</h4>
          <p className="text-xs text-zinc-600 leading-relaxed">{msg}</p>
        </div>
      </div>
      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap flex-shrink-0">{time}</span>
    </div>
  );
}

function QuickLink({ title, desc, icon, href }: any) {
  return (
    <Link href={href} className="group bg-white border border-zinc-200 rounded p-5 hover:border-primary hover:shadow-md hover:bg-primary transition-all duration-300 flex items-center gap-4">
      <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 group-hover:border-white/20 transition-all duration-300">
        <span className="material-symbols-outlined text-xl text-primary group-hover:text-white transition-colors duration-300">{icon}</span>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.15em] group-hover:text-white transition-colors">{title}</h4>
        <p className="text-[9px] text-zinc-400 group-hover:text-white/70 transition-colors uppercase tracking-wider">{desc}</p>
      </div>
    </Link>
  );
}
