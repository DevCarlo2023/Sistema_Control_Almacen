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

import { getWarehouseColor } from '@/lib/warehouse-config';

interface WarehouseSelectorProps {
  value: string;
  onWarehouseChange: (warehouseId: string) => void;
}

export function WarehouseSelector({ value, onWarehouseChange }: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedWarehouse = warehouses.find(w => w.id === value);
  const selectedColor = getWarehouseColor(selectedWarehouse?.location || selectedWarehouse?.name);

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
        <SelectTrigger className={`h-12 border-border/50 rounded-xl font-bold transition-all ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} border-2`}>
          <div className="flex items-center gap-2 overflow-hidden">
            {value && <div className={`w-2 h-2 rounded-full shrink-0 ${selectedColor.dot}`} />}
            <SelectValue placeholder={loading ? 'Sincronizando...' : 'Selecciona un almacén'} />
          </div>
        </SelectTrigger>
        <SelectContent
          className="bg-white dark:bg-slate-950 border-border shadow-2xl rounded-xl z-[100]"
          style={{ backgroundColor: 'white', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        >
          {warehouses.map((warehouse) => {
            const color = getWarehouseColor(warehouse.location || warehouse.name);
            return (
              <SelectItem key={warehouse.id} value={warehouse.id} className="font-semibold py-3 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                  <div className="flex flex-col">
                    <span className="uppercase text-xs leading-none">{warehouse.name}</span>
                    <span className={`text-[9px] uppercase mt-0.5 opacity-70 font-black tracking-widest ${color.text}`}>📍 {warehouse.location}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
