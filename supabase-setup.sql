-- ========================================
-- SCRIPT SQL PARA CRIAR AS TABELAS NO SUPABASE
-- ========================================
-- Copie TODO o conteúdo abaixo e cole no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query > cole aqui > Run)
-- ========================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  codigo TEXT,
  codigo_hash TEXT,
  perfil TEXT NOT NULL DEFAULT 'assistente_social',
  status TEXT DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna codigo_hash se não existir (para migração)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'codigo_hash') THEN
    ALTER TABLE usuarios ADD COLUMN codigo_hash TEXT;
  END IF;
END $$;

-- Adicionar coluna status se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'status') THEN
    ALTER TABLE usuarios ADD COLUMN status TEXT DEFAULT 'ativo';
  END IF;
END $$;

-- Tabela de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  data_nascimento DATE,
  sexo TEXT,
  estado_civil TEXT,
  naturalidade TEXT,
  telefone TEXT,
  email TEXT,
  endereco_rua TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_cep TEXT,
  contato_nome TEXT,
  contato_parentesco TEXT,
  contato_telefone TEXT,
  data_entrada DATE,
  quarto TEXT,
  tipo_acomodacao TEXT,
  responsavel_legal TEXT,
  diagnostico_principal TEXT,
  diagnosticos_secundarios TEXT,
  alergias TEXT,
  medicamentos TEXT,
  medicamento_controlado TEXT DEFAULT 'nao',
  historico_cirurgias TEXT,
  historico_internacoes TEXT,
  doencas_cronicas TEXT,
  responsavel_acompanhamento TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data DATE,
  profissional TEXT,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  usuario_nome TEXT,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalhes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para recriar limpo)
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;
DROP POLICY IF EXISTS "Permitir tudo para usuarios" ON usuarios;

DROP POLICY IF EXISTS "pacientes_select" ON pacientes;
DROP POLICY IF EXISTS "pacientes_insert" ON pacientes;
DROP POLICY IF EXISTS "pacientes_update" ON pacientes;
DROP POLICY IF EXISTS "pacientes_delete" ON pacientes;
DROP POLICY IF EXISTS "Permitir tudo para pacientes" ON pacientes;

DROP POLICY IF EXISTS "relatorios_select" ON relatorios;
DROP POLICY IF EXISTS "relatorios_insert" ON relatorios;
DROP POLICY IF EXISTS "relatorios_update" ON relatorios;
DROP POLICY IF EXISTS "relatorios_delete" ON relatorios;
DROP POLICY IF EXISTS "Permitir tudo para relatorios" ON relatorios;

DROP POLICY IF EXISTS "auditoria_select" ON auditoria;
DROP POLICY IF EXISTS "auditoria_insert" ON auditoria;

-- Criar políticas novas
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (true);
CREATE POLICY "usuarios_delete" ON usuarios FOR DELETE USING (true);

CREATE POLICY "pacientes_select" ON pacientes FOR SELECT USING (true);
CREATE POLICY "pacientes_insert" ON pacientes FOR INSERT WITH CHECK (true);
CREATE POLICY "pacientes_update" ON pacientes FOR UPDATE USING (true);
CREATE POLICY "pacientes_delete" ON pacientes FOR DELETE USING (true);

CREATE POLICY "relatorios_select" ON relatorios FOR SELECT USING (true);
CREATE POLICY "relatorios_insert" ON relatorios FOR INSERT WITH CHECK (true);
CREATE POLICY "relatorios_update" ON relatorios FOR UPDATE USING (true);
CREATE POLICY "relatorios_delete" ON relatorios FOR DELETE USING (true);

CREATE POLICY "auditoria_select" ON auditoria FOR SELECT USING (true);
CREATE POLICY "auditoria_insert" ON auditoria FOR INSERT WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_relatorios_paciente_id ON relatorios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pacientes_modtime ON pacientes;
CREATE TRIGGER update_pacientes_modtime
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
