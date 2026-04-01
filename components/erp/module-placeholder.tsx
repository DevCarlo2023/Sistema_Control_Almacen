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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-in fade-in zoom-in duration-700 max-w-4xl mx-auto">
      <div className="relative">
        <div className="w-28 h-28 rounded-[2.5rem] bg-blue-600/5 border border-blue-500/10 flex items-center justify-center shadow-xl shadow-blue-500/5">
          <Icon className="w-14 h-14 text-blue-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-500/20 animate-pulse blur-md" />
      </div>

      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{title}</h1>
        <p className="text-slate-500 font-medium leading-relaxed tracking-wide lowercase italic first-letter:uppercase">{description}</p>
      </div>

      <div className="flex items-center gap-6 pt-4">
        <Link href="/erp/dashboard">
          <Button variant="outline" className="h-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 gap-2 px-8 font-bold uppercase tracking-widest text-[10px]">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Hub
          </Button>
        </Link>
        <Button className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 px-8 font-bold uppercase tracking-widest text-[10px] text-white">
          Configurar Módulo
        </Button>
      </div>
      
      {/* Decorative Grid */}
      <div className="grid grid-cols-4 gap-6 opacity-3 pointer-events-none pt-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-32 h-32 rounded-3xl bg-blue-600/10 border border-blue-500/20 rotate-12" />
        ))}
      </div>
    </div>
  );
}
