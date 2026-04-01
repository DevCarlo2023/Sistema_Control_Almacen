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
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/25',
    glowClass: 'bg-green-500',
    borderClass: 'border-l-green-500/50',
  },
  fail: {
    label: 'RECHAZADO',
    icon: XCircle,
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/25',
    glowClass: 'bg-red-500',
    borderClass: 'border-l-red-500/50',
  },
  pending: {
    label: 'PENDIENTE',
    icon: Clock,
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
    glowClass: 'bg-yellow-500',
    borderClass: 'border-l-yellow-500/50',
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
        'border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]',
        'hover:border-white/10 hover:shadow-xl hover:shadow-black/30',
        'border-l-2',
        config.borderClass,
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className={cn(
          'absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-10 transition-opacity duration-300 group-hover:opacity-20',
          config.glowClass
        )}
      />

      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Badge
            className={cn(
              'rounded-full px-3 h-7 flex items-center gap-1.5 font-bold text-[10px] tracking-widest uppercase border',
              config.badgeClass
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </Badge>
          <span className="text-[9px] font-mono text-gray-600 pt-1">
            #{inspection.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Material name */}
        <div className="flex items-center gap-2.5">
          <Package className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-bold text-white text-sm leading-tight">{inspection.material_name}</span>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {inspection.batch_number && (
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase text-gray-600 font-bold tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3" /> Lote
              </p>
              <p className="text-xs font-mono text-gray-300">{inspection.batch_number}</p>
            </div>
          )}
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase text-gray-600 font-bold tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Fecha
            </p>
            <p className="text-xs text-gray-300">{formattedDate}</p>
          </div>
          <div className="space-y-0.5 col-span-2">
            <p className="text-[9px] uppercase text-gray-600 font-bold tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Inspector
            </p>
            <p className="text-xs font-semibold text-gray-200">{inspection.inspector_name}</p>
          </div>
        </div>

        {/* Notes */}
        {inspection.notes && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[9px] uppercase text-gray-600 font-bold tracking-wider flex items-center gap-1 mb-1.5">
              <FileText className="w-3 h-3" /> Observaciones
            </p>
            <p className="text-xs text-gray-400 italic leading-relaxed line-clamp-3">
              "{inspection.notes}"
            </p>
          </div>
        )}

        {/* Footer */}
        {inspection.signature_url && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Firmado digitalmente</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors group/link">
              <span>Ver detalles</span>
              <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
