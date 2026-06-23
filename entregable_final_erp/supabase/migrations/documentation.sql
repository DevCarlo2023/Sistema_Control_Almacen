-- =========================================================
-- DOCUMENTATION MODULE: Tabla documentation y Storage Bucket
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- Tabla principal de documentos técnicos
CREATE TABLE IF NOT EXISTS documentation (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Datos del documento
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  file_url      TEXT NOT NULL,
  file_type     TEXT NOT NULL DEFAULT 'application/pdf',
  
  -- Categorías (Certificado, Ficha Técnica, Ficha de Seguridad, etc.)
  category      TEXT NOT NULL DEFAULT 'Certificado de Calidad', -- 'Ficha Técnica', 'Ficha de Seguridad', 'Manual', etc.
  
  -- Vinculación con activos
  linked_type   TEXT NOT NULL DEFAULT 'general', -- 'material', 'equipment', 'general'
  linked_id     UUID, -- ID de materials o equipment
  
  -- Usuario que subió el documento
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags          TEXT[] DEFAULT '{}'
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_documentation_category ON documentation(category);
CREATE INDEX IF NOT EXISTS idx_documentation_linked   ON documentation(linked_type, linked_id);
CREATE INDEX IF NOT EXISTS idx_documentation_created  ON documentation(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentation_updated_at
  BEFORE UPDATE ON documentation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documentation"
  ON documentation FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documentation"
  ON documentation FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own documentation"
  ON documentation FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);

-- =========================================================
-- STORAGE BUCKET: documents
-- =========================================================
-- Se recomienda crear el bucket 'documents' como PUBLIC en la interfaz de Supabase Storage.
