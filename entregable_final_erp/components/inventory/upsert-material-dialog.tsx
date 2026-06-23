'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Package, Loader2, Save, X, Hash, Ruler, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STANDARD_UOMS } from '@/lib/catalog-utils';

interface UpsertMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  onSuccess: () => void;
}

export function UpsertMaterialDialog({ open, onOpenChange, material, onSuccess }: UpsertMaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [codigo, setCodigo] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('');
  const [isCustomUom, setIsCustomUom] = useState(false);
  const [unitPrice, setUnitPrice] = useState<string>('0');

  useEffect(() => {
    if (material) {
      setCodigo(material.codigo || '');
      setName(material.name || '');
      setDescription(material.description || '');
      setUom(material.unit_of_measure || '');
      setIsCustomUom(!STANDARD_UOMS.some(u => u.value === material.unit_of_measure));
      setUnitPrice(material.unit_price?.toString() || '0');
    } else {
      setCodigo('');
      setName('');
      setDescription('');
      setUom('');
      setIsCustomUom(false);
      setUnitPrice('0');
    }
  }, [material, open]);

  const handleSave = async () => {
    if (!name || !uom) {
      toast.error('Descripción Técnica y Unidad de Medida son obligatorios');
      return;
    }

    setLoading(true);
    try {
      // Duplication Checks
      if (codigo && codigo.trim() !== '' && codigo.trim().toUpperCase() !== 'SIN SKU') {
        const query = supabase.from('materials').select('id').ilike('codigo', codigo.trim());
        if (material?.id) query.neq('id', material.id);
        
        const { data: existingCodes } = await query;
        if (existingCodes && existingCodes.length > 0) {
          toast.error(`El código "${codigo}" ya se encuentra registrado en el catálogo.`);
          setLoading(false);
          return;
        }
      }

      if (name) {
        const query = supabase.from('materials').select('id').ilike('name', name.trim());
        if (material?.id) query.neq('id', material.id);
        
        const { data: existingNames } = await query;
        if (existingNames && existingNames.length > 0) {
          toast.error(`El artículo "${name}" ya está registrado.`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        codigo: codigo ? codigo.trim().toUpperCase() : null,
        name: name.trim().toUpperCase(),
        description: description ? description.trim().toUpperCase() : null,
        unit_of_measure: uom,
        unit_price: parseFloat(unitPrice) || 0,
        updated_at: new Date().toISOString(),
      };

      if (material?.id) {
        // Update
        const { error } = await supabase
          .from('materials')
          .update(payload)
          .eq('id', material.id);
        
        if (error) throw error;
        toast.success('Material actualizado correctamente');
      } else {
        // Create
        const { data, error } = await supabase
          .from('materials')
          .insert([payload])
          .select();
        
        if (error) {
          toast.error('Error de BD: ' + error.message);
          return;
        }

        if (!data || data.length === 0) {
          toast.error('Error: Inserción bloqueada silenciosamente por RLS o no devuelta. Contacte a soporte.');
          return;
        }

        toast.success('Material creado correctamente');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving material:', err);
      toast.error(err.message || 'Error al guardar el material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-zinc-100 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-zinc-900 border-b border-zinc-800 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Package className="w-24 h-24 text-white rotate-12" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="w-5 h-5 text-white" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">
                  {material ? 'Editar Material' : 'Nuevo Material'}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-medium italic">
                  Mantenimiento del catálogo maestro de artículos.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="erp-label flex items-center gap-1.5 opacity-60">
                <Hash className="w-3 h-3" /> Código
              </Label>
              <Input 
                placeholder="Ej. 40001234" 
                className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 focus:bg-white transition-all uppercase" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label className="erp-label flex items-center gap-1.5 opacity-60">
                <Ruler className="w-3 h-3" /> Unidad de Medida
              </Label>
              {isCustomUom ? (
                <div className="relative group/uom">
                  <Input 
                    placeholder="Ej. MILLAR, ROLLO" 
                    className="rounded-xl h-11 font-black text-[10px] bg-zinc-50 border-zinc-200 focus:bg-white transition-all uppercase pr-10 tracking-widest text-primary" 
                    value={uom}
                    onChange={(e) => setUom(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={() => { setIsCustomUom(false); setUom(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Volver a lista estándar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Select value={uom} onValueChange={(val) => {
                  if (val === 'NEW') setIsCustomUom(true);
                  else setUom(val);
                }}>
                  <SelectTrigger className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 focus:bg-white transition-all uppercase">
                    <SelectValue placeholder="Seleccionar U.M." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                    <div className="p-2 pb-1 text-[8px] font-black text-zinc-400 uppercase tracking-widest">Unidades Estándar</div>
                    {STANDARD_UOMS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value} className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        {unit.label}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-zinc-100 my-1" />
                    <SelectItem value="NEW" className="text-[10px] font-black uppercase tracking-widest text-primary focus:bg-primary/5">
                      [+] AGREGAR NUEVA UNIDAD...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="erp-label opacity-60">Descripción Técnica</Label>
            <Input 
              placeholder="Ej. Acero Inoxidable 2mm, marca, dimensiones..." 
              className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 focus:bg-white transition-all" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="erp-label flex items-center gap-1.5 opacity-60">
              <DollarSign className="w-3 h-3" /> Precio Unitario (S/.)
            </Label>
            <Input 
              type="number"
              step="0.01"
              placeholder="0.00" 
              className="rounded-xl h-11 font-black text-sm bg-zinc-50 border-zinc-200 focus:bg-white transition-all text-primary" 
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-zinc-200 hover:bg-white transition-all"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 h-12 rounded-xl bg-zinc-950 font-black uppercase text-[10px] tracking-widest text-white shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {material ? 'Actualizar Maestro' : 'Crear Artículo'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
