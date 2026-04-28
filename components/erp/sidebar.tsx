'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavItem {
  name: string;
  icon: string;
  href: string;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: 'dashboard', href: '/erp/dashboard' },
  {
    name: 'Almacén', icon: 'inventory_2', href: '/erp/inventory',
    subItems: [
      { name: 'Stock Materiales', icon: 'inventory_2', href: '/erp/inventory/materials' },
      { name: 'Control Equipos', icon: 'precision_manufacturing', href: '/erp/inventory/equipment' },
      { name: 'Catálogo Materiales', icon: 'category', href: '/erp/inventory/catalog/materials' },
      { name: 'Catálogo Equipos', icon: 'grid_view', href: '/erp/inventory/catalog/equipment' },
      { name: 'Catálogo Almacenes', icon: 'home_work', href: '/erp/inventory/catalog/warehouses' },
      { name: 'Documentación', icon: 'description', href: '/erp/inventory/documentation' },
    ]
  },
  { name: 'Logística', icon: 'local_shipping', href: '/erp/logistics' },
  { name: 'SSOMA', icon: 'health_and_safety', href: '/erp/safety' },
  { name: 'Calidad', icon: 'high_quality', href: '/erp/quality' },
  {
    name: 'Administración', icon: 'admin_panel_settings', href: '/erp/administration',
    subItems: [
      { name: 'Gestión Humana', icon: 'groups', href: '/erp/administration/human-resources' },
    ]
  },
];

const footerItems = [
  { name: 'Ajustes', icon: 'settings', href: '/erp/settings' },
  { name: 'Salir', icon: 'logout', href: '/logout' },
];

export function ERPSidebar({ className, isMobile = false }: { className?: string; isMobile?: boolean }) {
  const pathname = usePathname();
  const { collapsed, toggle, closeMobile } = useSidebar();
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>('Almacén');

  const sidebarCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-white border-r border-zinc-100 z-50 relative transition-all duration-300 ease-in-out flex-shrink-0",
        sidebarCollapsed ? "w-[70px]" : "w-[260px]",
        className
      )}
    >
      {/* ── Brand Header ───────────────────────────── */}
      <div className="p-6 border-b border-zinc-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-zinc-100 overflow-hidden shadow-sm flex-shrink-0">
             <img src="https://ui-avatars.com/api/?name=Carlo+Peña&background=0D0D0D&color=fff" alt="User" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h2 className="text-[10px] font-black text-zinc-950 leading-none uppercase tracking-tighter">C. Peña Aponte</h2>
              <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1">Almacén</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.name;

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (hasSubItems && !sidebarCollapsed) {
                      e.preventDefault();
                      setExpandedMenu(isExpanded ? null : item.name);
                    }
                    if (isMobile && !hasSubItems) {
                      closeMobile();
                    }
                  }}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group relative",
                    sidebarCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-4 px-4 py-3.5",
                    isActive && !hasSubItems
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined flex-shrink-0 transition-transform duration-200",
                    sidebarCollapsed ? "text-[24px]" : "text-[20px]",
                  )}>
                    {item.icon}
                  </span>

                  {!sidebarCollapsed && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 leading-none">
                        {item.name}
                      </span>
                      {hasSubItems && (
                        <span className={cn(
                          "material-symbols-outlined text-[18px] transition-transform opacity-30",
                          isExpanded && "rotate-180"
                        )}>
                          expand_more
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {!sidebarCollapsed && hasSubItems && isExpanded && (
                  <div className="mt-1 space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 ml-4 pl-10 pr-4 py-3 rounded-xl transition-all duration-200 text-[9px] font-black uppercase tracking-[0.2em]",
                            isSubActive
                              ? "text-zinc-950 bg-zinc-50"
                              : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50/50"
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="p-4 border-t border-zinc-50 space-y-1">
        {footerItems.map((item) => {
          const isLogout = item.name === 'Salir';
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={async (e) => {
                if (isLogout) {
                  e.preventDefault();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }
              }}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50",
                sidebarCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-4 px-4 py-3"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">{item.name}</span>
              )}
            </Link>
          );
        })}
        
        {!sidebarCollapsed && (
          <div className="pt-6 pb-2 text-center">
            <span className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.4em]">
              Control Project v2.4
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
