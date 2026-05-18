-- ============================================================
-- HumanizAÇÃO Platform · Database Schema
-- Supabase PostgreSQL · NR-1 Psychosocial Risk Management SaaS
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin_master',
  'consultoria',
  'rh_corporativo',
  'dho',
  'sesmt',
  'diretoria',
  'lideranca',
  'gestor',
  'auditoria',
  'colaborador'
);

CREATE TYPE risk_level AS ENUM ('baixo', 'moderado', 'alto', 'critico');

CREATE TYPE action_status AS ENUM (
  'pendente',
  'em_andamento',
  'concluido',
  'cancelado',
  'atrasado'
);

CREATE TYPE avaliacao_status AS ENUM (
  'rascunho',
  'ativa',
  'encerrada',
  'arquivada'
);

CREATE TYPE question_type AS ENUM (
  'likert_5',
  'likert_7',
  'multiple_choice',
  'single_choice',
  'text_open',
  'nps',
  'frequency',
  'boolean'
);

CREATE TYPE sector_type AS ENUM (
  'operacional',
  'administrativo',
  'manutencao',
  'atendimento',
  'diretoria',
  'rh',
  'ti',
  'financeiro',
  'comercial',
  'outro'
);

-- ============================================================
-- COMPANIES (Multitenancy root)
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1a2b4a',
  secondary_color VARCHAR(7) DEFAULT '#2d8c6e',
  settings JSONB DEFAULT '{}',
  nr1_deadline DATE,
  max_employees INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'colaborador',
  sector VARCHAR(100),
  job_title VARCHAR(150),
  avatar_url TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTORS
-- ============================================================

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  type sector_type DEFAULT 'outro',
  description TEXT,
  manager_id UUID REFERENCES profiles(id),
  employee_count INTEGER DEFAULT 0,
  risk_score DECIMAL(5,2) DEFAULT 0,
  risk_level risk_level DEFAULT 'baixo',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AVALIACOES (Psychosocial assessments)
-- ============================================================

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status avaliacao_status DEFAULT 'rascunho',
  target_sectors UUID[] DEFAULT '{}',
  target_roles user_role[] DEFAULT '{}',
  anonymous BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  reminder_days INTEGER[] DEFAULT '{3,1}',
  participation_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIMENSOES (Psychosocial dimensions/categories)
-- ============================================================

CREATE TABLE dimensoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  weight DECIMAL(3,2) DEFAULT 1.0,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Seed base dimensions
INSERT INTO dimensoes (name, slug, description, icon, weight, order_index) VALUES
('Carga de Trabalho', 'carga_trabalho', 'Pressão por demandas, prazos e volume de tarefas', '⚡', 1.2, 1),
('Exaustão Emocional', 'exaustao_emocional', 'Esgotamento físico e psicológico decorrente do trabalho', '🔥', 1.3, 2),
('Reconhecimento', 'reconhecimento', 'Percepção de valorização, recompensa e feedback', '⭐', 1.1, 3),
('Segurança Psicológica', 'seguranca_psicologica', 'Ambiente de confiança, abertura e sem represálias', '🛡', 1.2, 4),
('Relações Interpessoais', 'relacoes_interpessoais', 'Qualidade dos relacionamentos entre pares e equipes', '🤝', 1.0, 5),
('Liderança', 'lideranca', 'Suporte, clareza e estilo de gestão das lideranças', '👑', 1.1, 6),
('Autonomia', 'autonomia', 'Liberdade para tomar decisões e gerir o próprio trabalho', '🎯', 1.0, 7),
('Equilíbrio Vida/Trabalho', 'equilibrio_vida_trabalho', 'Fronteiras saudáveis entre vida pessoal e profissional', '⚖️', 1.0, 8),
('Comunicação Organizacional', 'comunicacao_organizacional', 'Clareza, transparência e fluxo de informações', '📢', 0.9, 9),
('Apoio Organizacional', 'apoio_organizacional', 'Suporte percebido da empresa ao colaborador', '🏢', 1.0, 10),
('Clareza de Papel', 'clareza_papel', 'Definição clara de responsabilidades e expectativas', '📋', 0.9, 11),
('Conflitos no Trabalho', 'conflitos_trabalho', 'Frequência e intensidade de conflitos interpessoais', '⚠️', 1.1, 12),
('Insegurança Ocupacional', 'inseguranca_ocupacional', 'Percepção de estabilidade e continuidade no emprego', '🔒', 1.0, 13),
('Percepção de Justiça', 'percepcao_justica', 'Equidade nos processos, decisões e tratamento', '⚖️', 1.0, 14),
('Pertencimento', 'pertencimento', 'Sentimento de inclusão, identidade e propósito', '❤️', 0.9, 15),
('Assédio Moral/Sexual', 'assedio', 'Ocorrências de violência moral ou sexual no trabalho', '🚨', 1.5, 16);

