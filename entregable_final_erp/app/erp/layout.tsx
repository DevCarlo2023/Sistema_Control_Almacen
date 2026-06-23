import { ERPSidebar } from '@/components/erp/sidebar';
import { ERPTopBar } from '@/components/erp/top-bar';
import { SidebarProvider } from '@/components/erp/sidebar-context';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* 
        Patrón de puntos industrial: 
        bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] 
      */}
      <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
        
        <ERPSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <ERPTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 md:p-12 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
