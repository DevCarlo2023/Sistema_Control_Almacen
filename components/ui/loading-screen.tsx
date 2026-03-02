'use client'

import { Spinner } from '@/components/ui/spinner'

export function LoadingScreen() {
    return (
        <div
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#020617] text-white"
            style={{ backgroundColor: '#020617' }}
        >
            {/* Universal Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center gap-10">
                {/* Logo Container - Forced Visibility */}
                <div className="flex flex-col items-center gap-6">
                    <div
                        className="p-8 bg-white rounded-3xl shadow-2xl border-4 border-primary/20"
                        style={{ backgroundColor: 'white' }}
                    >
                        <img
                            src="/logo-promet.png"
                            alt="PROMET Logo"
                            className="h-24 w-auto object-contain block"
                            style={{ display: 'block', minHeight: '60px' }}
                        />
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase italic">
                            PROMET <span className="text-primary not-italic">SISTEMA</span>
                        </h1>
                        <p className="text-[10px] font-bold tracking-[0.5em] text-primary/80 uppercase mt-2">
                            Industrial Logic Hub
                        </p>
                    </div>
                </div>

                {/* Professional Spinner Area */}
                <div className="flex items-center gap-6 py-4 px-8 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                    <Spinner className="size-10 text-primary animate-spin" />
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase">
                            Iniciando Módulo
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Protección de Datos Activa
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40">
                <div className="h-[2px] w-12 bg-primary rounded-full mb-2" />
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-300">
                    LOGIC CORE v2.0
                </p>
            </div>
        </div>
    )
}
