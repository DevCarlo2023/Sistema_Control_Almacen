'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ERPDashboardPage() {
  const dateStr = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-xl h-64 flex items-end p-10 bg-zinc-900 group shadow-2xl">
        <img 
          alt="Industrial Hub" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwNFzfpGR3UOKX58quyoflmgqIhjOPDFM2X5nKaQ5WtFshZ1eJ2wlMIwdqgsUxnCEGHX0EVshQEcM0G0OsmdL_HTSAwValhnrn6sHpQE9MikH51a3gWBUBFnjZvGY01VHd9QelI2sv0Jg48UxXk2g8JNz7Z-63oQ2SQ8SU92ZqbA7ePYcVlCEQwavvvy9b9CoEWDglT7npg_OL0k0M0saYCvMbrqpbj6OreFhMsl5KfK2cPaODqHY0xQKBUq-YqyP5ociUWUgi5eM" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1 rounded text-primary-fixed-dim text-[10px] font-bold tracking-[0.2em] border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            SYSTEM STATUS: OPTIMAL
          </div>
          <h1 className="font-headline text-6xl font-black text-white tracking-tighter uppercase leading-none">
            HUB INDUSTRIAL
          </h1>
          <p className="font-sans text-zinc-300 tracking-[0.2em] text-[10px] uppercase font-bold">
            Cycle Date: {dateStr} — Shift B-04 Active
          </p>
        </div>
      </section>

      {/* LAYOUT GRID: MAIN + SIDEBAR */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* PRIMARY CONTENT AREA */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          
          {/* KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col justify-between h-40 border border-outline-variant/10">
              <div>
                <div className="text-[10px] font-bold text-outline-variant tracking-[0.15em] uppercase mb-1">VALOR DE INVENTARIO</div>
                <div className="font-headline text-3xl font-bold text-on-surface">$2.4M</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">+12.5%</span>
                <div className="flex items-end gap-1 h-8">
                  <div className="w-1 bg-primary/10 h-3"></div>
                  <div className="w-1 bg-primary/20 h-5"></div>
                  <div className="w-1 bg-primary/30 h-4"></div>
                  <div className="w-1 bg-primary/50 h-6"></div>
                  <div className="w-1 bg-primary h-8"></div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col justify-between h-40 border border-outline-variant/10">
              <div>
                <div className="text-[10px] font-bold text-outline-variant tracking-[0.15em] uppercase mb-1">ÓRDENES ACTIVAS</div>
                <div className="font-headline text-3xl font-bold text-on-surface">128</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                <span className="text-xs font-medium text-outline">+5 vs yesterday</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col justify-between h-40 border border-outline-variant/10">
              <div>
                <div className="text-[10px] font-bold text-outline-variant tracking-[0.15em] uppercase mb-1">EQUIPOS EN RIESGO</div>
                <div className="font-headline text-3xl font-bold text-tertiary">3</div>
              </div>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="w-2 h-2 rounded-full bg-surface-container-high"></span>
                <span className="w-2 h-2 rounded-full bg-surface-container-high"></span>
                <span className="text-[10px] font-bold text-outline uppercase ml-2 tracking-widest">CRITICAL STATUS</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col justify-between h-40 border border-outline-variant/10">
              <div>
                <div className="text-[10px] font-bold text-outline-variant tracking-[0.15em] uppercase mb-1">EFICIENCIA GLOBAL</div>
                <div className="font-headline text-3xl font-bold text-on-surface">94%</div>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[94%] transition-all duration-1000"></div>
              </div>
              <div className="text-[10px] font-bold text-primary tracking-widest uppercase">+1.2% PERFORMANCE GAIN</div>
            </div>
          </div>

          {/* MODULAR OPERATIVE SECTION (Bento Style) */}
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <h2 className="font-headline text-3xl font-black tracking-tighter uppercase text-on-surface">MÓDULOS OPERATIVOS</h2>
              <div className="h-[1px] flex-1 mx-6 bg-outline-variant/20 mb-2"></div>
              <button className="text-xs font-bold text-primary tracking-widest uppercase hover:underline">View All Clusters</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card: Inventario */}
              <Link href="/erp/inventory" className="bg-surface-container-lowest p-1 rounded-sm group cursor-pointer hover:shadow-2xl transition-all border border-outline-variant/10 hover:border-primary/20">
                <div className="bg-surface-container-low p-8 h-full rounded-sm">
                  <div className="flex justify-between items-start mb-12">
                    <div className="p-4 bg-surface-container-lowest rounded shadow-sm">
                      <span className="material-symbols-outlined text-primary text-3xl">inventory</span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">north_east</span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold mb-2">INVENTARIO DE MATERIALES</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-on-surface">1,245</span>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">items catalogados</span>
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold tracking-widest">
                      <span className="text-outline">OPTIMIZATION</span>
                      <span className="text-on-surface">88%</span>
                    </div>
                    <div className="h-1 bg-surface-container-high w-full rounded-full">
                      <div className="h-full bg-on-surface w-[88%]"></div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card: Flota */}
              <Link href="/erp/inventory/equipment" className="bg-surface-container-lowest p-1 rounded-sm group cursor-pointer hover:shadow-2xl transition-all border border-outline-variant/10">
                <div className="brutalist-gradient p-8 h-full text-on-primary rounded-sm shadow-xl">
                  <div className="flex justify-between items-start mb-12">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded border border-white/10">
                      <span className="material-symbols-outlined text-white text-3xl">conveyor_belt</span>
                    </div>
                    <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">north_east</span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold mb-2">FLOTA Y EQUIPOS</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">82%</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">OEE Global</span>
                  </div>
                  <div className="mt-8 p-4 bg-white/10 backdrop-blur rounded flex items-center gap-4 border border-white/5">
                    <span className="material-symbols-outlined text-white/60">hub</span>
                    <div className="text-[10px] font-bold tracking-widest leading-tight">
                        SYSTEM NODE: HUB-NORTH-01<br/>
                      <span className="text-white/60">LAST SCAN: 2M AGO</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR: ALERTS */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container-lowest h-full p-8 rounded shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-tertiary">bolt</span>
              <h2 className="font-headline text-lg font-black tracking-tighter uppercase text-on-surface">ALERTAS RECIENTES</h2>
            </div>

            <div className="space-y-6">
              {/* Alert 1 */}
              <div className="p-4 bg-error-container/10 rounded border-l-4 border-error">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-error uppercase tracking-widest">STOCK CRÍTICO</span>
                  <span className="text-[10px] text-outline">14:20</span>
                </div>
                <p className="text-xs font-bold text-on-surface mb-3 uppercase tracking-tight">ALEACIÓN T-800 - <span className="text-error">Bajo Mínimo</span></p>
                <button className="w-full py-2 bg-surface-container-lowest border border-error/20 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error hover:text-white transition-all">
                  REORDENAR AHORA
                </button>
              </div>

              {/* Alert 2 */}
              <div className="p-4 bg-secondary-container/10 rounded border-l-4 border-secondary">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest">MANTENIMIENTO</span>
                  <span className="text-[10px] text-outline">10:05</span>
                </div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Unidad Hidráulica PX-9</p>
                <p className="text-[10px] text-outline mt-1 font-bold uppercase tracking-widest">Próxima revisión: 48h hábiles</p>
              </div>

              {/* Alert 3 */}
              <div className="p-4 bg-surface-container-low rounded border border-outline-variant/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">NOTIFICACIÓN</span>
                  <span className="text-[10px] text-outline">Ayer</span>
                </div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-tight">Cierre de Auditoría Q3</p>
                <p className="text-[10px] text-outline mt-1 font-bold uppercase tracking-widest">Reporte de cumplimiento generado.</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-outline-variant/10">
              <div className="bg-zinc-900 rounded p-6 text-white overflow-hidden relative shadow-xl">
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-widest mb-4">SOPORTE TÉCNICO</div>
                  <p className="text-sm font-bold leading-tight mb-6">¿Necesitas asistencia en la línea de producción?</p>
                  <button className="bg-white text-zinc-950 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm hover:scale-105 transition-transform active:scale-95">
                    HABLAR CON IA
                  </button>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12 pointer-events-none select-none">support_agent</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-16 h-16 brutalist-gradient text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
        <div className="absolute right-20 bg-zinc-950 text-white px-4 py-2 rounded text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
          NEW PRODUCTION RUN
        </div>
      </button>

      {/* FOOTER INFO */}
      <footer className="pt-12 border-t border-outline-variant/20 flex justify-between items-center text-outline font-headline">
        <div className="text-[10px] font-bold tracking-widest uppercase">ARCHITECT ERP © 2026 — v4.8.2 (STABLE)</div>
        <div className="flex gap-8 text-[10px] font-bold tracking-widest uppercase">
          <Link className="hover:text-primary transition-colors" href="#">PRIVACY POLICY</Link>
          <Link className="hover:text-primary transition-colors" href="#">SYSTEM ARCHITECTURE</Link>
          <Link className="hover:text-primary transition-colors" href="#">SECURITY AUDIT</Link>
        </div>
      </footer>
    </div>
  );
}
