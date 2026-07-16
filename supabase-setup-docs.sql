-- ========================================
-- TABELA DE DOCUMENTOS/ANEXOS DOS PACIENTES
-- ========================================
-- Execute no SQL Editor do Supabase APÓS o supabase-setup.sql

CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho BIGINT NOT NULL,
  url TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Políticas (permitir tudo por enquanto)
CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (true);
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_paciente_id ON documentos(paciente_id);
