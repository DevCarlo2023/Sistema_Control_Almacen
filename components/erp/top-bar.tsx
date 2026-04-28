'use client';

import * as React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useSidebar } from './sidebar-context';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function ERPTopBar() {
  const { toggleMobile } = useSidebar();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fullName = user?.user_metadata?.full_name || 'C. Peña Aponte';
  const role = user?.user_metadata?.role || 'Almacén';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${fullName}&background=0D0D0D&color=fff`;

  return (
    <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-8 md:px-12 shrink-0 z-40">
      {/* Left: Mobile Toggle & Branding */}
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleMobile}
          className="md:hidden p-2 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-zinc-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-zinc-200">A</div>
          <div className="hidden sm:block">
            <h1 className="text-[13px] font-black text-zinc-950 leading-none uppercase tracking-tighter">Control Project</h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">Gestión de Activos 2024</p>
          </div>
        </div>
      </div>

      {/* Center: Search (Optional/Hidden on mobile) */}
      <div className="hidden lg:flex items-center bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 w-96 group focus-within:border-blue-600 focus-within:bg-white transition-all">
        <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-blue-600" />
        <input 
          type="text" 
          placeholder="Buscar módulos o reportes..." 
          className="bg-transparent border-none outline-none text-xs font-bold ml-3 w-full text-zinc-600 placeholder:text-zinc-300"
        />
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-6 md:gap-8">
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all relative group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="h-8 w-px bg-zinc-100 hidden md:block" />

        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <h3 className="text-[11px] font-black text-zinc-950 leading-none uppercase tracking-tighter truncate max-w-[120px]">{fullName}</h3>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">{role}</p>
          </div>
          <div className="h-11 w-11 rounded-xl border-2 border-zinc-50 overflow-hidden bg-zinc-100 shadow-sm group-hover:shadow-md transition-all">
             <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}
