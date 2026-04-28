-- =========================================================
-- QUALITY MODULE: Tabla quality_inspections
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- Enum de estatus de inspección
CREATE TYPE inspection_status AS ENUM ('pass', 'fail', 'pending');

-- Tabla principal de inspecciones de calidad
CREATE TABLE IF NOT EXISTS quality_inspections (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Referencia al material inspeccionado
  material_id   UUID REFERENCES materials(id) ON DELETE SET NULL,
  material_name TEXT NOT NULL, -- Cache del nombre para queries rápidas

  -- Inspector (usuario de Supabase Auth)
  inspector_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspector_name TEXT NOT NULL DEFAULT 'Inspector',

  -- Datos de la inspección
  status        inspection_status NOT NULL DEFAULT 'pending',
  batch_number  TEXT,
  notes         TEXT NOT NULL DEFAULT '',

  -- Evidencia y firma
  signature_url TEXT,  -- Base64 data URL o URL de Storage
  evidence_url  TEXT,  -- URL a imagen de evidencia

  -- Metadata adicional
  warehouse_id  UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  tags          TEXT[] DEFAULT '{}'
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_quality_inspections_status    ON quality_inspections(status);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_created   ON quality_inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_inspector ON quality_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_material  ON quality_inspections(material_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quality_inspections_updated_at
  BEFORE UPDATE ON quality_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden ver todas las inspecciones
CREATE POLICY "Authenticated users can read inspections"
  ON quality_inspections FOR SELECT
  TO authenticated
  USING (true);

-- Política: usuarios autenticados pueden crear inspecciones
CREATE POLICY "Authenticated users can insert inspections"
  ON quality_inspections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inspector_id);

-- Política: el inspector puede actualizar sus propias inspecciones
CREATE POLICY "Inspectors can update own inspections"
  ON quality_inspections FOR UPDATE
  TO authenticated
  USING (auth.uid() = inspector_id);

-- Habilitar Realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE quality_inspections;

-- =========================================================
-- Vista útil: Estadísticas de calidad
-- =========================================================
CREATE OR REPLACE VIEW quality_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pass')                   AS total_pass,
  COUNT(*) FILTER (WHERE status = 'fail')                   AS total_fail,
  COUNT(*) FILTER (WHERE status = 'pending')                AS total_pending,
  COUNT(*)                                                   AS total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'pass') / NULLIF(COUNT(*), 0),
    1
  )                                                         AS conformity_rate,
  COUNT(*) FILTER (WHERE status = 'fail' AND created_at > now() - interval '7 days') AS critical_alerts_week
FROM quality_inspections;
