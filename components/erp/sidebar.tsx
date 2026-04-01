'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShieldCheck, 
  Truck, 
  Settings, 
  Users, 
  Factory,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AppWindow
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Inventario', icon: Package, href: '/inventory' },
  { name: 'Equipos', icon: Wrench, href: '/equipment' },
  { name: 'Producción', icon: Factory, href: '/production' },
  { name: 'Logística', icon: Truck, href: '/logistics' },
  { name: 'Seguridad', icon: ShieldCheck, href: '/safety' },
  { name: 'Usuarios', icon: Users, href: '/admin/users' },
  { name: 'Ajustes', icon: Settings, href: '/settings' },
];

export function ERPSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside 
      className={cn(
        "relative flex flex-col glass border-r h-screen transition-all duration-500 ease-in-out z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <AppWindow className="text-white w-6 h-6" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            INDUSTRIAL ERP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive 
                  ? "bg-white/10 text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.1)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                isActive && "text-blue-400"
              )} />
              {!isCollapsed && (
                <span className="font-medium text-sm tracking-wide">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="p-4 mt-auto border-t border-white/5">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl gap-3"
          onClick={() => {}}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border flex items-center justify-center text-white hover:bg-white/10 transition-colors z-50 shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
    </aside>
  );
}
