'use client';

import * as React from 'react';
import { Package, Wrench, ShieldCheck, Truck, Activity, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const modules = [
  { id: 'inventory', title: 'Inventario de Materiales', icon: Package, stats: '1,245 Items', color: 'from-blue-500 to-cyan-400' },
  { id: 'quality', title: 'Gestión de Calidad', icon: Activity, stats: '98.4%', color: 'from-purple-500 to-pink-500' },
  { id: 'logistics', title: 'Operación Logística', icon: Truck, stats: '34 Activos', color: 'from-yellow-500 to-orange-500' },
  { id: 'safety', title: 'Seguridad Industrial', icon: ShieldCheck, stats: 'Score: 100', color: 'from-green-500 to-emerald-400' },
  { id: 'equipment', title: 'Mantenimiento Equipos', icon: Wrench, stats: '82% OEE', color: 'from-red-500 to-orange-400' }
];

export default function ERPDashboardPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent uppercase">INDUSTRIAL HUB</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {modules.map((mod) => (
          <Card key={mod.id} className="glass-card border-white/5 bg-white/[0.03] backdrop-blur-xl relative overflow-hidden group">
            <CardHeader className="p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${mod.color} mb-4 shadow-lg`}><mod.icon className="text-white w-6 h-6" /></div>
              <CardTitle className="text-xs font-bold tracking-wider text-gray-300 uppercase">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <span className="text-2xl font-bold tracking-tight text-white">{mod.stats}</span>
              <div className="mt-6 flex items-center justify-between text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
                 <span className="text-[10px] font-bold uppercase tracking-widest">Entrar</span>
                 <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
