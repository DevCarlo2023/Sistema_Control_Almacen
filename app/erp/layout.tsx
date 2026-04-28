'use client';

import { ERPSidebar } from '@/components/erp/sidebar';
import { SidebarProvider, useSidebar } from '@/components/erp/sidebar-context';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function ERPContent({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className="flex bg-zinc-50 min-h-screen">
      <ERPSidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ── Top Header ─────────────────────────────────── */}
        <header className="h-14 border-b border-zinc-200 bg-white flex items-center z-40 sticky top-0 flex-shrink-0 shadow-sm">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-100">
            <div className="h-full bg-primary w-[94.8%]" />
          </div>

          <div className="flex items-center justify-between w-full px-4 md:px-6">
            <div className="flex items-center gap-3">


              {/* Mobile menu */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="w-8 h-8 flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 transition-all">
                      <Menu className="w-4 h-4" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 border-none bg-white w-64">
                    <ERPSidebar className="flex w-full border-none" />
                  </SheetContent>
                </Sheet>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-zinc-200 hidden lg:block" />

              {/* Logo */}
              <Link href="/erp/dashboard" className="flex items-center gap-3.5 group ml-1">
                <div className="w-10 h-10 flex items-center justify-center bg-zinc-950 rounded md:rounded-lg group-hover:bg-primary transition-all duration-300 shadow-sm">
                  <svg viewBox="0 0 40 40" className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" strokeWidth="4">
                    <path d="M5 35 L20 5 L35 35" strokeLinecap="square" />
                    <circle cx="20" cy="5" r="3" fill="currentColor" />
                  </svg>
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="text-[17px] font-black text-zinc-950 tracking-[-0.02em] uppercase">
                    CONTROL <span className="text-primary">PROJECT</span>
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Infraestructura Minera</span>
                </div>
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <button className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-all">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-all">
                <span className="material-symbols-outlined text-[18px]">notifications</span>
              </button>

              <div className="w-px h-5 bg-zinc-200" />

              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-[10px] font-black text-zinc-800 uppercase tracking-tight">Carlos Rodríguez</span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-wide">Infraestructura &amp; Obra</span>
              </div>
              <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden shadow-sm flex-shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLDIOI2MZUpZFwy7npGyjSQ2lltJOmQ0tMrct7nObYW3KGchoMGg71UffOACu69nKl2NC6QYJvkmUgUVByWNDHGypvJiBwSVGoxMvBgrOv1OHNTjDpqE8aDjwpFSMMnCPqQalu-eIFHZIfwqhSAwcso8B40R00FUl4QnrvMSFQtxdhfMquYZa8hkBwBXSKrzSgMzs4ZONX-OJ02Uz4gXv1beE1S9ujUPUHcUOwcyS2sMG_LI2bMykpWWxcPXU3dicP5_95l6FvM"
                  alt="Carlos Rodríguez"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Content Area ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Dot grid background */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative z-10 max-w-[1700px] mx-auto px-4 sm:px-6 py-6 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ERPContent>{children}</ERPContent>
    </SidebarProvider>
  );
}
