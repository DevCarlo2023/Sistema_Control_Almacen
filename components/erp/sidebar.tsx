'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

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

export function ERPSidebar() {
  const pathname = usePathname();
  const { open, closeMobile } = useSidebar();
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>('ALMACÉN');
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fullName = user?.user_metadata?.full_name || 'C. Peña Aponte';
  const role = user?.user_metadata?.role || 'Almacén';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${fullName}&background=0D0D0D&color=fff`;

  return (
    <>
      {/* ── Overlay ───────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
      />

      {/* ── Drawer ────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[285px] flex flex-col bg-[#fcfcfc] border-r border-zinc-100 z-50",
          "transition-transform duration-300 ease-in-out shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Header with close button ─────────────────── */}
        <div className="p-6 pb-6 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-xl border-2 border-white shadow-lg overflow-hidden bg-zinc-100">
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#fcfcfc] shadow-sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[12px] font-black text-zinc-950 leading-none uppercase tracking-tighter truncate max-w-[140px]">{fullName}</h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2">{role}</p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────────── */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.name;

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (hasSubItems) {
                      e.preventDefault();
                      setExpandedMenu(isExpanded ? null : item.name);
                    } else {
                      closeMobile();
                    }
                  }}
                  className={cn(
                    "flex items-center transition-all duration-200 group rounded-xl px-5 py-4",
                    isActive && !hasSubItems
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                      : isExpanded
                        ? "bg-blue-50/50 text-blue-600"
                        : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/50"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined flex-shrink-0 text-[24px]",
                    isActive && !hasSubItems ? "text-white" : "text-zinc-400 group-hover:text-blue-600 transition-colors"
                  )}>
                    {item.icon}
                  </span>

                  <span className="text-[11px] font-black uppercase tracking-[0.2em] flex-1 ml-5 leading-none">
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
                </Link>

                {hasSubItems && isExpanded && (
                  <div className="mb-2 ml-7 border-l-2 border-blue-600/10 space-y-1 pt-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center gap-4 pl-8 pr-4 py-4 rounded-r-xl transition-all duration-200 text-[10px] font-black uppercase tracking-[0.2em] relative group",
                            isSubActive
                              ? "text-white bg-blue-600 shadow-lg shadow-blue-100"
                              : "text-zinc-400 hover:text-blue-600 hover:bg-blue-50/50"
                          )}
                        >
                          {isSubActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-800 rounded-full" />}
                          <span className={cn(
                            "material-symbols-outlined text-[20px]",
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
        <div className="p-6 border-t border-zinc-100 space-y-1.5 mt-auto">
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
                  } else {
                    closeMobile();
                  }
                }}
                className="flex items-center gap-5 px-6 py-4 rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
              >
                <span className="material-symbols-outlined text-[22px] text-zinc-400">{item.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 pb-2 text-center">
            <span className="text-[9px] font-black text-zinc-200 uppercase tracking-[0.4em]">
              Control Project v2.4
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
