import { ERPSidebar } from '@/components/erp/sidebar';
import { ERPTopBar } from '@/components/erp/top-bar';
import { SidebarProvider } from '@/components/erp/sidebar-context';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans">
        <ERPSidebar />
        <div className="flex-1 flex flex-col min-w-0">
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
