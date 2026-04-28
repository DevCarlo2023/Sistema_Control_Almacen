-- Migración: Renombrar columna sku -> codigo en tabla materials
-- Objetivo: Alinear nomenclatura del frontend con la base de datos

-- 1. Verificar si existe la columna 'sku' (legada) y renombrarla a 'codigo'
DO $$
BEGIN
    -- Si existe la columna 'sku', renombrarla a 'codigo'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materials' AND column_name = 'sku'
    ) THEN
        ALTER TABLE materials RENAME COLUMN sku TO codigo;
        RAISE NOTICE 'Columna "sku" renombrada a "codigo" exitosamente.';
    END IF;

    -- Si 'codigo' no existe (tabla nueva o sin la migración anterior), crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materials' AND column_name = 'codigo'
    ) THEN
        ALTER TABLE materials ADD COLUMN codigo VARCHAR(100);
        RAISE NOTICE 'Columna "codigo" creada exitosamente en materials.';
    END IF;
END $$;

-- 2. Crear índice en codigo para búsquedas rápidas
DROP INDEX IF EXISTS idx_materials_sku;
CREATE INDEX IF NOT EXISTS idx_materials_codigo ON materials(codigo);

-- 3. Confirmación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'materials'
ORDER BY ordinal_position;
