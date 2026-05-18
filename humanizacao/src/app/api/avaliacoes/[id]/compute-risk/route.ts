import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify internal call
  const internalKey = request.headers.get('x-internal')
  if (internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const avaliacaoId = params.id

  try {
    // Get all completed responses
    const { data: respostas } = await supabase
      .from('respostas')
      .select('dimension_scores, overall_score, risk_level, sector_id')
      .eq('avaliacao_id', avaliacaoId)
      .eq('completed', true)

    if (!respostas || respostas.length === 0) {
      return NextResponse.json({ message: 'No responses yet' })
    }

    // Get avaliacao company
    const { data: avaliacao } = await supabase
      .from('avaliacoes')
      .select('company_id, target_count')
      .eq('id', avaliacaoId)
      .single()

    if (!avaliacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Aggregate dimension scores
    const dimAccumulators: Record<string, number[]> = {}
    let overallSum = 0

    for (const resposta of respostas) {
      overallSum += resposta.overall_score || 0
      const scores = resposta.dimension_scores as Record<string, number>
      for (const [dim, score] of Object.entries(scores)) {
        if (!dimAccumulators[dim]) dimAccumulators[dim] = []
        dimAccumulators[dim].push(score)
      }
    }

    const dimensionScores: Record<string, number> = {}
    for (const [dim, scores] of Object.entries(dimAccumulators)) {
      dimensionScores[dim] = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
    }

    const overallScore = +(overallSum / respostas.length).toFixed(2)
    const riskLevel = overallScore >= 75 ? 'critico'
      : overallScore >= 55 ? 'alto'
      : overallScore >= 35 ? 'moderado'
      : 'baixo'

    const participationRate = avaliacao.target_count > 0
      ? +(respostas.length / avaliacao.target_count * 100).toFixed(2)
      : 0

    // Upsert company-level risk assessment
    await supabase.from('risk_assessments').upsert({
      company_id: avaliacao.company_id,
      avaliacao_id: avaliacaoId,
      assessed_at: new Date().toISOString(),
      period_label: new Date().toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      dimension_scores: dimensionScores,
      overall_score: overallScore,
      risk_level: riskLevel,
      sample_size: respostas.length,
      participation_rate: participationRate,
    }, { onConflict: 'company_id,avaliacao_id' })

    // Per-sector assessments
    const sectorMap: Record<string, typeof respostas> = {}
    for (const r of respostas) {
      if (r.sector_id) {
        if (!sectorMap[r.sector_id]) sectorMap[r.sector_id] = []
        sectorMap[r.sector_id].push(r)
      }
    }

    for (const [sectorId, sectorRespostas] of Object.entries(sectorMap)) {
      const sectorDimScores: Record<string, number[]> = {}
      let sectorSum = 0
      for (const r of sectorRespostas) {
        sectorSum += r.overall_score || 0
        for (const [d, s] of Object.entries(r.dimension_scores as Record<string, number>)) {
          if (!sectorDimScores[d]) sectorDimScores[d] = []
          sectorDimScores[d].push(s)
        }
      }
      const sectorDims: Record<string, number> = {}
      for (const [d, ss] of Object.entries(sectorDimScores)) {
        sectorDims[d] = +(ss.reduce((a, b) => a + b) / ss.length).toFixed(2)
      }
      const sectorScore = +(sectorSum / sectorRespostas.length).toFixed(2)
      const sectorRisk = sectorScore >= 75 ? 'critico' : sectorScore >= 55 ? 'alto' : sectorScore >= 35 ? 'moderado' : 'baixo'

      await supabase.from('risk_assessments').upsert({
        company_id: avaliacao.company_id,
        avaliacao_id: avaliacaoId,
        sector_id: sectorId,
        assessed_at: new Date().toISOString(),
        dimension_scores: sectorDims,
        overall_score: sectorScore,
        risk_level: sectorRisk,
        sample_size: sectorRespostas.length,
      }, { onConflict: 'company_id,avaliacao_id,sector_id' })

      // Update sector risk score
      await supabase.from('sectors').update({
        risk_score: sectorScore,
        risk_level: sectorRisk,
      }).eq('id', sectorId)
    }

    // Generate AI insights
    const criticalDims = Object.entries(dimensionScores)
      .filter(([, s]) => s >= 65)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    if (criticalDims.length > 0) {
      const insightData = criticalDims.map(([dim, score]) => ({
        company_id: avaliacao.company_id,
        avaliacao_id: avaliacaoId,
        type: dim === 'exaustao_emocional' ? 'burnout_risk' : 'pattern',
        severity: score >= 75 ? 'critico' : score >= 55 ? 'alto' : 'moderado',
        title: `Atenção: ${dim.replace(/_/g, ' ')} acima do limiar`,
        body: `A dimensão "${dim.replace(/_/g, ' ')}" atingiu score de ${score} pontos, indicando risco ${score >= 75 ? 'crítico' : 'alto'} para os colaboradores. Recomenda-se intervenção imediata e criação de plano de ação.`,
        affected_count: Math.round(respostas.length * (score / 100)),
        confidence_score: 0.82,
        dismissed: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }))

      await supabase.from('ai_insights').insert(insightData)
    }

    return NextResponse.json({
      overall_score: overallScore,
      risk_level: riskLevel,
      dimension_scores: dimensionScores,
      sample_size: respostas.length,
    })
  } catch (error) {
    console.error('Compute risk error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
