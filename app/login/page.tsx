'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/inventory');
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <Card className="w-full max-w-md glass-card border-primary/20 shadow-2xl rounded-3xl overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <CardHeader className="space-y-4 pt-12 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="px-6 py-3 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/10 border border-white/10 backdrop-blur-md transition-transform hover:scale-105 duration-300">
              <img
                src="/logo-promet.png"
                alt="PROMET Logo"
                className="h-12 w-auto object-contain brightness-110"
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase">
              Control <span className="text-primary">Almacén</span>
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-[0.4em] text-muted-foreground opacity-70">
              CARLO TECH V2.0
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">
                Credenciales de Acceso
              </label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@empresa.com"
                  className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold focus:ring-primary/20 transition-all text-sm pl-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" title="Contraseña" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">
                Seguridad
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold focus:ring-primary/20 transition-all text-sm pl-6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-[11px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                <span>⚠️</span> {error === 'Invalid login credentials' ? 'Credenciales incorrectas' : error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 glow-primary transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                'Iniciar Sesión Master'
              )}
            </Button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-4">
              ¿No tienes cuenta?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors uppercase border-b-2 border-primary/20 pb-0.5">
                Solicitar Acceso
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-muted-foreground">
          CARLO TECH V2.0 • Security System
        </p>
      </div>
    </div>
  );
}
