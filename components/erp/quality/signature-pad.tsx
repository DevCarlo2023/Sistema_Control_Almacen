'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SignaturePad({ onSave, className }: { onSave: (dataUrl: string) => void; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasContent, setHasContent] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 200;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    setHasContent(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasContent(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative rounded-2xl overflow-hidden glass border-white/10 bg-black/40">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair h-[200px]"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={() => setIsDrawing(false)}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">
            Firme Aquí
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={clear} className="text-gray-400 hover:text-white rounded-xl h-10 border-white/5">
          <RotateCcw className="w-4 h-4 mr-2" /> Limpiar
        </Button>
        <Button size="sm" disabled={!hasContent} onClick={() => onSave(canvasRef.current!.toDataURL())} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 shadow-lg shadow-blue-500/20 px-6 font-bold uppercase text-[10px]">
          <Check className="w-4 h-4 mr-2" /> Guardar Firma
        </Button>
      </div>
    </div>
  );
}
