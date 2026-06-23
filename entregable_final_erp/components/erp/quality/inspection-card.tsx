'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Package,
  Hash,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QualityInspection } from '@/lib/quality-service';

const STATUS_CONFIG = {
  pass: {
    label: 'CONFORME',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    iconClass: 'text-green-600',
    borderClass: 'border-l-green-500',
  },
  fail: {
    label: 'RECHAZADO',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    iconClass: 'text-red-600',
    borderClass: 'border-l-red-500',
  },
  pending: {
    label: 'PENDIENTE',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    iconClass: 'text-amber-600',
    borderClass: 'border-l-amber-500',
  },
};

interface InspectionCardProps {
  inspection: QualityInspection;
  className?: string;
}

export function InspectionCard({ inspection, className }: InspectionCardProps) {
  const config = STATUS_CONFIG[inspection.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const formattedDate = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(inspection.created_at));

  return (
    <Card
      className={cn(
        'relative overflow-hidden group transition-all duration-300',
        'border border-slate-100 bg-white hover:bg-slate-50/50',
        'hover:shadow-xl hover:shadow-slate-200/60',
        'border-l-4 rounded-3xl',
        config.borderClass,
        className
      )}
    >
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className={cn(
              'rounded-xl px-3 h-7 flex items-center gap-2 font-black text-[9px] tracking-widest uppercase border',
              config.badgeClass
            )}
          >
            <StatusIcon className={cn("w-3.5 h-3.5", config.iconClass)} />
            {config.label}
          </Badge>
          <span className="text-[9px] font-black text-slate-300 pt-1 tracking-tighter">
            #{inspection.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Material name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-black text-slate-900 text-base leading-tight uppercase tracking-tight">{inspection.material_name}</span>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          {inspection.batch_number && (
            <div className="space-y-1">
              <p className="text-[8px] uppercase text-slate-400 font-black tracking-[0.2em] flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Lote
              </p>
              <p className="text-[10px] font-black text-slate-700 tracking-wider">L-{inspection.batch_number}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[8px] uppercase text-slate-400 font-black tracking-[0.2em] flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Fecha
            </p>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{formattedDate}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-[8px] uppercase text-slate-400 font-black tracking-[0.2em] flex items-center gap-1.5">
              <User className="w-3 h-3" /> Auditor Técnico
            </p>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{inspection.inspector_name}</p>
          </div>
        </div>

        {/* Notes */}
        {inspection.notes && (
          <div className="pt-4 border-t border-slate-50">
            <p className="text-[8px] uppercase text-slate-400 font-black tracking-[0.2em] flex items-center gap-1.5 mb-2">
              <FileText className="w-3 h-3" /> Observaciones
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-3">
              "{inspection.notes}"
            </p>
          </div>
        )}

        {/* Footer */}
        {inspection.signature_url && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Firma Digital Validada</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 cursor-pointer hover:text-blue-700 transition-colors group/link uppercase tracking-tighter">
              <span>Auditoría</span>
              <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
