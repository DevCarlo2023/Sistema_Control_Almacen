'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Package, LayoutDashboard, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function RootPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center gap-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">Carlotech Industrial Suite</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none"
          >
            Gestión Industrial <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600">
              De Alta Fidelidad
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 max-w-xl mx-auto text-sm font-medium leading-relaxed"
          >
            Selecciona el sistema al que deseas acceder para continuar con la operación. 
            Ambas plataformas comparten el mismo motor de seguridad e inteligencia.
          </motion.p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Almacén Central */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-500"
          >
            <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Almacén Central</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-8">
              Control de inventarios, equipos, materiales críticos y despacho en tiempo real.
            </p>
            <Button 
              onClick={() => router.push('/login')}
              variant="link" 
              className="p-0 text-blue-400 font-black uppercase text-[10px] tracking-widest gap-2 group-hover:gap-4 transition-all"
            >
              Entrar al Sistema <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Suite ERP */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ delay: 0.1 }}
            className="group relative p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500"
          >
            <div className="h-14 w-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <LayoutDashboard className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Suite ERP</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-8">
              Administración, Calidad, Logística y Seguridad Industrial integral con IA.
            </p>
            <Button 
              onClick={() => router.push('/erp/dashboard')}
              variant="link" 
              className="p-0 text-purple-400 font-black uppercase text-[10px] tracking-widest gap-2 group-hover:gap-4 transition-all"
            >
              Entrar a la Suite <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="pt-12 border-t border-white/5 w-full text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">
            Promet V2.0 | Powered by Carlotech Intelligence
          </p>
        </motion.div>
      </div>
    </div>
  );
}
