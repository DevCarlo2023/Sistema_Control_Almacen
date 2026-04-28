import { ERPSidebar } from '@/components/erp/sidebar';
import { SidebarProvider } from '@/components/erp/sidebar-context';

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <ERPSidebar />
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
