'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material, type Equipment } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, X, Link as LinkIcon, Building2, Package, Wrench } from 'lucide-react';
import { MaterialSearch } from './material-search';
import { EquipmentSearch } from '@/components/equipment/equipment-search';
import { cn } from '@/lib/utils';

interface UploadDocumentDialogProps {
  onSuccess: () => void;
  defaultLinkedType?: 'material' | 'equipment';
  defaultLinkedId?: string;
  defaultTitle?: string;
}

export function UploadDocumentDialog({ onSuccess, defaultLinkedType, defaultLinkedId, defaultTitle }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Form State
  const [title, setTitle] = useState(defaultTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Certificado de Calidad');
  const [linkedType, setLinkedType] = useState<'general' | 'material' | 'equipment'>(defaultLinkedType || 'general');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Effect to load initial asset if provided
  useEffect(() => {
    if (defaultLinkedId && defaultLinkedType) {
      const fetchInitialAsset = async () => {
        const table = defaultLinkedType === 'material' ? 'materials' : 'equipment';
        const { data } = await supabase.from(table).select('*').eq('id', defaultLinkedId).single();
        if (data) {
          if (defaultLinkedType === 'material') setSelectedMaterial(data as any);
          else setSelectedEquipment(data as any);
        }
      };
      fetchInitialAsset();
    }
  }, [defaultLinkedId, defaultLinkedType]);

  const resetForm = () => {
    setTitle(defaultTitle || '');
    setDescription('');
    setCategory('Certificado de Calidad');
    setLinkedType(defaultLinkedType || 'general');
    // If we have defaults, we might want to keep the asset selected, 
    // but usually onSuccess is called and dialog closes. 
    // If it stays open, we'll keep the context.
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error('Título y archivo son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `docs/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 2. Save to Database
      const { error: dbError } = await supabase
        .from('documentation')
        .insert({
          title,
          description,
          category,
          file_url: publicUrl,
          file_type: file.type,
          linked_type: linkedType,
          linked_id: linkedType === 'material' ? selectedMaterial?.id : linkedType === 'equipment' ? selectedEquipment?.id : null,
          uploaded_by: session.user.id,
        });

      if (dbError) throw dbError;

      toast.success('Documento cargado correctamente');
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error('Error uploading:', err);
      toast.error(err.message || 'Error al cargar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-zinc-200">
          <Upload className="w-4 h-4" />
          Subir Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] rounded-3xl border-zinc-100 p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 bg-zinc-50 border-b border-zinc-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-zinc-900">Nuevo Documento</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 font-medium italic">Sube certificados, fichas técnicas o de seguridad.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto compact-scrollbar">
          {/* File Dropzone */}
          <div className="space-y-2">
            <Label className="erp-label opacity-60">Archivo PDF</Label>
            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-zinc-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-primary/50 hover:bg-zinc-50 focus:outline-none transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Haz clic para subir o arrastra un PDF</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-900 uppercase truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[8px] text-zinc-400 font-black uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 rounded-full" onClick={() => setFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="erp-label opacity-60">Título del Documento</Label>
              <Input 
                placeholder="Ej. Certificado de Izaje #456" 
                className="rounded-xl h-11 font-bold text-xs" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="erp-label opacity-60">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-11 font-bold text-xs bg-white">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="Certificado de Calidad" className="text-xs font-bold uppercase py-2.5">Certificado de Calidad</SelectItem>
                  <SelectItem value="Ficha Técnica" className="text-xs font-bold uppercase py-2.5">Ficha Técnica</SelectItem>
                  <SelectItem value="Ficha de Seguridad" className="text-xs font-bold uppercase py-2.5">Ficha de Seguridad (SDS)</SelectItem>
                  <SelectItem value="Manual" className="text-xs font-bold uppercase py-2.5">Manual</SelectItem>
                  <SelectItem value="Otro" className="text-xs font-bold uppercase py-2.5">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="erp-label opacity-60">Descripción (Opcional)</Label>
            <Textarea 
              placeholder="Detalles adicionales sobre el documento..." 
              className="rounded-xl min-h-[80px] font-medium text-xs resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Linking Section */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vinculación de Activos</span>
             </div>
             
             <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLinkedType('general')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5",
                    linkedType === 'general' ? "bg-zinc-900 border-zinc-900 text-white shadow-lg" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">General</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkedType('material')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5",
                    linkedType === 'material' ? "bg-primary border-primary text-white shadow-lg" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <Package className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Material</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkedType('equipment')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1.5",
                    linkedType === 'equipment' ? "bg-cyan-700 border-cyan-700 text-white shadow-lg" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <Wrench className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Equipo</span>
                </button>
             </div>

             {/* Asset Search */}
             {linkedType === 'material' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <Label className="erp-label opacity-60">Buscar Material</Label>
                   <MaterialSearch 
                     selectedMaterial={selectedMaterial}
                     onSelectMaterial={setSelectedMaterial}
                   />
                   {selectedMaterial && (
                     <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-primary tracking-tight">{selectedMaterial.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/20" onClick={() => setSelectedMaterial(null)}>
                           <X className="w-3 h-3" />
                        </Button>
                     </div>
                   )}
                </div>
             )}

             {linkedType === 'equipment' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <Label className="erp-label opacity-60">Buscar Equipo</Label>
                   <EquipmentSearch 
                     selected={selectedEquipment}
                     onSelect={setSelectedEquipment}
                   />
                   {selectedEquipment && (
                     <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-cyan-800 tracking-tight">{selectedEquipment.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-cyan-700 hover:bg-cyan-100" onClick={() => setSelectedEquipment(null)}>
                           <X className="w-3 h-3" />
                        </Button>
                     </div>
                   )}
                </div>
             )}
          </div>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-zinc-200"
            onClick={() => { setOpen(false); resetForm(); }}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 h-12 rounded-xl bg-zinc-950 font-black uppercase text-[10px] tracking-widest text-white shadow-xl hover:-translate-y-0.5 transition-all"
            onClick={handleUpload}
            disabled={loading || !file || !title}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Guardar Documento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
