'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { supabase } from '@/lib/supabase';

interface NavItem {
  name: string;
  icon: string;
  href: string;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'DASHBOARD', icon: 'dashboard', href: '/erp/dashboard' },
  {
    name: 'ALMACÉN', icon: 'inventory_2', href: '/erp/inventory',
    subItems: [
      { name: 'STOCK MATERIALES', icon: 'inventory_2', href: '/erp/inventory/materials' },
      { name: 'CONTROL EQUIPOS', icon: 'precision_manufacturing', href: '/erp/inventory/equipment' },
      { name: 'CATÁLOGO MATERIALES', icon: 'category', href: '/erp/inventory/catalog/materials' },
      { name: 'CATÁLOGO EQUIPOS', icon: 'grid_view', href: '/erp/inventory/catalog/equipment' },
      { name: 'CATÁLOGO ALMACENES', icon: 'home_work', href: '/erp/inventory/catalog/warehouses' },
      { name: 'DOCUMENTACIÓN', icon: 'description', href: '/erp/inventory/documentation' },
    ]
  },
  { name: 'LOGÍSTICA', icon: 'local_shipping', href: '/erp/logistics' },
  { name: 'SSOMA', icon: 'health_and_safety', href: '/erp/safety' },
  { name: 'CALIDAD', icon: 'high_quality', href: '/erp/quality' },
  {
    name: 'ADMINISTRACIÓN', icon: 'admin_panel_settings', href: '/erp/administration',
    subItems: [
      { name: 'GESTIÓN HUMANA', icon: 'groups', href: '/erp/administration/human-resources' },
    ]
  },
];

const footerItems = [
  { name: 'AJUSTES', icon: 'settings', href: '/erp/settings' },
  { name: 'SALIR', icon: 'logout', href: '/logout' },
];

export function ERPSidebar({ className, isMobile = false }: { className?: string; isMobile?: boolean }) {
  const pathname = usePathname();
  const { collapsed, closeMobile } = useSidebar();
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>('ALMACÉN');

  const sidebarCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-[#fcfcfc] border-r border-zinc-100 z-50 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      {/* ── User Profile Header ─────────────────────────── */}
      <div className="p-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="h-12 w-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-zinc-100">
               <img src="https://ui-avatars.com/api/?name=Carlo+Peña&background=0D0D0D&color=fff" alt="User" />
            </div>
            <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#fcfcfc]" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h2 className="text-[11px] font-black text-zinc-950 leading-none uppercase tracking-tighter">C. Peña Aponte</h2>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">Almacén</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
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
                  if (isMobile && !hasSubItems) closeMobile();
                }}
                className={cn(
                  "flex items-center transition-all duration-200 group rounded-xl mb-1 px-5 py-4",
                  isActive && !hasSubItems
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                    : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/50"
                )}
              >
                <span className={cn(
                  "material-symbols-outlined flex-shrink-0",
                  sidebarCollapsed ? "text-[24px]" : "text-[20px]",
                  isActive && !hasSubItems ? "text-white" : "text-zinc-400 group-hover:text-blue-600 transition-colors"
                )}>
                  {item.icon}
                </span>

                {!sidebarCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] flex-1 ml-4 leading-none">
                    {item.name}
                  </span>
                )}
                
                {!sidebarCollapsed && hasSubItems && (
                  <span className={cn(
                    "material-symbols-outlined text-[18px] transition-transform opacity-30",
                    isExpanded && "rotate-180"
                  )}>
                    expand_more
                  </span>
                )}
              </Link>

              {!sidebarCollapsed && hasSubItems && isExpanded && (
                <div className="mb-2 ml-7 border-l-2 border-blue-600/20 space-y-0.5">
                  {item.subItems!.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-4 pl-8 pr-4 py-3.5 rounded-r-xl transition-all duration-200 text-[10px] font-black uppercase tracking-[0.2em] relative group",
                          isSubActive
                            ? "text-white bg-blue-600 shadow-lg shadow-blue-100"
                            : "text-zinc-400 hover:text-blue-600 hover:bg-blue-50/50"
                        )}
                      >
                        {isSubActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-full" />}
                        <span className={cn(
                          "material-symbols-outlined text-[18px]",
                          isSubActive ? "text-white" : "text-zinc-400 group-hover:text-blue-600"
                        )}>
                          {sub.icon}
                        </span>
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="p-6 mt-auto border-t border-zinc-100 space-y-1">
        {footerItems.map((item) => {
          const isLogout = item.name === 'SALIR';
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
                "flex items-center rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100",
                sidebarCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-5 px-6 py-4"
              )}
            >
              <span className="material-symbols-outlined text-[20px] text-zinc-400">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">{item.name}</span>
              )}
            </Link>
          );
        })}
        
        {!sidebarCollapsed && (
          <div className="pt-8 pb-2 text-center">
            <span className="text-[9px] font-black text-zinc-200 uppercase tracking-[0.4em]">
              Control Project v2.4
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
