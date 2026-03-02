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
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        maxHeight: '360px',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: '#ffffff' }}>
        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb' }}>
          {results.length} Resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ padding: '6px' }}>
        {results.map((material) => (
          <button
            key={material.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // prevent blur before click
              handleSelectMaterial(material);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {material.name}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>
                {material.unit_of_measure}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              {material.description}
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
