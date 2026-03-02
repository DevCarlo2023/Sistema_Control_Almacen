'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialManager } from './material-manager';
import { WarehouseManager } from './warehouse-manager';
import { UserWhitelist } from './user-whitelist';

export function AdminTabs({ userEmail }: { userEmail?: string }) {
    const isSuperAdmin = userEmail === 'programadorcarlo@hotmail.com';

    return (
        <div className="w-full">
            <div className="mb-8">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Mantenimiento de Datos</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest mt-1">Configuración manual de la base de datos industrial</p>
            </div>

            <Tabs defaultValue="materials" className="w-full">
                <TabsList className="inline-flex bg-muted/30 p-1 rounded-xl glass border border-border/50 mb-6">
                    <TabsTrigger value="materials" className="rounded-lg font-bold px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        📦 Materiales
                    </TabsTrigger>
                    <TabsTrigger value="warehouses" className="rounded-lg font-bold px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg text-sm">
                        🏢 Almacenes
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="security" className="rounded-lg font-bold px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg text-sm">
                            🛡️ Seguridad
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="materials" className="mt-0 focus-visible:outline-none">
                    <MaterialManager />
                </TabsContent>

                <TabsContent value="warehouses" className="mt-0 focus-visible:outline-none">
                    <WarehouseManager />
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                        <UserWhitelist />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
