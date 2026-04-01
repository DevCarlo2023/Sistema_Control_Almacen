'use client';

import * as React from 'react';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ModulePlaceholderProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

export function ModulePlaceholder({ title, icon: Icon, description }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-2xl shadow-blue-500/10">
          <Icon className="w-12 h-12 text-blue-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 animate-pulse blur-sm" />
      </div>

      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-white uppercase">{title}</h1>
        <p className="text-gray-400 font-light leading-relaxed">{description}</p>
      </div>

      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="rounded-xl border border-white/5 hover:bg-white/5 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Hub
          </Button>
        </Link>
        <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20">
          Iniciar Configuración
        </Button>
      </div>
      
      {/* Decorative */}
      <div className="grid grid-cols-3 gap-4 opacity-10 pointer-events-none">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-32 h-32 rounded-xl bg-blue-500/10 border border-blue-500/20" />
        ))}
      </div>
    </div>
  );
}
