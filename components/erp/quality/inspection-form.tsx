'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Package,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignaturePad } from './signature-pad';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  createInspection,
  getMaterialsForSelect,
  type CreateInspectionPayload,
} from '@/lib/quality-service';

// ─── Schema ───────────────────────────────────────────────────────────────────

const inspectionSchema = z.object({
  material_name: z.string().min(1, 'Seleccione o ingrese un material'),
  material_id: z.string().optional(),
  status: z.enum(['pass', 'fail'], {
    required_error: 'Defina el estado de cumplimiento',
  }),
  batch_number: z.string().optional(),
  notes: z.string().min(5, 'Añada una descripción del hallazgo (mín. 5 caracteres)'),
  signature_url: z.string().min(1, 'La firma digital es obligatoria'),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface InspectionFormProps {
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InspectionForm({ onSuccess }: InspectionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [materials, setMaterials] = React.useState<{ id: string; name: string; code: string }[]>([]);
  const [loadingMaterials, setLoadingMaterials] = React.useState(true);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      status: 'pass',
      notes: '',
      signature_url: '',
      batch_number: '',
      material_name: '',
    },
  });

  // Load materials on mount
  React.useEffect(() => {
    let isMounted = true;
    getMaterialsForSelect()
      .then((data) => {
        if (isMounted) setMaterials(data);
      })
      .finally(() => {
        if (isMounted) setLoadingMaterials(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (values: InspectionFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateInspectionPayload = {
        material_name: values.material_name,
        material_id: values.material_id || undefined,
        status: values.status,
        batch_number: values.batch_number || undefined,
        notes: values.notes,
        signature_url: values.signature_url,
      };

      await createInspection(payload);

      if (values.status === 'fail') {
        toast.warning('⚠️ Material RECHAZADO — Alerta registrada', {
          description: `Lote: ${values.batch_number || 'N/A'} | ${values.material_name}`,
          duration: 6000,
        });
      } else {
        toast.success('✅ Inspección CONFORME', {
          description: values.material_name,
        });
      }

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error('Error al guardar la inspección', {
        description: error?.message || 'Intente de nuevo',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* ── Left Column: Material Data ── */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Datos de Recepción
              </h3>
            </div>

            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                    Material Vinculado
                  </FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      const mat = materials.find(m => m.id === val);
                      if (mat) form.setValue('material_name', mat.name);
                    }}
                    value={field.value}
                    disabled={loadingMaterials}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50/50 h-14 text-sm font-bold text-slate-900 focus:ring-blue-500 shadow-sm transition-all hover:bg-white">
                        <SelectValue
                          placeholder={loadingMaterials ? 'Consultando base de datos...' : 'Seleccionar Material Maestro'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-slate-100 bg-white rounded-2xl shadow-2xl">
                      {materials.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id} className="text-slate-700 hover:bg-blue-50 font-bold text-xs py-3 rounded-xl mx-1">
                          <span className="font-black text-[9px] text-blue-600 mr-3 px-2 py-1 bg-blue-50 rounded-md tracking-tighter">{mat.code}</span>
                          {mat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="material_name"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                    Descripción Técnica <span className="text-slate-300 normal-case font-bold italic ml-2">(Edición manual permitida)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Casco Dieléctrico Tipo I MSA..."
                      className="rounded-2xl border-slate-200 bg-slate-50/50 h-14 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-blue-500 shadow-sm transition-all hover:bg-white px-5"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                      N° de Lote / Serie
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: LT-2024-01"
                        className="rounded-2xl border-slate-200 bg-slate-50/50 h-14 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:ring-blue-500 shadow-sm transition-all hover:bg-white px-5 tracking-widest"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                      Dictamen Final
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-3 h-14">
                      <button
                        type="button"
                        onClick={() => field.onChange('pass')}
                        className={cn(
                          'rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm',
                          field.value === 'pass'
                            ? 'bg-green-600 text-white border-green-700 shadow-green-200 lg:scale-105'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Pasa
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('fail')}
                        className={cn(
                          'rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm',
                          field.value === 'fail'
                            ? 'bg-red-600 text-white border-red-700 shadow-red-200 lg:scale-105'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <XCircle className="w-3 h-3" />
                        Falla
                      </button>
                    </div>
                    <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Right Column: Findings & Signature ── */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Hallazgos y Validación
              </h3>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                    Memorándum Técnico / Observaciones
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Describa el estado visual, dimensional o funcional del material..."
                      className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-blue-500 shadow-sm transition-all hover:bg-white p-5 resize-none leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signature_url"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase text-slate-500 font-black tracking-widest pl-1">
                    Firma Autógrafa del Auditor
                  </FormLabel>
                  <FormControl>
                    <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 p-1 group hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-500 overflow-hidden shadow-inner">
                      <SignaturePad
                        onSave={(dataUrl) => {
                          field.onChange(dataUrl);
                          toast.info('Validación capturada', { duration: 2000 });
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-black uppercase text-red-500 pl-1" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="pt-10 border-t border-slate-100">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/10 transition-all duration-500 text-[11px]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Procesando Registro...</>
            ) : (
              'Finalizar Auditoría de Calidad'
            )}
          </Button>
          {form.formState.errors.signature_url && (
            <p className="text-center text-[10px] font-black uppercase text-red-400 mt-4 flex items-center justify-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {form.formState.errors.signature_url.message}
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}
