'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Warehouse } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WarehouseSelectorProps {
  value: string;
  onWarehouseChange: (warehouseId: string) => void;
}

export function WarehouseSelector({ value, onWarehouseChange }: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('*')
          .order('name');

        if (error) throw error;
        setWarehouses(data || []);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  return (
    <div>
      <Select value={value} onValueChange={onWarehouseChange} disabled={loading}>
        <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-border/50 rounded-xl font-bold transition-all hover:bg-white/90">
          <SelectValue placeholder={loading ? 'Sincronizando...' : 'Selecciona un almacén'} />
        </SelectTrigger>
        <SelectContent
          className="bg-white dark:bg-slate-950 border-border shadow-2xl rounded-xl z-[100]"
          style={{ backgroundColor: 'white', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id} className="font-semibold py-3 transition-colors">
              <span className="uppercase">{warehouse.name}</span> <span className="text-[10px] text-muted-foreground uppercase ml-2 opacity-60">📍 {warehouse.location}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
