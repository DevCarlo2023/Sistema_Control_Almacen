'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Inventory', icon: 'inventory_2', href: '/erp/inventory' },
  { name: 'Production', icon: 'precision_manufacturing', href: '/erp/production' },
  { name: 'Logistics', icon: 'local_shipping', href: '/erp/logistics' },
  { name: 'Analytics', icon: 'monitoring', href: '/erp/analytics' },
  { name: 'Personnel', icon: 'badge', href: '/erp/personnel' },
  { name: 'Compliance', icon: 'verified_user', href: '/erp/compliance' },
];

const footerItems = [
  { name: 'Help Center', icon: 'help', href: '/erp/help' },
  { name: 'System Logs', icon: 'terminal', href: '/erp/logs' },
];

export function ERPSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col bg-surface-container-lowest dark:bg-zinc-950 border-r border-outline-variant/30 font-headline transition-all duration-300 z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="px-8 py-8 flex items-center gap-2">
        <span className="text-primary font-black text-2xl tracking-tighter truncate">
          {isCollapsed ? 'A' : 'ARCHITECT'}
        </span>
      </div>

      {!isCollapsed && (
        <div className="px-6 mb-8 mt-2 animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="flex items-center gap-3 mb-1 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-outline leading-none uppercase font-bold tracking-widest">UNIT 01</div>
              <div className="text-xs text-on-surface truncate">Active Session</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all group relative overflow-hidden",
                isActive 
                  ? "brutalist-gradient text-white shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container transition-all"
              )}
            >
              <span className={cn(
                "material-symbols-outlined transition-transform duration-300",
                !isActive && "group-hover:translate-x-1"
              )}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-xs font-bold uppercase tracking-widest truncate">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="px-4 py-6">
          <button className="w-full brutalist-gradient text-white py-3 rounded text-xs tracking-[0.2em] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform uppercase">
            NEW PRODUCTION RUN
          </button>
        </div>
      )}

      <div className="mt-auto border-t border-outline-variant/10 pt-4 pb-6 px-3 space-y-1">
        {footerItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 text-outline hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
            )}
          </Link>
        ))}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-4 py-2 text-outline hover:text-primary transition-colors group border-t border-outline-variant/10 mt-2 pt-4"
        >
          <span className="material-symbols-outlined text-lg">
            {isCollapsed ? 'side_navigation' : 'keyboard_double_arrow_left'}
          </span>
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-widest">Collapse View</span>
          )}
        </button>
      </div>
    </aside>
  );
}
