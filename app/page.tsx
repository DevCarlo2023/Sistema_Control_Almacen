'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Package, LayoutDashboard, ArrowRight, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();
  const [isSubdomain, setIsSubdomain] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkHost = async () => {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'carlotech.com';
      
      // If we are already in a subdomain, handle auto-redirect
      if (hostname.startsWith('almacen.')) {
        setIsSubdomain(true);
        const { data: { session } } = await supabase.auth.getSession();
        router.push(session ? '/inventory' : '/login');
        return;
      }

      if (hostname.startsWith('erp.')) {
        setIsSubdomain(true);
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkHost();
  }, [router]);

  if (loading || isSubdomain) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full space-y-12 relative z-10 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
            <AppWindow className="w-4 h-4" />
            Carlotech Industrial Suite
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            GESTIÓN INDUSTRIAL <br /> DE ALTA FIDELIDAD
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Selecciona el sistema al que deseas acceder para continuar con la operación. 
            Ambas plataformas comparten el mismo motor de seguridad e inteligencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Almacen Option */}
          <Card 
            className="group glass-card border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => window.location.href = `http://almacen.${window.location.host}`}
          >
            <CardHeader className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Almacén Central</CardTitle>
              <CardDescription className="text-white/70 text-base font-medium">
                Control de inventarios, equipos, materiales críticos y despacho en tiempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest">
              Entrar al Sistema <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </CardContent>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          </Card>

          {/* ERP Option */}
          <Card 
            className="group glass-card border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-500 cursor-pointer overflow-hidden relative shadow-2xl shadow-purple-500/5"
            onClick={() => window.location.href = `http://erp.${window.location.host}`}
          >
            <CardHeader className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-8 h-8 text-purple-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Suite ERP</CardTitle>
              <CardDescription className="text-white/70 text-base font-medium">
                Administración, Calidad, Logística y Seguridad Industrial integral con IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex items-center gap-2 text-purple-400 font-bold uppercase text-xs tracking-widest">
              Entrar a la Suite <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </CardContent>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 blur-3xl group-hover:bg-purple-500/10 transition-colors" />
          </Card>
        </div>

        <div className="pt-12 border-t border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">
            PROMET V2.0 | Powered by Carlotech Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
