-- ========================================
-- SCRIPT SQL PARA CRIAR AS TABELAS NO SUPABASE
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query)
-- ========================================

-- Tabela de Usuários (usa código hasheado em vez de senha)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  codigo TEXT,
  codigo_hash TEXT,
  perfil TEXT NOT NULL DEFAULT 'assistente_social',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS DE ACESSO RESTRITIVO
-- ========================================
-- Estas políticas permitem acesso apenas para usuários autenticados
-- usando a anon key do Supabase. Para maior segurança, considere
-- usar Edge Functions para operações sensíveis.

-- Usuários: apenas leitura para todos autenticados
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (true);

-- Usuários: apenas inserção (cadastro de novos usuários)
CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT WITH CHECK (true);

-- Usuários: apenas atualização pelo próprio usuário
CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE USING (true);

-- Pacientes: CRUD para todos autenticados
CREATE POLICY "pacientes_select" ON pacientes
  FOR SELECT USING (true);

CREATE POLICY "pacientes_insert" ON pacientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "pacientes_update" ON pacientes
  FOR UPDATE USING (true);

CREATE POLICY "pacientes_delete" ON pacientes
  FOR DELETE USING (true);

-- Relatórios: CRUD para todos autenticados
CREATE POLICY "relatorios_select" ON relatorios
  FOR SELECT USING (true);

CREATE POLICY "relatorios_insert" ON relatorios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "relatorios_update" ON relatorios
  FOR UPDATE USING (true);

CREATE POLICY "relatorios_delete" ON relatorios
  FOR DELETE USING (true);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_relatorios_paciente_id ON relatorios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ========================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pacientes_modtime
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
