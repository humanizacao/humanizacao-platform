import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'
import { z } from 'zod'
import type { RiskLevel } from '@/types'

const submitRespostaSchema = z.object({
  avaliacao_id: z.string().uuid(),
  respondent_token: z.string().optional(),
  sector_id: z.string().uuid().optional(),
  answers: z.record(z.object({
    value: z.union([z.string(), z.number()]),
    score: z.number().min(0).max(100),
  })),
  duration_seconds: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
})

function computeRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'critico'
  if (score >= 55) return 'alto'
  if (score >= 35) return 'moderado'
  return 'baixo'
}

// Compute dimension scores from answers and questions
async function computeDimensionScores(
  avaliacaoId: string,
  answers: Record<string, { value: string | number; score: number }>,
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<{ dimensionScores: Record<string, number>; overallScore: number }> {
  const { data: perguntas } = await supabase
    .from('perguntas')
    .select('id, dimensao_id, weight:dimensoes(weight), inverted_score, dimensao:dimensoes(slug)')
    .eq('avaliacao_id', avaliacaoId)

  const dimensionAccumulators: Record<string, { total: number; count: number; weight: number }> = {}

  for (const pergunta of perguntas || []) {
    const answer = answers[pergunta.id]
    if (!answer) continue

    const dimSlug = pergunta.dimensao?.[0]?.slug
    if (!dimSlug) continue

    let score = answer.score
    if (pergunta.inverted_score) score = 100 - score

    if (!dimensionAccumulators[dimSlug]) {
      dimensionAccumulators[dimSlug] = { total: 0, count: 0, weight: (pergunta.weight as { weight: number })?.weight || 1 }
    }
    dimensionAccumulators[dimSlug].total += score
    dimensionAccumulators[dimSlug].count += 1
  }

  const dimensionScores: Record<string, number> = {}
  let weightedTotal = 0
  let totalWeight = 0

  for (const [slug, acc] of Object.entries(dimensionAccumulators)) {
    const avgScore = acc.count > 0 ? acc.total / acc.count : 0
    dimensionScores[slug] = +avgScore.toFixed(2)
    weightedTotal += avgScore * acc.weight
    totalWeight += acc.weight
  }

  const overallScore = totalWeight > 0 ? +(weightedTotal / totalWeight).toFixed(2) : 0

  return { dimensionScores, overallScore }
}

// POST - submit a response
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    const body = await request.json()
    const validated = submitRespostaSchema.parse(body)

    // Get avaliacao to verify it's active and get company
    const { data: avaliacao, error: avaliacaoError } = await supabase
      .from('avaliacoes')
      .select('id, company_id, status, anonymous, end_date')
      .eq('id', validated.avaliacao_id)
      .single()

    if (avaliacaoError || !avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    if (avaliacao.status !== 'ativa') {
      return NextResponse.json({ error: 'Esta avaliação não está ativa' }, { status: 400 })
    }

    if (avaliacao.end_date && new Date(avaliacao.end_date) < new Date()) {
      return NextResponse.json({ error: 'Esta avaliação foi encerrada' }, { status: 400 })
    }

    // Check for duplicate response (non-anonymous)
    if (session && !avaliacao.anonymous) {
      const { data: existing } = await supabase
        .from('respostas')
        .select('id')
        .eq('avaliacao_id', validated.avaliacao_id)
        .eq('respondent_id', session.user.id)
        .eq('completed', true)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Você já respondeu esta avaliação' }, { status: 409 })
      }
    }

    // Compute scores
    const { dimensionScores, overallScore } = await computeDimensionScores(
      validated.avaliacao_id,
      validated.answers,
      supabase
    )

    const riskLevel = computeRiskLevel(overallScore)

    // Use admin client to bypass RLS for anonymous responses
    const dbClient = avaliacao.anonymous ? createAdminClient() : supabase

    // Insert response
    const { data: resposta, error: respostaError } = await dbClient
      .from('respostas')
      .insert({
        avaliacao_id: validated.avaliacao_id,
        company_id: avaliacao.company_id,
        respondent_id: avaliacao.anonymous ? null : session?.user.id,
        respondent_token: validated.respondent_token,
        sector_id: validated.sector_id,
        completed: true,
        completed_at: new Date().toISOString(),
        duration_seconds: validated.duration_seconds,
        answers: validated.answers,
        dimension_scores: dimensionScores,
        overall_score: overallScore,
        risk_level: riskLevel,
        metadata: {
          ...validated.metadata,
          // Strip PII if anonymous
          ...(avaliacao.anonymous ? {} : { user_agent: request.headers.get('user-agent') }),
        },
      })
      .select('id, overall_score, risk_level')
      .single()

    if (respostaError) throw respostaError

    // Trigger background risk assessment update (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/avaliacoes/${validated.avaliacao_id}/compute-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal': process.env.SUPABASE_SERVICE_ROLE_KEY! },
    }).catch(() => {}) // Fire and forget

    return NextResponse.json({
      data: {
        id: resposta.id,
        overall_score: resposta.overall_score,
        risk_level: resposta.risk_level,
        dimension_scores: dimensionScores,
        message: 'Resposta registrada com sucesso. Obrigado pela sua participação!',
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Resposta submission error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - list responses (analytics role required)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single()

    const analyticsRoles = ['admin_master', 'consultoria', 'rh_corporativo', 'dho', 'sesmt', 'auditoria']
    if (!profile || !analyticsRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const avaliacaoId = url.searchParams.get('avaliacao_id')
    const sectorId = url.searchParams.get('sector_id')

    let query = supabase
      .from('respostas')
      .select('id, sector_id, completed, dimension_scores, overall_score, risk_level, created_at, sector:sectors(name)', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .eq('completed', true)
      // IMPORTANT: Never expose individual answers or respondent_id in list view
      .order('created_at', { ascending: false })

    if (avaliacaoId) query = query.eq('avaliacao_id', avaliacaoId)
    if (sectorId) query = query.eq('sector_id', sectorId)

    const { data, count, error } = await query.limit(100)
    if (error) throw error

    // Aggregate stats
    const avgScore = data?.length
      ? data.reduce((acc, r) => acc + (r.overall_score || 0), 0) / data.length
      : 0

    const riskDistribution = data?.reduce((acc, r) => {
      acc[r.risk_level || 'baixo'] = (acc[r.risk_level || 'baixo'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      data,
      total: count || 0,
      stats: {
        avg_score: +avgScore.toFixed(2),
        risk_distribution: riskDistribution,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
