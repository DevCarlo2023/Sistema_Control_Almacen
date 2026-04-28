'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { type Material, type Equipment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Wrench, X, Loader2, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UnifiedAsset = {
  id: string;
  name: string;
  type: 'material' | 'equipment';
  subtitle?: string; // S/N or Description
  extra?: string; // Brand or Category
};

interface UnifiedAssetSearchProps {
  onSelect: (asset: UnifiedAsset | null) => void;
  selectedAsset: UnifiedAsset | null;
}

export function UnifiedAssetSearch({ onSelect, selectedAsset }: UnifiedAssetSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UnifiedAsset[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
  };

  const searchAssets = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      // Parallel search
      const [materialsRes, equipmentRes] = await Promise.all([
        supabase
          .from('materials')
          .select('id, name, description')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('equipment')
          .select('id, name, serial_number, brand')
          .or(`name.ilike.%${query}%,serial_number.ilike.%${query}%`)
          .limit(10)
      ]);

      const mats: UnifiedAsset[] = (materialsRes.data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        type: 'material',
        subtitle: m.description,
      }));

      const eqs: UnifiedAsset[] = (equipmentRes.data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        type: 'equipment',
        subtitle: `S/N: ${e.serial_number || 'S/S'}`,
        extra: e.brand,
      }));

      setResults([...mats, ...eqs]);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching assets:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedAsset) searchAssets(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, searchAssets, selectedAsset]);

  // Handle outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (asset: UnifiedAsset) => {
    onSelect(asset);
    setSearch('');
    setResults([]);
    setShowResults(false);
  };

  const dropdown = showResults && results.length > 0 ? (
    <div
      className="bg-white dark:bg-zinc-950 border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 rounded-2xl"
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
        maxHeight: '450px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between sticky top-0 z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          {results.length} ACTIVOS ENCONTRADOS
        </span>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>
      <div className="p-2 overflow-y-auto compact-scrollbar bg-white dark:bg-zinc-950">
        {results.map((asset) => (
          <button
            key={`${asset.type}-${asset.id}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(asset);
            }}
            className="w-full text-left p-3.5 rounded-xl transition-all duration-200 hover:bg-zinc-50 group mb-1 last:mb-0 border border-transparent hover:border-zinc-100 flex items-center gap-4"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
              asset.type === 'material' ? "bg-primary/10 text-primary" : "bg-cyan-100 text-cyan-800"
            )}>
              {asset.type === 'material' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-xs uppercase text-zinc-900 truncate group-hover:text-primary transition-colors">
                    {asset.name}
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                    asset.type === 'material' ? "bg-primary/5 text-primary border-primary/20" : "bg-cyan-50 text-cyan-700 border-cyan-200"
                  )}>
                    {asset.type === 'material' ? 'Material' : 'Equipo'}
                  </span>
               </div>
               <p className="text-[10px] text-zinc-400 font-medium italic truncate">
                 {asset.subtitle || 'Sin detalles adicionales'}
               </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative w-full max-w-xl mx-auto" ref={wrapperRef}>
      {!selectedAsset ? (
        <div className="relative group">
          <FileSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar materiales o equipos por nombre, serie o código..."
            className="pl-12 h-14 rounded-full bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 font-bold text-sm w-full focus:border-primary focus:bg-white transition-all pr-14"
            value={search}
            onChange={(e) => { setSearch(e.target.value); updatePos(); }}
            onFocus={() => { updatePos(); if (search.length >= 2) setShowResults(true); }}
          />
          {loading && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 sm:p-3 bg-zinc-950 rounded-full border border-zinc-800 shadow-2xl flex items-center gap-4 animate-in zoom-in-95">
          <div className={cn(
             "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
             selectedAsset.type === 'material' ? "bg-primary/20 text-primary" : "bg-cyan-500/20 text-cyan-400"
          )}>
            {selectedAsset.type === 'material' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase text-white truncate tracking-tight">{selectedAsset.name}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                  selectedAsset.type === 'material' ? "bg-primary text-white" : "bg-cyan-600 text-white"
                )}>
                  {selectedAsset.type === 'material' ? 'Material' : 'Equipo'}
                </span>
             </div>
             <p className="text-[9px] text-zinc-400 font-medium truncate italic">{selectedAsset.subtitle}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 mr-1"
            onClick={() => onSelect(null)}
          >
            <X className="w-5 h-5 transition-transform active:scale-90" />
          </Button>
        </div>
      )}
      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
