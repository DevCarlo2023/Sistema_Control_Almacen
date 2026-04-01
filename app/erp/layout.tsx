'use client';

import { ERPSidebar } from '@/components/erp/sidebar';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white flex overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[160px] animate-pulse" />
      </div>
      <ERPSidebar />
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex items-center px-8 justify-between">
          <h2 className="text-sm font-semibold text-gray-400 tracking-widest uppercase">PLANT OVERVIEW | <span className="text-white">PROMET - V2</span></h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-mono text-gray-400">System Operational</span></div>
            <div className="flex items-center gap-6">
              <div className="text-right"><p className="text-xs font-bold text-white">Alex Carter</p></div>
              <div className="w-8 h-8 rounded-full bg-blue-500" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
