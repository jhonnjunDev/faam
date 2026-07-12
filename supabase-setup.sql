-- ========================================
-- SCRIPT SQL PARA CRIAR AS TABELAS NO SUPABASE
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query)
-- ========================================

-- Tabela de Usuários (usa código em vez de senha)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  codigo TEXT NOT NULL,
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

-- Habilitar RLS (Row Level Security) - Opcional mas recomendado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo por enquanto)
CREATE POLICY "Permitir tudo para usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "Permitir tudo para pacientes" ON pacientes FOR ALL USING (true);
CREATE POLICY "Permitir tudo para relatorios" ON relatorios FOR ALL USING (true);
