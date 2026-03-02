-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_of_measure VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table (current stock levels)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warehouse_id, material_id)
);

-- Create inventory movements table (audit trail)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('ENTRADA', 'SALIDA')),
  quantity NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_material ON inventory_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_movements_user ON inventory_movements(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read all data
CREATE POLICY "Authenticated users can read warehouses" 
ON warehouses FOR SELECT 
USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated users can read materials" 
ON materials FOR SELECT 
USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated users can read inventory" 
ON inventory FOR SELECT 
USING (auth.role() = 'authenticated_user');

CREATE POLICY "Authenticated users can read movements" 
ON inventory_movements FOR SELECT 
USING (auth.role() = 'authenticated_user');

-- Allow authenticated users to insert movements
CREATE POLICY "Authenticated users can insert movements" 
ON inventory_movements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated_user' AND user_id = auth.uid());

-- Insert sample warehouses
INSERT INTO warehouses (name, description) VALUES
('Almacén 1', 'Almacén principal de distribución'),
('Almacén 2', 'Almacén secundario de respaldo'),
('Almacén 3', 'Almacén de productos terminados')
ON CONFLICT (name) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (name, description, unit_of_measure, location) VALUES
('Acero Inoxidable', 'Planchas de acero inoxidable 2mm', 'kg', 'Sector A-1'),
('Aluminio', 'Perfiles de aluminio variados', 'piezas', 'Sector B-2'),
('Cobre', 'Tuberías de cobre diámetro 10mm', 'metros', 'Sector C-1'),
('Plástico PVC', 'Tuberías PVC para agua', 'metros', 'Sector D-3'),
('Tornillería', 'Tornillos y pernos variados', 'kg', 'Sector A-4')
ON CONFLICT DO NOTHING;
