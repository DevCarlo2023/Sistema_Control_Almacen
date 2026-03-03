'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { type Worker } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WorkerSelectorProps {
    onSelect: (worker: Worker) => void;
    selected: Worker | null;
    onClear: () => void;
}

export function WorkerSelector({ onSelect, selected, onClear }: WorkerSelectorProps) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Worker[]>([]);
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

    const searchWorkers = useCallback(async (query: string) => {
        if (query.length < 1) { setResults([]); setShowResults(false); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .or(`full_name.ilike.%${query}%,dni.ilike.%${query}%,worker_number.ilike.%${query}%`)
                .limit(20);
            if (error) throw error;
            setResults(data || []);
            setShowResults(true);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => searchWorkers(search), 300);
        return () => clearTimeout(t);
    }, [search, searchWorkers]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowResults(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (w: Worker) => {
        onSelect(w);
        setSearch('');
        setResults([]);
        setShowResults(false);
    };

    if (selected) {
        return (
            <div className="flex items-center justify-between h-12 px-4 rounded-xl border border-border bg-green-50 border-green-200">
                <div>
                    <div className="font-black text-sm text-green-800 uppercase">{selected.full_name}</div>
                    <div className="text-[10px] text-green-600 font-bold">{selected.position} {selected.dni ? `· DNI ${selected.dni}` : ''}</div>
                </div>
                <button type="button" onClick={onClear} className="text-green-600 hover:text-red-500 font-black text-xs transition-colors">✕</button>
            </div>
        );
    }

    const dropdown = showResults && results.length > 0 ? (
        <div style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: 300, overflowY: 'auto' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb' }}>{results.length} trabajador{results.length !== 1 ? 'es' : ''}</span>
            </div>
            <div style={{ padding: 6 }}>
                {results.map(w => (
                    <button key={w.id} type="button"
                        onMouseDown={e => { e.preventDefault(); handleSelect(w); }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'block' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div style={{ fontWeight: 900, fontSize: 13, color: '#0f172a' }}>{w.full_name}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                            {w.position && <span>{w.position}</span>}
                            {w.dni && <span> · DNI {w.dni}</span>}
                            {w.worker_number && <span> · #{w.worker_number}</span>}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    ) : null;

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        type="text"
                        placeholder="Buscar por nombre, DNI o N° trabajador..."
                        className="h-12 bg-white border-border rounded-xl font-bold shadow-sm pr-10"
                        value={search}
                        onChange={e => { setSearch(e.target.value); updatePos(); }}
                        onFocus={() => { updatePos(); if (search.length > 0) setShowResults(true); }}
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(''); setResults([]); setShowResults(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <Button
                    onClick={() => searchWorkers(search)}
                    className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Buscar
                </Button>
            </div>
            {loading && <div className="absolute right-16 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /></div>}
            {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
        </div>
    );
}
