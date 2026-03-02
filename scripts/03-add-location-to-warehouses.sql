-- Add location column to warehouses table if it doesn't exist
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Update existing warehouses with default locations
UPDATE warehouses SET location = 'Zona Industrial A' WHERE name = 'Almacén 1' AND location IS NULL;
UPDATE warehouses SET location = 'Zona Comercial B' WHERE name = 'Almacén 2' AND location IS NULL;
UPDATE warehouses SET location = 'Centro de Distribución' WHERE name = 'Almacén 3' AND location IS NULL;
