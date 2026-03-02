'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Package, Wrench, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
    { label: 'Inventario', icon: Package, path: '/inventory' },
    { label: 'Equipos', icon: Wrench, path: '/equipment' },
    { label: 'Historial', icon: History, path: '/history' }, // Note: /history might need to be /inventory?tab=history or similar
];

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();

    if (pathname === '/login' || pathname === '/signup') return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navigate = (path: string) => {
        if (path === '/history') {
            // Find if we are in equipment or inventory to redirect to the correct tab
            if (pathname.includes('equipment')) {
                router.push('/equipment?tab=history');
            } else {
                router.push('/inventory?tab=history');
            }
            return;
        }
        router.push(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden mobile-safe-bottom">
            <div className="mx-4 mb-4 glass-card rounded-2xl flex items-center justify-around p-2 shadow-2xl border-primary/20 bg-background/80 backdrop-blur-xl">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || (item.path === '/history' && pathname.includes('history'));

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
                                isActive
                                    ? "text-primary bg-primary/10 scale-110"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary shadow-glow" />
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                >
                    <LogOut className="size-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Salir</span>
                </button>
            </div>
        </nav>
    );
}
