'use client';

import { useState, useRef, ReactNode } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  DownloadCloud, 
  RotateCcw, 
  X, 
  Database,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VibeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  onFileSelect: (file: File) => void;
  onDownloadTemplate: () => void;
  onRevertLastImport?: () => void;
  revertCount?: number;
  loading?: boolean;
  previewContent?: ReactNode;
  onConfirm?: () => void;
  canConfirm?: boolean;
}

export function VibeUploadModal({
  open,
  onOpenChange,
  title,
  subtitle,
  onFileSelect,
  onDownloadTemplate,
  onRevertLastImport,
  revertCount = 0,
  loading = false,
  previewContent,
  onConfirm,
  canConfirm = false
}: VibeUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover') setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const closeModal = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && handleOpenChange(v)}>
      <DialogContent showCloseButton={false} className="sm:max-w-[650px] p-0 border-none overflow-hidden bg-white shadow-2xl rounded-[32px]">
        {/* Header */}
        <DialogHeader className="bg-indigo-600 p-8 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <UploadCloud className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                {title}
              </DialogTitle>
              <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                {subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={closeModal}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-8">
          {!previewContent ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Dropzone */}
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-[24px] p-12 transition-all cursor-pointer flex flex-col items-center justify-center group",
                  isDragging 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-3xl mb-4 flex items-center justify-center transition-all",
                  isDragging ? "bg-indigo-500 text-white" : "bg-zinc-50 text-zinc-300 group-hover:bg-indigo-100 group-hover:text-indigo-500"
                )}>
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <p className="text-lg font-black text-zinc-900 uppercase tracking-tight">Selecciona un archivo</p>
                <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wider text-center max-w-[300px]">
                  Soporta .XLSX (Recomendado) o .CSV
                </p>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={onDownloadTemplate}
                className="w-full h-14 flex items-center justify-center px-6 rounded-[20px] bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all gap-3 group"
              >
                <DownloadCloud className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-900">Descargar Plantilla Base</span>
              </button>

              {onRevertLastImport && (
                <button 
                  onClick={onRevertLastImport}
                  disabled={revertCount === 0 || loading}
                  className={cn(
                    "w-full h-14 flex items-center justify-center px-6 rounded-[20px] transition-all gap-3 border",
                    revertCount > 0 
                      ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100 active:scale-95" 
                      : "bg-zinc-50/50 border-zinc-100 text-zinc-300 opacity-50 cursor-not-allowed"
                  )}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    Revertir Última Carga Masiva {revertCount > 0 ? `(${revertCount})` : ''}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              {previewContent}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="bg-zinc-50/50 p-6 px-8 border-t border-zinc-100 flex items-center sm:justify-between flex-row-reverse gap-4">
          <Button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className={cn(
              "flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all gap-2",
              canConfirm && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5 active:translate-y-0"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirmar Carga
          </Button>
          <Button
            variant="ghost"
            onClick={closeModal}
            disabled={loading}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900"
          >
            Cancelar
          </Button>
        </DialogFooter>

        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange}
        />
      </DialogContent>
    </Dialog>
  );

  function handleOpenChange(v: boolean) {
    if (!v) closeModal();
    else onOpenChange(v);
  }
}

function CheckCircle2(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