-- ============================================================
-- PERGUNTAS (Questions)
-- ============================================================

CREATE TABLE perguntas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avaliacao_id UUID REFERENCES avaliacoes(id) ON DELETE CASCADE,
  dimensao_id UUID REFERENCES dimensoes(id),
  company_id UUID REFERENCES companies(id),
  text TEXT NOT NULL,
  type question_type NOT NULL DEFAULT 'likert_5',
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT TRUE,
  inverted_score BOOLEAN DEFAULT FALSE, -- for reverse-scored items
  order_index INTEGER DEFAULT 0,
  conditional_logic JSONB DEFAULT NULL,
  help_text TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template questions bank (NR-1 aligned)
INSERT INTO perguntas (dimensao_id, text, type, options, inverted_score, order_index, is_template) 
SELECT 
  d.id,
  q.text,
  q.type::question_type,
  q.options::jsonb,
  q.inverted_score,
  q.order_index,
  TRUE
FROM (VALUES
  -- Carga de Trabalho
  ('carga_trabalho', 'Com que frequência você sente que tem trabalho demais para realizar no tempo disponível?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 1),
  ('carga_trabalho', 'Você consegue realizar todas as suas tarefas dentro do horário de trabalho?', 'likert_5', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', TRUE, 2),
  ('carga_trabalho', 'Seu trabalho exige que você trabalhe muito rápido?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 3),
  -- Exaustão Emocional
  ('exaustao_emocional', 'Você se sente emocionalmente esgotado pelo seu trabalho?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 1),
  ('exaustao_emocional', 'Você se sente esgotado ao final de um dia de trabalho?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 2),
  ('exaustao_emocional', 'Você se sente cansado quando acorda de manhã e precisa enfrentar mais um dia de trabalho?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 3),
  -- Reconhecimento
  ('reconhecimento', 'Você recebe reconhecimento adequado pelo trabalho que realiza?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 1),
  ('reconhecimento', 'Seu esforço e desempenho são valorizados pela empresa?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 2),
  -- Segurança Psicológica
  ('seguranca_psicologica', 'Você se sente seguro para expressar sua opinião sem medo de consequências negativas?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 1),
  ('seguranca_psicologica', 'Na sua equipe, é seguro correr riscos e tentar coisas novas?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 2),
  -- Liderança
  ('lideranca', 'Sua liderança direta demonstra interesse genuíno pelo seu bem-estar?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 1),
  ('lideranca', 'Você recebe feedback construtivo e útil da sua liderança?', 'likert_5', '["Discordo totalmente","Discordo","Neutro","Concordo","Concordo totalmente"]', FALSE, 2),
  -- Assédio
  ('assedio', 'Você já presenciou ou sofreu situações de assédio moral no trabalho?', 'frequency', '["Nunca","Raramente","Às vezes","Frequentemente","Sempre"]', FALSE, 1)
) AS q(dimensao_slug, text, type, options, inverted_score, order_index)
JOIN dimensoes d ON d.slug = q.dimensao_slug;

-- ============================================================
-- RESPOSTAS (Responses)
-- ============================================================

CREATE TABLE respostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avaliacao_id UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES profiles(id), -- NULL if anonymous
  respondent_token VARCHAR(64), -- for anonymous tracking without identity
  sector_id UUID REFERENCES sectors(id),
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  answers JSONB DEFAULT '{}', -- { pergunta_id: { value, score } }
  dimension_scores JSONB DEFAULT '{}', -- { dimensao_slug: score }
  overall_score DECIMAL(5,2),
  risk_level risk_level,
  metadata JSONB DEFAULT '{}', -- device, browser, etc (no PII if anonymous)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RISK ASSESSMENTS (Computed risk per sector/company/period)
-- ============================================================

CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes(id),
  sector_id UUID REFERENCES sectors(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  period_label VARCHAR(50), -- e.g., "Jan 2026", "Q1 2026"
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'baixo',
  sample_size INTEGER DEFAULT 0,
  participation_rate DECIMAL(5,2) DEFAULT 0,
  heatmap_data JSONB DEFAULT '{}',
  trend_data JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  nr1_compliance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI INSIGHTS
-- ============================================================

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes(id),
  sector_id UUID REFERENCES sectors(id),
  type VARCHAR(50) NOT NULL, -- 'burnout_risk', 'turnover_risk', 'pattern', 'opportunity'
  severity risk_level DEFAULT 'moderado',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  affected_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  data_sources JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_by UUID REFERENCES profiles(id),
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLANOS DE AÇÃO (Action Plans)
-- ============================================================

CREATE TABLE planos_acao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes(id),
  sector_id UUID REFERENCES sectors(id),
  dimensao_id UUID REFERENCES dimensoes(id),
  insight_id UUID REFERENCES ai_insights(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status action_status DEFAULT 'pendente',
  priority risk_level DEFAULT 'moderado',
  responsible_id UUID REFERENCES profiles(id),
  responsible_name VARCHAR(255),
  due_date DATE NOT NULL,
  completed_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  expected_impact TEXT,
  evidence_required TEXT,
  attachments JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  sla_days INTEGER,
  nr1_related BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BENCHMARKS (industry reference data)
-- ============================================================

CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry VARCHAR(100) NOT NULL DEFAULT 'transporte_coletivo',
  dimensao_id UUID REFERENCES dimensoes(id),
  period_year INTEGER NOT NULL,
  percentile_25 DECIMAL(5,2),
  percentile_50 DECIMAL(5,2),
  percentile_75 DECIMAL(5,2),
  sample_companies INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_sectors_company ON sectors(company_id);
CREATE INDEX idx_avaliacoes_company ON avaliacoes(company_id);
CREATE INDEX idx_avaliacoes_status ON avaliacoes(status);
CREATE INDEX idx_respostas_avaliacao ON respostas(avaliacao_id);
CREATE INDEX idx_respostas_company ON respostas(company_id);
CREATE INDEX idx_respostas_sector ON respostas(sector_id);
CREATE INDEX idx_respostas_completed ON respostas(completed, created_at);
CREATE INDEX idx_risk_assessments_company ON risk_assessments(company_id);
CREATE INDEX idx_risk_assessments_sector ON risk_assessments(sector_id);
CREATE INDEX idx_ai_insights_company ON ai_insights(company_id);
CREATE INDEX idx_planos_company ON planos_acao(company_id);
CREATE INDEX idx_planos_status ON planos_acao(status);
CREATE INDEX idx_planos_due ON planos_acao(due_date);
CREATE INDEX idx_audit_company ON audit_log(company_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- COMPANIES: users see only their company
CREATE POLICY "company_isolation" ON companies
  FOR ALL USING (id = get_current_company_id());

-- PROFILES: users see only profiles in their company
CREATE POLICY "profiles_company_isolation" ON profiles
  FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (id = auth.uid() OR get_current_user_role() IN ('admin_master', 'rh_corporativo'));

-- SECTORS: company isolation
CREATE POLICY "sectors_company_isolation" ON sectors
  FOR ALL USING (company_id = get_current_company_id());

-- AVALIACOES: company isolation
CREATE POLICY "avaliacoes_company_isolation" ON avaliacoes
  FOR ALL USING (company_id = get_current_company_id());

-- PERGUNTAS: template questions are global, company questions are isolated
CREATE POLICY "perguntas_access" ON perguntas
  FOR SELECT USING (
    is_template = TRUE 
    OR company_id = get_current_company_id()
    OR avaliacao_id IN (SELECT id FROM avaliacoes WHERE company_id = get_current_company_id())
  );

CREATE POLICY "perguntas_manage" ON perguntas
  FOR INSERT WITH CHECK (
    company_id = get_current_company_id()
    OR get_current_user_role() IN ('admin_master', 'consultoria', 'rh_corporativo')
  );

-- RESPOSTAS: company isolation + anonymity protection
CREATE POLICY "respostas_company_isolation" ON respostas
  FOR ALL USING (company_id = get_current_company_id());

-- Colaboradores can only insert/update their own
CREATE POLICY "respostas_collaborator_write" ON respostas
  FOR INSERT WITH CHECK (
    company_id = get_current_company_id()
    AND (anonymous = FALSE AND respondent_id = auth.uid() OR TRUE)
  );

-- RISK ASSESSMENTS
CREATE POLICY "risk_assessments_company_isolation" ON risk_assessments
  FOR ALL USING (company_id = get_current_company_id());

-- AI INSIGHTS
CREATE POLICY "ai_insights_company_isolation" ON ai_insights
  FOR ALL USING (company_id = get_current_company_id());

-- PLANOS DE AÇÃO
CREATE POLICY "planos_company_isolation" ON planos_acao
  FOR ALL USING (company_id = get_current_company_id());

-- AUDIT LOG: only admins and auditors can read
CREATE POLICY "audit_restricted_read" ON audit_log
  FOR SELECT USING (
    company_id = get_current_company_id()
    AND get_current_user_role() IN ('admin_master', 'auditoria', 'consultoria', 'rh_corporativo')
  );

CREATE POLICY "audit_insert" ON audit_log
  FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- NOTIFICATIONS: own only
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (
    user_id = auth.uid()
    AND company_id = get_current_company_id()
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON avaliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON planos_acao FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'colaborador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Compute risk level from score
CREATE OR REPLACE FUNCTION compute_risk_level(score DECIMAL)
RETURNS risk_level AS $$
BEGIN
  IF score >= 75 THEN RETURN 'critico';
  ELSIF score >= 55 THEN RETURN 'alto';
  ELSIF score >= 35 THEN RETURN 'moderado';
  ELSE RETURN 'baixo';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update avaliacao completion rate
CREATE OR REPLACE FUNCTION update_avaliacao_stats()
RETURNS TRIGGER AS $$
DECLARE
  total_completed INTEGER;
  target INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_completed
  FROM respostas
  WHERE avaliacao_id = NEW.avaliacao_id AND completed = TRUE;
  
  SELECT target_count INTO target
  FROM avaliacoes
  WHERE id = NEW.avaliacao_id;
  
  UPDATE avaliacoes SET
    participation_count = total_completed,
    completion_rate = CASE WHEN target > 0 THEN (total_completed::DECIMAL / target * 100) ELSE 0 END
  WHERE id = NEW.avaliacao_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_resposta_completed
  AFTER INSERT OR UPDATE OF completed ON respostas
  FOR EACH ROW WHEN (NEW.completed = TRUE)
  EXECUTE FUNCTION update_avaliacao_stats();

-- ============================================================
-- REALTIME (enable for key tables)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE respostas;
ALTER PUBLICATION supabase_realtime ADD TABLE planos_acao;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE risk_assessments;

-- ============================================================
-- SEED DEMO DATA
-- ============================================================

-- Demo company
INSERT INTO companies (id, name, slug, cnpj, plan, nr1_deadline, max_employees)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Viação Santa Clara',
  'visac',
  '00.000.000/0001-00',
  'enterprise',
  '2026-05-26',
  200
);

-- Demo sectors for VISAC
INSERT INTO sectors (company_id, name, type, employee_count, risk_score, risk_level) VALUES
('a0000000-0000-0000-0000-000000000001', 'Operacional / Tráfego', 'operacional', 53, 71.4, 'alto'),
('a0000000-0000-0000-0000-000000000001', 'Manutenção', 'manutencao', 34, 82.1, 'critico'),
('a0000000-0000-0000-0000-000000000001', 'Administrativo', 'administrativo', 34, 63.8, 'alto'),
('a0000000-0000-0000-0000-000000000001', 'Atendimento / Bilhetagem', 'atendimento', 24, 48.2, 'moderado'),
('a0000000-0000-0000-0000-000000000001', 'Diretoria e Gestão', 'diretoria', 14, 31.0, 'baixo');
