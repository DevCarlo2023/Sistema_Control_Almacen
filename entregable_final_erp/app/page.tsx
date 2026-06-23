'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirigir directamente al ERP. 
    // El Middleware se encargará de mandarte al Login si no hay sesión.
    router.replace('/erp/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
          Accediendo al Sistema ERP...
        </p>
      </div>
    </div>
  );
}
