-- ========================================
-- AUDITORIA + BLOQUEAR USUÁRIO
-- ========================================
-- Cole todo este conteúdo no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query > cole aqui > Run)
-- ========================================

-- 1. Adicionar coluna status na tabela usuarios (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'status') THEN
    ALTER TABLE usuarios ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;
END $$;

-- 2. Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalhes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "auditoria_select" ON auditoria FOR SELECT USING (true);
CREATE POLICY "auditoria_insert" ON auditoria FOR INSERT WITH CHECK (true);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
