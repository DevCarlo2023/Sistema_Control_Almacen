-- Migración: Sub-módulo Gestión Humana (Recursos Humanos)
-- Objetivo: Añadir soporte para estado de personal y control de fechas administrativo.

-- 1. Añadir columnas a 'workers' si no existen
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='status') THEN
        ALTER TABLE workers ADD COLUMN status VARCHAR(20) DEFAULT 'activo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='joining_date') THEN
        ALTER TABLE workers ADD COLUMN joining_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='termination_date') THEN
        ALTER TABLE workers ADD COLUMN termination_date DATE;
    END IF;
END $$;

-- 2. Índices para búsqueda rápida por DNI y Estado
CREATE INDEX IF NOT EXISTS idx_workers_dni ON workers(dni);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- 3. Comentario descriptivo
COMMENT ON COLUMN workers.status IS 'Estado administrativo del trabajador: activo o cesado';
