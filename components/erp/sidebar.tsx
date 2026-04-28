'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
      { name: 'Materiales', icon: 'package_2', href: '/erp/inventory/materials' },
      { name: 'Equipos', icon: 'precision_manufacturing', href: '/erp/inventory/equipment' },
    ]
  },
  { name: 'Logística', icon: 'local_shipping', href: '/erp/logistics' },
  { name: 'SSOMA', icon: 'health_and_safety', href: '/erp/safety' },
  { name: 'Calidad', icon: 'high_quality', href: '/erp/quality' },
  { name: 'Administración', icon: 'admin_panel_settings', href: '/erp/admin' },
];

const footerItems = [
  { name: 'Ajustes', icon: 'settings', href: '/erp/settings' },
  { name: 'Salir', icon: 'logout', href: '/logout' },
];

export function ERPSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const [expandedMenu, setExpandedMenu] = React.useState<string | null>('Almacén');

  React.useEffect(() => {
    const activeItem = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'));
    if (activeItem && activeItem.subItems) {
      setExpandedMenu(activeItem.name);
    }
  }, [pathname]);

  return (
    <aside
      className={cn(
        "h-screen hidden lg:flex flex-col bg-white border-r border-zinc-200 z-50 relative shadow-sm transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-[64px]" : "w-64",
        className
      )}
    >
      {/* ── Toggle Edge Button ───────────────────────── */}
      <button
        onClick={toggle}
        className="absolute top-1/2 -right-4 -translate-y-1/2 w-4 h-16 bg-white border-y border-r border-zinc-200 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all z-[60] shadow-sm hover:w-5 cursor-pointer group"
        title={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        <div className="w-0.5 h-6 bg-zinc-200 rounded-full group-hover:bg-zinc-300 transition-colors mr-0.5" />
      </button>

      {/* ── Profile Section ───────────────────────────── */}
      <div className={cn(
        "border-b border-zinc-100 relative z-10 transition-all duration-300",
        collapsed ? "p-3" : "p-5"
      )}>
        {collapsed ? (
          /* Collapsed: just the avatar */
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded border border-zinc-200 overflow-hidden shadow-sm">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLDIOI2MZUpZFwy7npGyjSQ2lltJOmQ0tMrct7nObYW3KGchoMGg71UffOACu69nKl2NC6QYJvkmUgUVByWNDHGypvJiBwSVGoxMvBgrOv1OHNTjDpqE8aDjwpFSMMnCPqQalu-eIFHZIfwqhSAwcso8B40R00FUl4QnrvMSFQtxdhfMquYZa8hkBwBXSKrzSgMzs4ZONX-OJ02Uz4gXv1beE1S9ujUPUHcUOwcyS2sMG_LI2bMykpWWxcPXU3dicP5_95l6FvM"
                alt="Carlos Rodríguez"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          /* Expanded: avatar + name */
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded border border-primary/20 overflow-hidden shadow-sm">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLDIOI2MZUpZFwy7npGyjSQ2lltJOmQ0tMrct7nObYW3KGchoMGg71UffOACu69nKl2NC6QYJvkmUgUVByWNDHGypvJiBwSVGoxMvBgrOv1OHNTjDpqE8aDjwpFSMMnCPqQalu-eIFHZIfwqhSAwcso8B40R00FUl4QnrvMSFQtxdhfMquYZa8hkBwBXSKrzSgMzs4ZONX-OJ02Uz4gXv1beE1S9ujUPUHcUOwcyS2sMG_LI2bMykpWWxcPXU3dicP5_95l6FvM"
                  alt="Carlos Rodríguez"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-zinc-950 leading-tight tracking-tight truncate">Carlos Rodríguez</h2>
              <p className="text-[9px] text-primary font-bold tracking-wide uppercase truncate">Infraestructura &amp; Obra</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <div className={cn("space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.name;

            return (
              <div key={item.name}>
                {/* ── Nav Item ── */}
                <Link
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  onClick={(e) => {
                    if (hasSubItems && !collapsed) {
                      e.preventDefault();
                      setExpandedMenu(isExpanded ? null : item.name);
                    }
                  }}
                  className={cn(
                    "flex items-center rounded transition-all duration-200 group relative",
                    collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
                    isActive && !hasSubItems
                      ? "bg-primary text-white shadow-sm"
                      : hasSubItems && isActive
                      ? "bg-primary/8 text-primary"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined flex-shrink-0 transition-transform duration-200",
                    collapsed ? "text-[20px]" : "text-[18px]",
                    isActive && !hasSubItems ? "scale-110" : "group-hover:scale-105"
                  )}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 leading-none">
                        {item.name}
                      </span>
                      {hasSubItems && (
                        <span className="material-symbols-outlined text-[14px] opacity-40">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-xl whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                      {item.name}
                    </span>
                  )}
                </Link>

                {/* ── Sub Items (only when expanded) ── */}
                {!collapsed && hasSubItems && isExpanded && (
                  <div className="ml-4 mt-0.5 mb-1 space-y-0.5 pl-3 border-l-2 border-primary/20">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2 rounded transition-all duration-200 text-[9px] font-black uppercase tracking-[0.2em]",
                            isSubActive
                              ? "bg-primary text-white shadow-sm"
                              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                          )}
                        >
                          <span className="material-symbols-outlined text-[15px] flex-shrink-0">{sub.icon}</span>
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
      <div className={cn(
        "border-t border-zinc-100",
        collapsed ? "px-2 py-3 space-y-0.5" : "px-3 py-4 space-y-0.5"
      )}>
        {footerItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            title={collapsed ? item.name : undefined}
            className={cn(
              "flex items-center rounded transition-all duration-200 group relative text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100",
              collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2"
            )}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 transition-transform group-hover:scale-105">
              {item.icon}
            </span>
            {!collapsed && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">{item.name}</span>
            )}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-xl whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                {item.name}
              </span>
            )}
          </Link>
        ))}

        {/* ── CONTROL PROJECT Label ── */}
        {!collapsed && (
          <div className="pt-3 mt-2 border-t border-zinc-100 px-2">
            <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">
              Control Project v2.0
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
