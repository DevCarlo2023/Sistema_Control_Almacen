'use client';

import { ERPSidebar } from '@/components/erp/sidebar';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface text-on-surface flex overflow-hidden font-sans">
      <ERPSidebar />
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        <header className="w-full sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 shadow-sm border-b border-outline/10 font-headline">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-black uppercase tracking-tighter text-primary">
              ARCHITECT ERP
            </div>
            <div className="relative w-96 hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline/50">search</span>
              <input 
                className="w-full bg-surface-container border-none rounded px-10 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder="Search Global Operations..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <button className="text-outline hover:bg-surface-container p-2 rounded-full transition-colors active:scale-95">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-outline hover:bg-surface-container p-2 rounded-full transition-colors active:scale-95">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <div className="h-8 w-[1px] bg-outline/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-on-surface">Operator Profile</div>
                <div className="text-[10px] text-outline tracking-wider">SECURE NODE</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLDIOI2MZUpZFwy7npGyjSQ2lltJOmQ0tMrct7nObYW3KGchoMGg71UffOACu69nKl2NC6QYJvkmUgUVByWNDHGypvJiBwSVGoxMvBgrOv1OHNTjDpqE8aDjwpFSMMnCPqQalu-eIFHZIfwqhSAwcso8B40R00FUl4QnrvMSFQtxdhfMquYZa8hkBwBXSKrzSgMzs4ZONX-OJ02Uz4gXv1beE1S9ujUPUHcUOwcyS2sMG_LI2bMykpWWxcPXU3dicP5_95l6FvM"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1700px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
