'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WorkerManagement } from '@/components/admin/human-resources/worker-management';
import { HRImportBar } from '@/components/admin/human-resources/hr-import-bar';
import { Users, UserPlus, FileDown, Briefcase, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shared design tokens ────────────────────────────────────────────────
const CARD = 'bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden';
const LABEL = 'text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400';
const SECTION_TITLE = 'text-xs font-black uppercase tracking-[0.1em] text-zinc-800';

export default function HumanResourcesPage() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, [router]);

  const refresh = () => setRefreshTrigger(p => p + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 md:p-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-200/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className={cn(LABEL, 'text-purple-600')}>ADMINISTRACIÓN · RECURSOS HUMANOS</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Gestión de <span className="text-zinc-700 italic">Personal</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 italic">
            Control administrativo de ingresos, ceses y posiciones operativas.
          </p>
        </div>
        
        <div className="w-full md:w-[450px]">
          <HRImportBar onSuccess={refresh} />
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className={cn(CARD)}>
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-zinc-400" />
            <h2 className={cn(SECTION_TITLE)}>Maestro de Trabajadores</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase">Sincronizado</span>
          </div>
        </div>
        
        <div className="p-0">
          <WorkerManagement refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
