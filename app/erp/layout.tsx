import { ERPSidebar } from '@/components/erp/sidebar';
import { ERPTopBar } from '@/components/erp/top-bar';
import { SidebarProvider } from '@/components/erp/sidebar-context';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans relative">
        {/* Patrón de puntos industrial */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

        {/* Drawer sidebar — posición fixed, fuera del flujo */}
        <ERPSidebar />

        {/* Contenido principal — ocupa TODO el ancho */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 w-full">
          <ERPTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
