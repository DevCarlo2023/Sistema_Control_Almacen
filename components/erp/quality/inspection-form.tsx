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
    getMaterialsForSelect()
      .then(setMaterials)
      .finally(() => setLoadingMaterials(false));
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
        toast.success('✅ Inspección guardada exitosamente', {
          description: `${values.material_name} — CONFORME`,
          duration: 4000,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Left Column: Material Data ── */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4" />
              Datos de Recepción
            </h3>

            {/* Material selector */}
            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    Material
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
                      <SelectTrigger className="rounded-xl border-white/10 bg-white/[0.04] h-12 text-sm">
                        <SelectValue
                          placeholder={loadingMaterials ? 'Cargando materiales...' : 'Seleccionar Material'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-white/10 bg-[#0d1117]/95 backdrop-blur-xl">
                      {materials.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id} className="text-white hover:bg-white/5">
                          <span className="font-mono text-[10px] text-blue-400 mr-2">{mat.code}</span>
                          {mat.name}
                        </SelectItem>
                      ))}
                      {materials.length === 0 && !loadingMaterials && (
                        <div className="px-3 py-4 text-xs text-gray-500 text-center">
                          No hay materiales registrados
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manual material name (fallback if no dropdown match) */}
            <FormField
              control={form.control}
              name="material_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    Nombre de Material <span className="text-gray-600 normal-case font-normal">(o escriba manualmente)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Casco Dieléctrico Tipo I..."
                      className="rounded-xl border-white/10 bg-white/[0.04] h-12 text-sm placeholder:text-gray-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Batch number */}
            <FormField
              control={form.control}
              name="batch_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    N° de Lote / Serie
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: LT-2024-0045"
                      className="rounded-xl border-white/10 bg-white/[0.04] h-12 text-sm font-mono placeholder:text-gray-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    Resultado de Cumplimiento
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange('pass')}
                      className={cn(
                        'h-16 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border',
                        field.value === 'pass'
                          ? 'bg-green-500/15 text-green-400 border-green-500/40 shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]'
                          : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      CONFORME
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('fail')}
                      className={cn(
                        'h-16 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border',
                        field.value === 'fail'
                          ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]'
                          : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      RECHAZADO
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ── Right Column: Findings & Signature ── */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Hallazgos y Firma Digital
            </h3>

            {/* Notes / observations */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    Observaciones Técnicas
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Describa el estado del material, hallazgos visuales, mediciones, no conformidades encontradas..."
                      className="rounded-xl border-white/10 bg-white/[0.04] text-sm resize-none placeholder:text-gray-600 leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Signature */}
            <FormField
              control={form.control}
              name="signature_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    Firma Digital del Inspector
                  </FormLabel>
                  <FormControl>
                    <SignaturePad
                      onSave={(dataUrl) => {
                        field.onChange(dataUrl);
                        toast.info('Firma capturada', { duration: 2000 });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="pt-4 border-t border-white/5">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all duration-300 text-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando Inspección...</>
            ) : (
              'Finalizar y Registrar Inspección'
            )}
          </Button>
          {form.formState.errors.signature_url && (
            <p className="text-center text-xs text-red-400 mt-3 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {form.formState.errors.signature_url.message}
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}
