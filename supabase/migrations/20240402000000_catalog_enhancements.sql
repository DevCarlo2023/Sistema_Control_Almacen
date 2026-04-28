-- Migración: Mejoras para el Catálogo Maestro
-- Objetivo: Añadir SKU e identificación única para mantenimiento de materiales.

-- 1. Añadir SKU a materials si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='sku') THEN
        ALTER TABLE materials ADD COLUMN sku VARCHAR(100) UNIQUE;
    END IF;
END $$;

-- 2. Asegurar que unit_price sea numérico y tenga precisión
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='unit_price') THEN
        ALTER TABLE materials ADD COLUMN unit_price NUMERIC(12,2) DEFAULT 0;
    ELSE
        ALTER TABLE materials ALTER COLUMN unit_price TYPE NUMERIC(12,2);
    END IF;
END $$;

-- 3. Índices para búsqueda rápida en catálogo
CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_name_trgm ON materials USING gin (name gin_trgm_ops);

-- Nota: Si el equipo (equipment) no tiene campos de serie/modelo, se deben añadir similarmente.
-- CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
