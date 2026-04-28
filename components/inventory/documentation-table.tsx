'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Documentation } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Download, 
  ExternalLink, 
  Trash2, 
  MoreVertical,
  Calendar,
  Tag,
  Link as LinkIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DocumentationTableProps {
  category: string;
  refreshTrigger: number;
  linkedId?: string;
}

export function DocumentationTable({ category, refreshTrigger, linkedId }: DocumentationTableProps) {
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('documentation')
          .select(`
            *,
            material:materials(id, name),
            equipment:equipment(id, name)
          `)
          .order('created_at', { ascending: false });

        if (category !== 'Todos') {
          query = query.eq('category', category);
        }

        if (linkedId) {
          query = query.eq('linked_id', linkedId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setDocs(data as any || []);
      } catch (err: any) {
        console.error('Error fetching docs:', err);
        toast.error('Error al cargar documentos');
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();

    const channel = supabase
      .channel('doc_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentation' }, () => fetchDocs())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, refreshTrigger, linkedId]);

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      // 1. Delete from storage if needed (assuming fileUrl is the path or full URL)
      // For now just delete record
      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Documento eliminado');
    } catch (err: any) {
      toast.error('Error al eliminar documento');
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.material?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.equipment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground animate-pulse">
        Cargando documentos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Buscar por título, descripción o activo vinculado..."
          className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 font-medium text-sm w-full focus:bg-white dark:focus:bg-zinc-800 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredDocs.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
          <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500 font-medium tracking-tight">No se encontraron documentos en esta categoría</p>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
                  <TableHead>Documento</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Vinculado a</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="group hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-0">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-zinc-950 uppercase tracking-tight line-clamp-1 font-outfit">{doc.title}</span>
                          <span className="text-[10px] text-zinc-400 font-medium italic line-clamp-1">{doc.description || 'Sin descripción'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 text-[9px] font-black uppercase text-zinc-500 tracking-wider font-outfit">
                        <Tag className="w-3 h-3" />
                        {doc.category}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {doc.linked_type !== 'general' ? (
                        <div className="flex items-center gap-2">
                           <LinkIcon className="w-3 h-3 text-zinc-400" />
                           <span className="text-[11px] font-bold text-zinc-700 font-outfit">
                             {doc.linked_type === 'material' ? doc.material?.name : doc.equipment?.name}
                           </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">General</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-zinc-800 font-outfit">
                          {new Date(doc.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] text-zinc-400 uppercase font-black font-outfit">
                          {new Date(doc.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl border-zinc-100 shadow-xl">
                            <DropdownMenuItem asChild>
                              <a href={doc.file_url} download className="cursor-pointer flex items-center gap-2 text-xs font-bold uppercase">
                                <Download className="w-4 h-4" /> Descargar
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc.id, doc.file_url)}
                              className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2 text-xs font-bold uppercase"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="p-5 rounded-3xl bg-white border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[13px] font-bold text-zinc-950 uppercase tracking-tight leading-tight font-outfit">{doc.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-[8px] font-black uppercase tracking-wider text-zinc-500 font-outfit">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                        <MoreVertical className="w-5 h-5 transition-transform active:scale-95" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-zinc-100 shadow-2xl">
                      <DropdownMenuItem asChild>
                        <a href={doc.file_url} target="_blank" className="flex items-center gap-3 p-3 text-xs font-black uppercase text-primary">
                          <ExternalLink className="w-4 h-4" /> Ver Online
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={doc.file_url} download className="flex items-center gap-3 p-3 text-xs font-black uppercase text-zinc-700">
                          <Download className="w-4 h-4" /> Descargar
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(doc.id, doc.file_url)} className="flex items-center gap-3 p-3 text-xs font-black uppercase text-red-600">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {doc.description && (
                  <p className="text-[11px] text-zinc-500 italic leading-relaxed pl-14">
                    {doc.description}
                  </p>
                )}

                <div className="pt-4 border-t border-zinc-50 flex items-center justify-between pl-14">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span className="text-[9px] font-bold text-zinc-400 uppercase font-outfit">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {doc.linked_type !== 'general' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-500 shadow-sm">
                      <LinkIcon className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider font-outfit">
                        {doc.linked_type === 'material' ? doc.material?.name : doc.equipment?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
