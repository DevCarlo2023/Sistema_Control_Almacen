'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  User, 
  Shield, 
  Palette, 
  Bell, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ERPSettings() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  
  // Form State
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [email, setEmail] = React.useState('');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const [first, ...last] = (session.user.user_metadata?.full_name || 'C. Peña Aponte').split(' ');
        setFirstName(first || '');
        setLastName(last.join(' ') || '');
        setRole(session.user.user_metadata?.role || 'Almacén');
        setEmail(session.user.email || '');
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: fullName,
        role: role 
      }
    });

    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll simulate the upload by using a local preview or UI feedback
    // Real implementation would use supabase.storage.upload
    setLoading(true);
    alert("Funcionalidad de carga de archivos (Storage) se activará tras configurar los buckets. Por ahora el perfil se sincroniza por nombre.");
    setLoading(false);
  };

  const fullName = user?.user_metadata?.full_name || 'C. Peña Aponte';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${fullName}&background=0D0D0D&color=fff`;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4 block">Sistema de Control / Ajustes</span>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 uppercase tracking-tighter leading-none">
            Ajustes de <span className="text-blue-600">Perfil</span>
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-3 bg-zinc-950 text-white px-10 py-5 rounded-sm text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-zinc-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-4 h-4" />} label="Perfil Público" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield className="w-4 h-4" />} label="Seguridad" />
          <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette className="w-4 h-4" />} label="Apariencia" />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell className="w-4 h-4" />} label="Notificaciones" />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Photo Section */}
              <div className="bg-white p-10 border border-zinc-100 rounded-sm shadow-sm flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-zinc-50 bg-zinc-100 shadow-md">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute -right-2 -bottom-2 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleAvatarUpdate} />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest mb-2">Foto de Perfil</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed mb-6">Recomendado: 400x400px .JPG o .PNG</p>
                  <div className="flex items-center gap-4">
                    <label className="px-6 py-2.5 border border-zinc-200 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all cursor-pointer">Subir Nueva</label>
                    <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-all">Eliminar</button>
                  </div>
                </div>
              </div>

              {/* Data Form */}
              <div className="bg-white p-10 border border-zinc-100 rounded-sm shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Primer Nombre</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-100 px-5 py-4 rounded-sm text-sm font-bold text-zinc-950 focus:border-blue-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Apellidos</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-100 px-5 py-4 rounded-sm text-sm font-bold text-zinc-950 focus:border-blue-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Área / Departamento</label>
                      <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-100 px-5 py-4 rounded-sm text-sm font-bold text-zinc-950 focus:border-blue-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={email}
                        disabled
                        className="w-full bg-zinc-100 border border-zinc-100 px-5 py-4 rounded-sm text-sm font-bold text-zinc-400 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6">
                    <div className="p-6 bg-blue-50/50 rounded-sm flex items-start gap-5 border border-blue-100">
                      <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-blue-700 uppercase leading-relaxed tracking-wider">
                        Estos datos se utilizarán para la generación de reportes y registros de auditoría en el sistema de logística.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Other tabs omitted for brevity but UI preserved */}
          {activeTab !== 'profile' && (
            <div className="bg-white p-20 border border-zinc-100 rounded-sm shadow-sm text-center">
              <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Sección en Desarrollo</h3>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-10 right-10 bg-zinc-950 text-white px-8 py-5 rounded-sm shadow-2xl flex items-center gap-5 animate-in slide-in-from-right-10 duration-500 z-[99]">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Perfil Actualizado</span>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Los cambios se han guardado correctamente.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all",
        active ? "bg-white border border-zinc-100 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50"
      )}
    >
      <div className="flex items-center gap-4">
        {icon}
        {label}
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </button>
  );
}
