'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Equipment, type Warehouse } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Wrench, Loader2, Save, X, Hash, HardHat, Settings, Info, Plus, CalendarDays, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpsertEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSuccess: () => void;
  defaultWarehouseId?: string;
}

export function UpsertEquipmentDialog({ open, onOpenChange, equipment, onSuccess, defaultWarehouseId }: UpsertEquipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<string>('poder');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [status, setStatus] = useState<any>('operativo');
  const [ownership, setOwnership] = useState<any>('propio');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [calibrationStart, setCalibrationStart] = useState('');
  const [calibrationFrequency, setCalibrationFrequency] = useState<string>('');
  const [calibrationEnd, setCalibrationEnd] = useState('');

  useEffect(() => {
    if (equipment) {
      setName(equipment.name || '');
      setDescription(equipment.description || '');
      setSerialNumber(equipment.serial_number || '');
      setBrand(equipment.brand || '');
      setModel(equipment.model || '');
      
      const isKnownCategory = ['poder', 'computo', 'instrumentacion', 'izaje'].includes(equipment.category || '');
      if (isKnownCategory) {
        setCategory(equipment.category);
        setShowCustomCategory(false);
      } else {
        setCategory('otra');
        setCustomCategory(equipment.category || '');
        setShowCustomCategory(true);
      }
      
      setStatus(equipment.status || 'operativo');
      setOwnership(equipment.ownership || 'propio');
      setUnitPrice(equipment.unit_price?.toString() || '');
      setCalibrationStart(equipment.calibration_start || '');
      setCalibrationEnd(equipment.calibration_end || '');
      setCalibrationFrequency(equipment.calibration_frequency?.toString() || '');
    } else {
      setName('');
      setDescription('');
      setSerialNumber('');
      setBrand('');
      setModel('');
      setCategory('poder');
      setCustomCategory('');
      setShowCustomCategory(false);
      setStatus('operativo');
      setOwnership('propio');
      setUnitPrice('');
      setCalibrationStart('');
      setCalibrationEnd('');
      setCalibrationFrequency('');
    }
  }, [equipment, open, defaultWarehouseId]);

  // Auto-calculate calibration end
  useEffect(() => {
    if (calibrationStart && calibrationFrequency && !isNaN(parseInt(calibrationFrequency))) {
      const start = new Date(calibrationStart);
      if (!isNaN(start.getTime())) {
        const months = parseInt(calibrationFrequency);
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        setCalibrationEnd(end.toISOString().split('T')[0]);
      }
    }
  }, [calibrationStart, calibrationFrequency]);

  const handleSave = async () => {
    if (!name || !serialNumber) {
      toast.error('Nombre y Serie son obligatorios');
      return;
    }

    setLoading(true);
    try {
      // 1. Duplicate check for serial_number
      const { data: existing, error: checkError } = await supabase
        .from('equipment')
        .select('id, name')
        .eq('serial_number', serialNumber.trim().toUpperCase())
        .maybeSingle();

      if (checkError) throw checkError;
      
      const existingItem = existing as any;
      
      // If found and not the current editing item
      if (existingItem && (!equipment || existingItem.id !== equipment.id)) {
        toast.error(`El número de serie "${serialNumber}" ya está registrado para: ${existingItem.name}`);
        setLoading(false);
        return;
      }

      const finalCategory = category === 'otra' ? customCategory.trim().toUpperCase() : category;

      if (!finalCategory) {
        toast.error('Debe especificar una categoría');
        setLoading(false);
        return;
      }

      const isInstrumentation = category === 'instrumentacion' || finalCategory.includes('INSTRUMENTACION');
      const payload: any = {
        name: name.trim().toUpperCase(),
        description: description.trim(),
        serial_number: serialNumber.trim().toUpperCase(),
        brand: brand.trim().toUpperCase(),
        model: model.trim().toUpperCase(),
        category: finalCategory,
        status,
        ownership,
        unit_price: parseFloat(unitPrice) || 0,
        current_location: 'almacen',
        calibration_start: (isInstrumentation && calibrationStart) ? calibrationStart : null,
        calibration_end: (isInstrumentation && calibrationEnd) ? calibrationEnd : null,
        calibration_frequency: (isInstrumentation && parseInt(calibrationFrequency)) ? parseInt(calibrationFrequency) : null
      };

      if (equipment?.id) {
        const { error } = await supabase
          .from('equipment')
          .update(payload)
          .eq('id', equipment.id);
        if (error) throw error;
        toast.success('Equipo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([payload]);
        if (error) throw error;
        toast.success('Equipo creado correctamente');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error saving equipment:', err);
      toast.error(err.message || 'Error al guardar el equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl border-zinc-100 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-cyan-900 border-b border-cyan-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Wrench className="w-24 h-24 text-white -rotate-12" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                <Wrench className="w-5 h-5 text-white" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">
                  {equipment ? 'Editar Equipo' : 'Nuevo Ingreso de Equipo'}
                </DialogTitle>
                <DialogDescription className="text-xs text-cyan-200/60 font-medium italic">
                  Mantenimiento del catálogo maestro de activos fijos.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto compact-scrollbar">
          {/* Main Info */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-cyan-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700">Información General</span>
             </div>
             <div className="space-y-2">
                <Label className="erp-label opacity-60">Nombre / Identificación</Label>
                <Input 
                  placeholder="Ej. GENERADOR ELÉCTRICO 5KW" 
                  className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 focus:bg-white transition-all uppercase" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <Label className="erp-label opacity-60">Descripción Técnica</Label>
                <Textarea 
                  placeholder="Detalles sobre el equipo, procedencia, etc." 
                  className="rounded-xl min-h-[80px] font-medium text-xs resize-none bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
             </div>
          </div>

          {/* Technical Specs */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-cyan-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700">Especificaciones Técnicas</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="erp-label opacity-60">Marca</Label>
                    <Input 
                      placeholder="CATERPILLAR, BOSCH, ETC." 
                      className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 uppercase" 
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="erp-label opacity-60">Modelo</Label>
                    <Input 
                      placeholder="EJ. XR-500" 
                      className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 uppercase" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                </div>
             </div>
             <div className="space-y-2 text-right">
                <Label className="erp-label flex items-center gap-1.5 opacity-60">
                   <Hash className="w-3 h-3" /> Número de Serie (Único)
                </Label>
                <Input 
                  placeholder="S/N: XXXXXXXX" 
                  className="rounded-xl h-11 font-black text-xs bg-zinc-50 border-zinc-200 focus:border-cyan-500 transition-all uppercase" 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
                <p className="text-[9px] text-zinc-400 font-bold italic uppercase tracking-tighter text-right">Este campo debe ser único para evitar duplicidades en el catálogo.</p>
             </div>
             <div className="space-y-4">
                <Label className="erp-label flex items-center gap-1.5 opacity-60">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Precio de Compra / Valorización (S/)
                </Label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00" 
                  className="rounded-xl h-11 font-black text-xs bg-emerald-50/30 border-emerald-100 focus:border-emerald-500 transition-all" 
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
             </div>
          </div>

          {/* Status & Categorization */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <HardHat className="w-4 h-4 text-cyan-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700">Estatus y Clasificación</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                    <Label className="erp-label opacity-60">Categoría</Label>
                    <Select value={category} onValueChange={(val) => {
                      setCategory(val);
                      setShowCustomCategory(val === 'otra');
                    }}>
                        <SelectTrigger className="rounded-xl h-11 font-bold text-[9px] uppercase bg-zinc-50 border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                            <SelectItem value="poder" className="text-[9px] font-bold uppercase py-2.5">Poder / Energía</SelectItem>
                            <SelectItem value="computo" className="text-[9px] font-bold uppercase py-2.5">Cómputo / TI</SelectItem>
                            <SelectItem value="instrumentacion" className="text-[9px] font-bold uppercase py-2.5">Instrumentación</SelectItem>
                            <SelectItem value="izaje" className="text-[9px] font-bold uppercase py-2.5">Izaje / Altura</SelectItem>
                            <SelectItem value="otra" className="text-[9px] font-bold text-cyan-600 bg-cyan-50 uppercase py-2.5">+ OTRA CATEGORÍA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="erp-label opacity-60">Estatus</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="rounded-xl h-11 font-bold text-[9px] uppercase bg-zinc-50 border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                            <SelectItem value="operativo" className="text-[9px] font-bold uppercase py-2.5 text-green-600">👍 Operativo</SelectItem>
                            <SelectItem value="en_reparacion" className="text-[9px] font-bold uppercase py-2.5 text-amber-600">🔧 Reparación</SelectItem>
                            <SelectItem value="baja" className="text-[9px] font-bold uppercase py-2.5 text-red-600">🚫 Baja</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="erp-label opacity-60">Propiedad</Label>
                    <Select value={ownership} onValueChange={setOwnership}>
                        <SelectTrigger className="rounded-xl h-11 font-bold text-[9px] uppercase bg-zinc-50 border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                            <SelectItem value="propio" className="text-[9px] font-bold uppercase py-2.5">Propio</SelectItem>
                            <SelectItem value="alquilado" className="text-[9px] font-bold uppercase py-2.5">Alquilado</SelectItem>
                            <SelectItem value="prestado" className="text-[9px] font-bold uppercase py-2.5">Prestado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>


             {showCustomCategory && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="erp-label text-cyan-700">Nueva Categoría</Label>
                  <div className="relative">
                    <Input 
                      placeholder="ESCRIBE EL NOMBRE DE LA CATEGORÍA" 
                      className="rounded-xl h-11 font-black text-xs border-cyan-200 bg-cyan-50/30 uppercase pl-10" 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                    <Plus className="w-4 h-4 text-cyan-600 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
               </div>
             )}
          </div>

          {/* Calibration Tracking - Only for Instrumentation */}
          {(category === 'instrumentacion' || customCategory.toUpperCase().includes('INSTRUMENTACION')) && (
            <div className="pt-4 border-t border-zinc-100 space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-cyan-700" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700">Seguimiento de Calibración</span>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="erp-label opacity-60">Fecha Inicio</Label>
                      <Input 
                        type="date"
                        className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200" 
                        value={calibrationStart}
                        onChange={(e) => setCalibrationStart(e.target.value)}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label className="erp-label opacity-60">Frecuencia (Meses)</Label>
                      <div className="relative">
                        <Input 
                          type="number"
                          placeholder="Ej. 12" 
                          className="rounded-xl h-11 font-bold text-xs bg-zinc-50 border-zinc-200 pl-10" 
                          value={calibrationFrequency}
                          onChange={(e) => setCalibrationFrequency(e.target.value)}
                        />
                        <RefreshCcw className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="erp-label opacity-60 flex items-center gap-2">
                     Fecha de Vencimiento 
                     <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Cálculo Automático</span>
                  </Label>
                  <Input 
                    type="date"
                    className="rounded-xl h-11 font-black text-xs bg-amber-50 border-amber-100 text-amber-900 focus:border-amber-500" 
                    value={calibrationEnd}
                    onChange={(e) => setCalibrationEnd(e.target.value)}
                  />
                  <p className="text-[9px] text-zinc-400 font-bold italic uppercase tracking-tighter">Esta fecha se define sumando la frecuencia a la fecha de inicio.</p>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-zinc-200 hover:bg-white transition-all text-zinc-500"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 h-12 rounded-xl bg-cyan-900 font-black uppercase text-[10px] tracking-widest text-white shadow-xl hover:-translate-y-0.5 active:scale-95 hover:bg-cyan-950 transition-all gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {equipment ? 'Guardar Cambios' : 'Registrar Equipo'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
