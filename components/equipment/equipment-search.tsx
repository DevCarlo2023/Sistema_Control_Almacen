'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { type Equipment } from '@/lib/types';
import { Input } from '@/components/ui/input';

interface EquipmentSearchProps {
    onSelect: (equipment: Equipment) => void;
    selected: Equipment | null;
}

export function EquipmentSearch({ onSelect, selected }: EquipmentSearchProps) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Equipment[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);

    const updatePos = () => {
        if (wrapperRef.current) {
            const r = wrapperRef.current.getBoundingClientRect();
            setDropdownPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
        }
    };

    const searchEquipment = useCallback(async (query: string) => {
        if (query.length < 1) { setResults([]); setShowResults(false); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('equipment')
                .select('*')
                .or(`name.ilike.%${query}%,serial_number.ilike.%${query}%`)
                .limit(30);
            if (error) throw error;
            setResults(data || []);
            setShowResults(true);
        } catch (err) { console.error(err); setResults([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => searchEquipment(search), 300);
        return () => clearTimeout(t);
    }, [search, searchEquipment]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowResults(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (eq: Equipment) => {
        onSelect(eq);
        setSearch('');
        setResults([]);
        setShowResults(false);
    };

    const statusColor = (s: string) => s === 'operativo' ? '#16a34a' : s === 'en_reparacion' ? '#d97706' : '#dc2626';

    const dropdown = showResults && results.length > 0 ? (
        <div style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: 360, overflowY: 'auto' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb' }}>{results.length} equipo{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ padding: 6 }}>
                {results.map(eq => (
                    <button key={eq.id} type="button"
                        onMouseDown={e => { e.preventDefault(); handleSelect(eq); }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'block' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: eq.current_location === 'campo' ? '#fef2f2' : '#f0fdf4', color: eq.current_location === 'campo' ? '#dc2626' : '#16a34a', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', border: `1px solid ${eq.current_location === 'campo' ? '#fca5a5' : '#86efac'}` }}>
                                    {eq.current_location === 'campo' ? '🚧 Campo' : '🏭 Almacén'}
                                </span>
                                <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: statusColor(eq.status) + '20', color: statusColor(eq.status), padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{eq.status}</span>
                            </div>
                        </div>
                        {eq.serial_number && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>S/N: <strong>{eq.serial_number}</strong></div>}
                        {eq.brand && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>📦 {eq.brand} {eq.model}</div>}
                    </button>
                ))}
            </div>
        </div>
    ) : null;

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                type="text"
                placeholder="Buscar por nombre o N° de serie..."
                className="h-12 bg-white border-border rounded-xl font-bold shadow-sm"
                value={search}
                onChange={e => { setSearch(e.target.value); updatePos(); }}
                onFocus={() => { updatePos(); if (search.length > 0) setShowResults(true); }}
            />
            {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /></div>}
            {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
        </div>
    );
}
