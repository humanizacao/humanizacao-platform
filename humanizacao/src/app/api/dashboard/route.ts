import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { DashboardKPIs, SectorRanking } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const companyId = profile.company_id

    // ── Parallel data fetching ──────────────────────────────

    const [
      latestAssessment,
      previousAssessment,
      sectors,
      activePlans,
      overduePlans,
      insights,
      participationData,
    ] = await Promise.all([
      // Latest risk assessment
      supabase
        .from('risk_assessments')
        .select('*')
        .eq('company_id', companyId)
        .is('sector_id', null)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .single(),

      // Previous assessment (for deltas)
      supabase
        .from('risk_assessments')
        .select('overall_score, dimension_scores')
        .eq('company_id', companyId)
        .is('sector_id', null)
        .order('assessed_at', { ascending: false })
        .range(1, 1)
        .single(),

      // All sectors with risk
      supabase
        .from('sectors')
        .select('*, manager:profiles!manager_id(full_name)')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('risk_score', { ascending: false }),

      // Active action plans
      supabase
        .from('planos_acao')
        .select('id, status, priority, due_date')
        .eq('company_id', companyId)
        .in('status', ['pendente', 'em_andamento']),

      // Overdue plans
      supabase
        .from('planos_acao')
        .select('id')
        .eq('company_id', companyId)
        .in('status', ['pendente', 'em_andamento'])
        .lt('due_date', new Date().toISOString().split('T')[0]),

      // AI Insights (not dismissed)
      supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', companyId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(5),

      // Latest active avaliacao participation
      supabase
        .from('avaliacoes')
        .select('participation_count, target_count, completion_rate')
        .eq('company_id', companyId)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    // ── Compute KPIs ────────────────────────────────────────

    const assessment = latestAssessment.data
    const prevAssessment = previousAssessment.data

    const dimensionScores = assessment?.dimension_scores || {}
    const prevDimensionScores = prevAssessment?.dimension_scores || {}

    const kpis: DashboardKPIs = {
      global_risk_score: assessment?.overall_score || 0,
      global_risk_level: assessment?.risk_level || 'baixo',
      emotional_exhaustion_pct: dimensionScores['exaustao_emocional'] || 0,
      psychological_safety_score: 100 - (dimensionScores['seguranca_psicologica'] || 0),
      healthy_leadership_score: 100 - (dimensionScores['lideranca'] || 0),
      burnout_risk_count: insights.data?.filter(i => i.type === 'burnout_risk').reduce((acc, i) => acc + i.affected_count, 0) || 0,
      absenteeism_trend: (dimensionScores['exaustao_emocional'] || 0) * 0.08,
      turnover_tendency: (dimensionScores['reconhecimento'] || 0) * 0.6,
      participation_rate: participationData.data?.completion_rate || 0,
      active_plans: activePlans.data?.length || 0,
      overdue_plans: overduePlans.data?.length || 0,
      critical_sectors: sectors.data?.filter(s => s.risk_level === 'critico').length || 0,
      // Deltas
      delta_risk_score: assessment?.overall_score
        ? +(assessment.overall_score - (prevAssessment?.overall_score || assessment.overall_score)).toFixed(1)
        : 0,
      delta_exhaustion: dimensionScores['exaustao_emocional']
        ? +(dimensionScores['exaustao_emocional'] - (prevDimensionScores['exaustao_emocional'] || dimensionScores['exaustao_emocional'])).toFixed(1)
        : 0,
      delta_safety: 0,
      delta_participation: 0,
    }

    // ── Sector Ranking ──────────────────────────────────────

    const sectorRankings: SectorRanking[] = await Promise.all(
      (sectors.data || []).map(async (sector) => {
        const [sectorAssessment, sectorPlans] = await Promise.all([
          supabase
            .from('risk_assessments')
            .select('dimension_scores, participation_rate')
            .eq('company_id', companyId)
            .eq('sector_id', sector.id)
            .order('assessed_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('planos_acao')
            .select('id')
            .eq('company_id', companyId)
            .eq('sector_id', sector.id)
            .in('status', ['pendente', 'em_andamento']),
        ])

        const scores = sectorAssessment.data?.dimension_scores || {}
        const maxScore = Math.max(...Object.values(scores) as number[], 0)
        const criticalDim = Object.entries(scores).find(([, v]) => v === maxScore)?.[0] || '—'

        return {
          sector,
          risk_score: sector.risk_score,
          risk_level: sector.risk_level,
          participation_rate: sectorAssessment.data?.participation_rate || 0,
          critical_dimension: criticalDim,
          trend: 0,
          plan_count: sectorPlans.data?.length || 0,
        }
      })
    )

    // ── Heatmap Data ────────────────────────────────────────

    const { data: heatmapAssessments } = await supabase
      .from('risk_assessments')
      .select('period_label, dimension_scores, assessed_at')
      .eq('company_id', companyId)
      .is('sector_id', null)
      .order('assessed_at', { ascending: true })
      .limit(6)

    const dimensoesRes = await supabase
      .from('dimensoes')
      .select('*')
      .eq('active', true)
      .order('order_index')

    const heatmapData = (dimensoesRes.data || []).slice(0, 8).map(dim => ({
      dimensao: dim.name,
      dimensao_slug: dim.slug,
      months: (heatmapAssessments || []).map(a => {
        const score = (a.dimension_scores as Record<string, number>)[dim.slug] || 0
        return {
          label: a.period_label || new Date(a.assessed_at).toLocaleDateString('pt-BR', { month: 'short' }),
          score,
          level: score >= 75 ? 5 : score >= 60 ? 4 : score >= 45 ? 3 : score >= 25 ? 2 : score > 0 ? 1 : 0,
        }
      }),
    }))

    // ── Radar Data ──────────────────────────────────────────

    const radarData = (dimensoesRes.data || []).slice(0, 6).map(dim => ({
      dimensao: dim.name.split(' ')[0],
      current: (dimensionScores[dim.slug] || 0),
      benchmark: 30,
      fullMark: 100,
    }))

    // ── Trend Data ──────────────────────────────────────────

    const trendData = (heatmapAssessments || []).map(a => ({
      period: a.period_label || new Date(a.assessed_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      score: typeof a.dimension_scores === 'object' ? 0 : 0,
    }))

    return NextResponse.json({
      kpis,
      sectors: sectorRankings,
      insights: insights.data || [],
      heatmap: heatmapData,
      radar: radarData,
      trend: trendData,
      active_avaliacao: participationData.data,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
