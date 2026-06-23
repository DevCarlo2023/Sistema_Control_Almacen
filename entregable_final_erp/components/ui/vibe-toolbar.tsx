'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  FileDown, 
  FileText, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  RotateCcw, 
  Trash,
  Loader2
} from 'lucide-react';

export type VibeActionType = 
  | 'optimizar' 
  | 'exportar' 
  | 'plantilla' 
  | 'importar' 
  | 'excel' 
  | 'eliminar' 
  | 'revertir' 
  | 'vaciar';

interface ToolbarAction {
  type: VibeActionType;
  label?: string;
  onClick: () => void;
  count?: number;
  loading?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

interface VibeToolbarProps {
  actions: ToolbarAction[];
  className?: string;
}

const ACTION_CONFIG: Record<VibeActionType, { 
  icon: any, 
  baseClass: string, 
  defaultLabel: string 
}> = {
  optimizar: {
    icon: Sparkles,
    baseClass: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-amber-100/50',
    defaultLabel: 'Optimizar'
  },
  exportar: {
    icon: FileDown,
    baseClass: 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-zinc-100',
    defaultLabel: 'Exportar'
  },
  plantilla: {
    icon: FileText,
    baseClass: 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-zinc-100',
    defaultLabel: 'Plantilla'
  },
  importar: {
    icon: Upload,
    baseClass: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-blue-100/50',
    defaultLabel: 'Carga Masiva'
  },
  excel: {
    icon: FileSpreadsheet,
    baseClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-emerald-100/50',
    defaultLabel: 'Excel'
  },
  eliminar: {
    icon: Trash2,
    baseClass: 'bg-red-600 border-red-600 text-white hover:bg-red-700 shadow-red-200',
    defaultLabel: 'Eliminar'
  },
  revertir: {
    icon: RotateCcw,
    baseClass: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 shadow-orange-100/50',
    defaultLabel: 'Revertir'
  },
  vaciar: {
    icon: Trash,
    baseClass: 'bg-white border-red-200 text-red-600 hover:bg-red-50 shadow-red-50',
    defaultLabel: 'Vaciar'
  }
};

export function VibeToolbar({ actions, className }: VibeToolbarProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-3 p-2 bg-white/40 backdrop-blur-sm rounded-3xl border border-zinc-200/60 shadow-sm",
      className
    )}>
      {actions.map((action, idx) => {
        if (action.hidden) return null;
        
        const config = ACTION_CONFIG[action.type];
        const Icon = config.icon;
        
        return (
          <React.Fragment key={idx}>
            {/* Divider logic: add subtle line between certain groups if needed, 
                but for now we'll just use the gap */}
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className={cn(
                "h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2 border shadow-sm",
                config.baseClass,
                action.loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {action.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className={cn("w-3.5 h-3.5", action.type === 'eliminar' ? 'text-white' : '')} />
              )}
              <span>
                {action.label || config.defaultLabel}
                {action.count !== undefined && action.count > 0 && (
                  <span className="ml-1 opacity-70">({action.count})</span>
                )}
              </span>
            </Button>
            
            {/* Visual separator for groups (e.g., after 'Exportar' or 'Importar') */}
            {(action.type === 'exportar' || action.type === 'importar') && idx < actions.length - 1 && (
              <div className="h-6 w-px bg-zinc-200/80 mx-1 hidden md:block" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
