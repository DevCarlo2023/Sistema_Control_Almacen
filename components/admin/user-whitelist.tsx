'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, Trash2, ShieldCheck, Mail } from 'lucide-react';

export function UserWhitelist() {
    const [emails, setEmails] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        const { data, error } = await supabase
            .from('authorized_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Error al cargar lista de autorizados');
        } else {
            setEmails(data || []);
        }
    };

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('authorized_users')
                .insert([{ email: newEmail.toLowerCase().trim() }]);

            if (error) {
                if (error.code === '23505') {
                    toast.error('Este correo ya está autorizado');
                } else {
                    throw error;
                }
            } else {
                toast.success('Usuario autorizado con éxito');
                setNewEmail('');
                fetchEmails();
            }
        } catch (err) {
            toast.error('Error al añadir el correo');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEmail = async (id: string, email: string) => {
        if (!confirm(`¿Estás seguro de quitar el acceso a ${email}?`)) return;

        try {
            const { error } = await supabase
                .from('authorized_users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Acceso revocado');
            fetchEmails();
        } catch (err) {
            toast.error('Error al revocar acceso');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck size={80} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} /> Control de Acceso (Whitelist)
                </h4>
                <p className="text-xs text-muted-foreground font-medium mb-4 max-w-xl">
                    Solo los correos electrónicos listados aquí podrán acceder al sistema de inventario.
                    Cualquier otro usuario que intente loguearse será expulsado automáticamente.
                </p>

                <form onSubmit={handleAddEmail} className="flex gap-3 max-w-md">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <Input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="pl-10 h-11 rounded-xl bg-background border-border/50 font-bold text-xs"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                        <UserPlus size={16} /> Autorizar
                    </Button>
                </form>
            </div>

            <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/5">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                            <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Correo Electrónico</TableHead>
                            <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Fecha Alta</TableHead>
                            <TableHead className="py-3 px-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {emails.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground italic text-xs">
                                    No hay usuarios autorizados registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            emails.map((item) => (
                                <TableRow key={item.id} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                                    <TableCell className="py-3 px-4 font-black text-xs text-foreground">
                                        {item.email}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase">
                                        {new Date(item.created_at).toLocaleDateString('es-ES')}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            onClick={() => handleRemoveEmail(item.id, item.email)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
