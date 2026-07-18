-- Tabela de documentos/anexos vinculados a pacientes
-- Execute no Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  paciente_id TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho BIGINT NOT NULL,
  url TEXT NOT NULL,
  key TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar documentos por paciente rápido
CREATE INDEX IF NOT EXISTS idx_documentos_paciente_id ON documentos(paciente_id);

-- RLS: permitir leitura para todos os usuários autenticados
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura documentos" ON documentos
  FOR SELECT USING (true);

CREATE POLICY "Inserir documentos" ON documentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Deletar documentos" ON documentos
  FOR DELETE USING (true);
