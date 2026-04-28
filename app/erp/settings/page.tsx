'use client';

import * as React from 'react';
import { 
  User, 
  Shield, 
  Paintbrush, 
  Bell, 
  Camera, 
  ChevronRight,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_SECTIONS = [
  { id: 'profile', name: 'Perfil Público', icon: User },
  { id: 'security', name: 'Seguridad', icon: Shield },
  { id: 'appearance', name: 'Apariencia', icon: Paintbrush },
  { id: 'notifications', name: 'Notificaciones', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            SISTEMA DE CONTROL / AJUSTES
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
            Ajustes de <span className="text-primary">Perfil</span>
          </h1>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all shadow-xl",
            isSaving ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-zinc-950 text-white hover:bg-primary shadow-primary/20"
          )}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-sm text-[11px] font-black uppercase tracking-wider transition-all duration-300 text-left group",
                activeTab === section.id 
                  ? "bg-white text-primary border border-zinc-200 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/50"
              )}
            >
              <section.icon className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                activeTab === section.id ? "text-primary" : "text-zinc-400"
              )} />
              {section.name}
              {activeTab === section.id && <ChevronRight className="ml-auto w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-10">
          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Profile Picture Section */}
              <div className="flex flex-col md:flex-row items-center gap-10 bg-white p-8 md:p-12 border border-zinc-200 rounded-sm shadow-sm relative overflow-hidden group">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-100 p-1 shadow-inner relative overflow-hidden">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLDIOI2MZUpZFwy7npGyjSQ2lltJOmQ0tMrct7nObYW3KGchoMGg71UffOACu69nKl2NC6QYJvkmUgUVByWNDHGypvJiBwSVGoxMvBgrOv1OHNTjDpqE8aDjwpFSMMnCPqQalu-eIFHZIfwqhSAwcso8B40R00FUl4QnrvMSFQtxdhfMquYZa8hkBwBXSKrzSgMzs4ZONX-OJ02Uz4gXv1beE1S9ujUPUHcUOwcyS2sMG_LI2bMykpWWxcPXU3dicP5_95l6FvM" 
                      alt="Carlos Rodríguez"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight">Foto de Perfil</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Recomendado: 400x400px .JPG o .PNG</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                    <button className="px-5 py-2 border border-zinc-200 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors">Subir nueva</button>
                    <button className="px-5 py-2 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors rounded-sm">Eliminar</button>
                  </div>
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 md:p-12 border border-zinc-200 rounded-sm shadow-sm">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Primer Nombre</label>
                    <input 
                      type="text" 
                      defaultValue="Carlos"
                      className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3 rounded-sm text-sm font-bold text-zinc-950 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Apellidos</label>
                    <input 
                      type="text" 
                      defaultValue="Rodríguez"
                      className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3 rounded-sm text-sm font-bold text-zinc-950 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Área / Departamento</label>
                    <input 
                      type="text" 
                      defaultValue="Infraestructura & Obra"
                      className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3 rounded-sm text-sm font-bold text-zinc-950 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      defaultValue="c.rodriguez@controlproject.com"
                      className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3 rounded-sm text-sm font-bold text-zinc-950 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <div className="p-5 bg-primary/5 rounded-sm flex items-start gap-4 border border-primary/10">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-primary/80 uppercase leading-relaxed tracking-wider">
                      Estos datos se utilizarán para la generación de reportes y registros de auditoría en el sistema de logística.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-8 md:p-12 border border-zinc-200 rounded-sm shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight mb-8">Seguridad de la Cuenta</h3>
              <div className="space-y-8">
                <div className="p-8 border border-zinc-100 rounded-sm hover:border-zinc-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-950 mb-1">Contraseña</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Último cambio: Hace 3 meses</p>
                    </div>
                    <button className="px-5 py-2 bg-zinc-950 text-white rounded-sm text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all">Cambiar</button>
                  </div>
                </div>
                
                <div className="p-8 border border-zinc-100 rounded-sm hover:border-zinc-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-950 mb-1">Autenticación de 2 Factores</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Altamente recomendado para gerencia</p>
                    </div>
                    <div className="w-12 h-6 bg-zinc-200 rounded-full relative cursor-auto transition-colors">
                       <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform translate-x-0 group-hover:translate-x-6 shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white p-8 md:p-12 border border-zinc-200 rounded-sm shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight mb-4 text-center md:text-left">Personalización Visual</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-10 text-center md:text-left">Personaliza tu entorno de trabajo en CONTROL PROJECT.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4 group cursor-pointer">
                  <div className="aspect-video bg-zinc-100 rounded-sm border-2 border-primary p-4 transition-all">
                    <div className="w-full h-full bg-white rounded-sm border border-zinc-200 overflow-hidden p-2">
                       <div className="w-full h-2 bg-zinc-100 mb-2"></div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="h-10 bg-zinc-50 border border-zinc-100 rounded-sm"></div>
                          <div className="h-10 bg-zinc-50 border border-zinc-100 rounded-sm"></div>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-950">Tema Claro (Figma Mode)</span>
                  </div>
                </div>

                <div className="space-y-4 group opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                  <div className="aspect-video bg-zinc-800 rounded-sm border border-zinc-700 p-4">
                    <div className="w-full h-full bg-zinc-900 rounded-sm border border-zinc-800 overflow-hidden p-2">
                       <div className="w-full h-2 bg-zinc-800 mb-2"></div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="h-10 bg-zinc-800 border border-zinc-700 rounded-sm"></div>
                          <div className="h-10 bg-zinc-800 border border-zinc-700 rounded-sm"></div>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-400"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Modo Oscuro (Industrial Night)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistence Notification */}
      {showSuccess && (
        <div className="fixed bottom-10 right-10 bg-zinc-950 text-white px-8 py-4 rounded-sm shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 z-[99]">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black uppercase tracking-widest">Cambios Guardados</span>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">El perfil se ha actualizado correctamente.</span>
          </div>
        </div>
      )}
    </div>
  );
}
