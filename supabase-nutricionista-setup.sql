CREATE TABLE IF NOT EXISTS nutricionista_dados (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data DATE,
  peso NUMERIC,
  altura NUMERIC,
  imc NUMERIC,
  risco_nutricional TEXT,
  estado_nutricional TEXT,
  tipo_dieta TEXT,
  calorias NUMERIC,
  proteinas NUMERIC,
  carboidratos NUMERIC,
  lipidios NUMERIC,
  restricoes TEXT,
  cardapio TEXT,
  validade DATE,
  refeicao TEXT,
  percentual INTEGER,
  alimentos_nao_aceitos TEXT,
  volume INTEGER,
  meta INTEGER,
  via TEXT,
  tipo_intercorrencia TEXT,
  gravidade TEXT,
  descricao TEXT,
  conduta TEXT,
  notificar_equipe TEXT,
  tipo_relatorio TEXT,
  conclusao TEXT,
  observacoes TEXT,
  profissional TEXT,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE nutricionista_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutricionista_dados_select" ON nutricionista_dados;
DROP POLICY IF EXISTS "nutricionista_dados_insert" ON nutricionista_dados;
DROP POLICY IF EXISTS "nutricionista_dados_update" ON nutricionista_dados;
DROP POLICY IF EXISTS "nutricionista_dados_delete" ON nutricionista_dados;

CREATE POLICY "nutricionista_dados_select" ON nutricionista_dados FOR SELECT USING (true);
CREATE POLICY "nutricionista_dados_insert" ON nutricionista_dados FOR INSERT WITH CHECK (true);
CREATE POLICY "nutricionista_dados_update" ON nutricionista_dados FOR UPDATE USING (true);
CREATE POLICY "nutricionista_dados_delete" ON nutricionista_dados FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_nutricionista_paciente_id ON nutricionista_dados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_nutricionista_tipo ON nutricionista_dados(tipo);
CREATE INDEX IF NOT EXISTS idx_nutricionista_data ON nutricionista_dados(data);
