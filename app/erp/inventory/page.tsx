'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Wrench, Truck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const inventoryModules = [
  { 
    title: 'Materiales', 
    description: 'Gestión maestro de artículos y stock.', 
    icon: Package, 
    href: '/erp/inventory/materials',
    color: 'bg-blue-600'
  },
  { 
    title: 'Equipos', 
    description: 'Control de activos y mantenimiento.', 
    icon: Wrench, 
    href: '/erp/inventory/equipment',
    color: 'bg-orange-600'
  }
];

export default function InventoryLandingPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Gestión de <span className="text-blue-600">Inventario</span></h1>
        <p className="text-slate-500 font-medium text-sm tracking-widest uppercase">Seleccione el módulo de control operativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {inventoryModules.map((mod) => (
          <Link href={mod.href} key={mod.title}>
            <Card className="border border-slate-100 bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 rounded-[2rem] overflow-hidden group cursor-pointer">
              <CardContent className="p-10 flex items-center gap-8">
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-transform duration-300", mod.color)}>
                  <mod.icon className="w-10 h-10" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{mod.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{mod.description}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
