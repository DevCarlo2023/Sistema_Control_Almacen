'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { type Material } from '@/lib/types';
import { Input } from '@/components/ui/input';

interface MaterialSearchProps {
  onSelectMaterial: (material: Material) => void;
  selectedMaterial: Material | null;
}

export function MaterialSearch({ onSelectMaterial, selectedMaterial }: MaterialSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Material[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const updateDropdownPos = () => {
    if (inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const searchMaterials = useCallback(async (query: string) => {
    if (query.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(50);

      if (error) throw error;
      setResults(data || []);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching materials:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMaterials(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchMaterials]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMaterial = (material: Material) => {
    onSelectMaterial(material);
    setSearch('');
    setResults([]);
    setShowResults(false);
  };

  const handleFocus = () => {
    updateDropdownPos();
    if (search.length > 0) setShowResults(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    updateDropdownPos();
  };

  const dropdown = showResults && results.length > 0 ? (
    <div
      className="glass-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
          {results.length} RESULTADO{results.length !== 1 ? 'S' : ''} ENCONTRADO{results.length !== 1 ? 'S' : ''}
        </span>
        <button
          onClick={() => setShowResults(false)}
          className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground md:hidden"
        >
          Cerrar
        </button>
      </div>
      <div className="p-1.5 overflow-y-auto compact-scrollbar bg-card/50">
        {results.map((material) => (
          <button
            key={material.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectMaterial(material);
            }}
            className="w-full text-left p-3 rounded-xl transition-all duration-200 hover:bg-primary/10 group mb-1 last:mb-0 border border-transparent hover:border-primary/20"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="font-black text-[13px] uppercase text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                  {material.name}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium italic truncate">
                  {material.description || 'Sin descripción disponible'}
                </div>
              </div>
              <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase shrink-0 border border-primary/20">
                {material.unit_of_measure}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" ref={inputWrapperRef}>
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Escribe el código o el nombre..."
          className="h-12 bg-white dark:bg-slate-900 border-border rounded-xl font-bold pr-10 shadow-sm"
          value={search}
          onChange={handleChange}
          onFocus={handleFocus}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
