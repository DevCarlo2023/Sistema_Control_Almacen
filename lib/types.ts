export interface Warehouse {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  unit_of_measure: string;
  location: string;
  unit_price?: number;
  is_used?: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  material_id: string;
  quantity: number;
  updated_at: string;
  warehouse?: Warehouse;
  material?: Material;
}

export interface InventoryMovement {
  id: string;
  warehouse_id: string;
  material_id: string;
  movement_type: 'entrada' | 'salida';
  quantity: number;
  notes?: string;
  created_at: string;
  user_id: string;
  warehouse?: Warehouse;
  material?: Material;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  serial_number?: string;
  brand?: string;
  model?: string;
  status: 'operativo' | 'en_reparacion' | 'baja';
  category: 'poder' | 'computo' | 'instrumentacion';
  current_location: 'almacen' | 'campo';
  location?: string;
  unit_price?: number;
  warehouse_id?: string;
  warehouse?: Warehouse;
  calibration_start?: string;
  calibration_end?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  worker_number?: string;
  dni?: string;
  full_name: string;
  position?: string;
  created_at: string;
}

export interface EquipmentMovement {
  id: string;
  equipment_id: string;
  movement_type: 'ingreso' | 'egreso';
  worker_id?: string;
  area?: string;
  observations?: string;
  warehouse_id?: string;
  created_at: string;
  user_id?: string;
  equipment?: Equipment;
  worker?: Worker;
  warehouse?: Warehouse;
}
