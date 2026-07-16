-- ========================================
-- TABELA DE LOGS DO SISTEMA
-- ========================================
-- Execute este SQL no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query > cole aqui > Run)
-- ========================================

-- Tabela de Logs
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  acao TEXT NOT NULL,
  detalhes TEXT,
  usuario_nome TEXT,
  usuario_perfil TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "logs_select" ON logs FOR SELECT USING (true);
CREATE POLICY "logs_insert" ON logs FOR INSERT WITH CHECK (true);
CREATE POLICY "logs_delete" ON logs FOR DELETE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs(tipo);
