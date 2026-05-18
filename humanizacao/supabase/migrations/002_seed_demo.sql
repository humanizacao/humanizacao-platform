-- ============================================================
-- HumanizAÇÃO · Seed Script (Demo Data)
-- Run after 001_initial_schema.sql
-- ============================================================

-- ⚠️ This seed creates a demo user via Supabase Auth API
-- The user is: bruna@humanizacao.com.br / demo123456
-- Create via Supabase Dashboard or CLI:
-- supabase auth user create --email bruna@humanizacao.com.br --password demo123456

-- Then update the profile:
-- UPDATE profiles SET
--   full_name = 'Bruna Coutinho',
--   role = 'consultoria',
--   company_id = 'a0000000-0000-0000-0000-000000000001',
--   job_title = 'Psicóloga Organizacional',
--   onboarding_completed = TRUE
-- WHERE email = 'bruna@humanizacao.com.br';

-- ============================================================
-- DEMO RISK ASSESSMENTS (simulate historical data)
-- ============================================================

DO $$
DECLARE
  visac_id UUID := 'a0000000-0000-0000-0000-000000000001';
  manut_id UUID;
  oper_id UUID;
  admin_id UUID;
  aten_id UUID;
  dir_id UUID;
BEGIN
  SELECT id INTO manut_id FROM sectors WHERE company_id = visac_id AND name ILIKE '%Manutenção%' LIMIT 1;
  SELECT id INTO oper_id FROM sectors WHERE company_id = visac_id AND name ILIKE '%Operacional%' LIMIT 1;
  SELECT id INTO admin_id FROM sectors WHERE company_id = visac_id AND name ILIKE '%Administrativo%' LIMIT 1;
  SELECT id INTO aten_id FROM sectors WHERE company_id = visac_id AND name ILIKE '%Atendimento%' LIMIT 1;
  SELECT id INTO dir_id FROM sectors WHERE company_id = visac_id AND name ILIKE '%Diretoria%' LIMIT 1;

  -- Company-level assessments (last 5 months)
  INSERT INTO risk_assessments (company_id, assessed_at, period_label, dimension_scores, overall_score, risk_level, sample_size, participation_rate)
  VALUES
    (visac_id, NOW() - INTERVAL '4 months', 'Jan/26', 
     '{"carga_trabalho":61,"exaustao_emocional":52,"reconhecimento":68,"seguranca_psicologica":41,"lideranca":38,"autonomia":35,"equilibrio_vida_trabalho":55,"relacoes_interpessoais":32}'::jsonb,
     53.5, 'alto', 89, 72.5),
    (visac_id, NOW() - INTERVAL '3 months', 'Fev/26',
     '{"carga_trabalho":64,"exaustao_emocional":55,"reconhecimento":71,"seguranca_psicologica":40,"lideranca":36,"autonomia":34,"equilibrio_vida_trabalho":58,"relacoes_interpessoais":34}'::jsonb,
     56.0, 'alto', 95, 76.1),
    (visac_id, NOW() - INTERVAL '2 months', 'Mar/26',
     '{"carga_trabalho":67,"exaustao_emocional":58,"reconhecimento":74,"seguranca_psicologica":43,"lideranca":37,"autonomia":33,"equilibrio_vida_trabalho":61,"relacoes_interpessoais":36}'::jsonb,
     58.3, 'alto', 102, 78.5),
    (visac_id, NOW() - INTERVAL '1 month', 'Abr/26',
     '{"carga_trabalho":71,"exaustao_emocional":62,"reconhecimento":78,"seguranca_psicologica":44,"lideranca":38,"autonomia":32,"equilibrio_vida_trabalho":63,"relacoes_interpessoais":37}'::jsonb,
     62.8, 'alto', 108, 79.4),
    (visac_id, NOW(), 'Mai/26',
     '{"carga_trabalho":78,"exaustao_emocional":65,"reconhecimento":82,"seguranca_psicologica":44,"lideranca":38,"autonomia":31,"equilibrio_vida_trabalho":61,"relacoes_interpessoais":38}'::jsonb,
     67.1, 'critico', 124, 78.0);

  -- Per-sector current assessments
  IF manut_id IS NOT NULL THEN
    INSERT INTO risk_assessments (company_id, sector_id, assessed_at, period_label, dimension_scores, overall_score, risk_level, sample_size, participation_rate)
    VALUES (visac_id, manut_id, NOW(), 'Mai/26',
      '{"carga_trabalho":88,"exaustao_emocional":82,"reconhecimento":91,"seguranca_psicologica":55,"lideranca":48,"autonomia":40,"equilibrio_vida_trabalho":72}"'::jsonb,
      82.1, 'critico', 23, 67.6);
  END IF;

  IF oper_id IS NOT NULL THEN
    INSERT INTO risk_assessments (company_id, sector_id, assessed_at, period_label, dimension_scores, overall_score, risk_level, sample_size, participation_rate)
    VALUES (visac_id, oper_id, NOW(), 'Mai/26',
      '{"carga_trabalho":81,"exaustao_emocional":68,"reconhecimento":72,"seguranca_psicologica":42,"lideranca":35,"autonomia":28,"equilibrio_vida_trabalho":65}'::jsonb,
      71.4, 'alto', 43, 81.1);
  END IF;

  -- AI Insights (demo)
  INSERT INTO ai_insights (company_id, type, severity, title, body, affected_count, confidence_score, expires_at)
  VALUES
    (visac_id, 'burnout_risk', 'critico',
     '🔴 Risco de Burnout · Manutenção',
     'O setor de Manutenção apresenta progressão expressiva de exaustão emocional combinada com baixo reconhecimento e alta sobrecarga. Padrão compatível com burnout em 6–8 semanas.',
     14, 0.87, NOW() + INTERVAL '30 days'),
    (visac_id, 'turnover_risk', 'alto',
     '🟡 Risco de Turnover · Administrativo',
     'Correlação identificada entre alta insatisfação com liderança e histórico de absenteísmo no setor Administrativo. Risco elevado de desligamentos voluntários nos próximos 60 dias.',
     9, 0.73, NOW() + INTERVAL '30 days'),
    (visac_id, 'opportunity', 'baixo',
     '🔵 Oportunidade · Expansão de Boas Práticas',
     'Equipes com maior percepção de autonomia apresentam 40% menos afastamentos. Expansão das práticas do setor de Tráfego pode reduzir risco global em até 12 pontos.',
     53, 0.81, NOW() + INTERVAL '30 days');

  -- Demo action plans
  INSERT INTO planos_acao (company_id, title, description, status, priority, responsible_name, due_date, progress, nr1_related)
  VALUES
    (visac_id, 'Treinamento de liderança humanizada · Manutenção', 'Capacitar líderes em gestão humanizada e escuta ativa', 'em_andamento', 'critico', 'SESMT · RH', CURRENT_DATE - 7, 30, TRUE),
    (visac_id, 'Programa de reconhecimento · Setor Administrativo', 'Implementar sistemática de feedback e reconhecimento mensal', 'em_andamento', 'alto', 'DHO', CURRENT_DATE + 14, 65, TRUE),
    (visac_id, 'Canal de escuta ativa · Implantação', 'Canal seguro e anônimo para relatos e sugestões', 'em_andamento', 'alto', 'RH Corporativo', CURRENT_DATE + 9, 80, TRUE),
    (visac_id, 'Inventário de riscos psicossociais · NR-1', 'Inventário completo conforme Portaria MTE 1.419/2024', 'concluido', 'critico', 'HumanizAÇÃO', CURRENT_DATE - 15, 100, TRUE),
    (visac_id, 'Capacitação gestores · Saúde mental', 'Workshop sobre saúde mental no trabalho para 12 gestores', 'pendente', 'moderado', 'DHO · SESMT', CURRENT_DATE + 29, 10, TRUE),
    (visac_id, 'Revisão da carga horária · Manutenção', 'Análise e redistribuição das jornadas no setor mais crítico', 'pendente', 'critico', 'Diretoria Operacional', CURRENT_DATE + 21, 0, TRUE),
    (visac_id, 'Pesquisa pulso · Monitoramento mensal', 'Implementar avaliações mensais rápidas (10 perguntas)', 'pendente', 'moderado', 'RH Corporativo', CURRENT_DATE + 45, 0, TRUE);

END $$;
