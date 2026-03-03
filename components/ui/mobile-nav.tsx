'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Package, Wrench, Users, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
    { label: 'Inventario', icon: Package, path: '/inventory' },
    {
        label: 'Equipos',
        icon: Wrench,
        path: '/equipment',
        matcher: (p: string, s: URLSearchParams) => p === '/equipment' && !s.get('tab')
    },
    {
        label: 'Personal',
        icon: Users,
        path: '/equipment?tab=workers',
        matcher: (p: string, s: URLSearchParams) => p === '/equipment' && s.get('tab') === 'workers'
    },
    {
        label: 'Historial',
        icon: History,
        path: '/inventory?tab=history',
        matcher: (p: string, s: URLSearchParams) => s.get('tab') === 'history'
    },
];

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    if (pathname === '/login' || pathname === '/signup') return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navigate = (path: string) => {
        if (path === '/inventory?tab=history') {
            if (pathname === '/equipment') {
                router.push('/equipment?tab=history');
            } else {
                router.push('/inventory?tab=history');
            }
            return;
        }
        router.push(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden mobile-safe-bottom bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
            <div className="flex items-center justify-around p-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.matcher
                        ? item.matcher(pathname, searchParams)
                        : pathname === item.path;

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "relative flex flex-col items-center gap-0.5 p-1 min-w-[3.2rem] rounded-xl transition-all duration-300",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className={cn("size-4", isActive && "stroke-[2.5px]")} />
                            <span className="text-[7.5px] font-black uppercase tracking-tighter truncate w-full text-center">{item.label}</span>
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-glow" />
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 p-1 min-w-[3rem] rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                >
                    <LogOut className="size-4 sm:size-5" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Salir</span>
                </button>
            </div>
        </nav>
    );
}
