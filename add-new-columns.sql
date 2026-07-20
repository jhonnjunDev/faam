-- Adicionar novos campos na tabela pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nome_pai TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS nome_mae TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS cns TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS municipio_residencia TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS dependencia_fisica TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS grau_dependencia TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS diagnostico_livre TEXT;
