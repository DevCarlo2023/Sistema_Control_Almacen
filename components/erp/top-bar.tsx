'use client';

import * as React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export function ERPTopBar() {
  const { toggle } = useSidebar();

  return (
    <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-8 z-40 sticky top-0">
      <div className="flex items-center gap-6">
        <button onClick={toggle} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
          <Menu className="w-6 h-6 text-zinc-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl italic tracking-tighter">A</span>
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
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors relative">
            <Bell className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </div>

        <div className="flex items-center gap-4 pl-8 border-l border-zinc-100">
          <div className="text-right hidden md:block">
            <p className="text-[11px] font-black text-zinc-950 uppercase">C. Peña Aponte</p>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Almacén</p>
          </div>
          <div className="h-11 w-11 rounded-full border-2 border-zinc-100 overflow-hidden bg-zinc-100 shadow-sm">
            <img src="https://ui-avatars.com/api/?name=Carlo+Peña&background=0D0D0D&color=fff" alt="User" />
          </div>
        </div>
      </div>
    </header>
  );
}
