'use client'

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useDashboardStore } from '@/store'

// ── Heatmap Chart ────────────────────────────────────────────

export default function HeatmapChart() {
  const { heatmap, loading } = useDashboardStore()

  const LEVEL_COLORS = [
    '#eef2f7', // 0 - no data
    'rgba(58,171,134,0.25)', // 1 - low
    'rgba(58,171,134,0.5)',  // 2 - moderate-low
    'rgba(232,165,58,0.55)', // 3 - moderate-high
    'rgba(224,82,82,0.55)',  // 4 - high
    'rgba(180,30,30,0.7)',   // 5 - critical
  ]

  if (loading) return <div className="card skeleton h-72" />

  return (
    <div className="card overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-[#dde5ef] flex items-center justify-between">
        <div>
          <div className="section-title">Heatmap de Risco · Evolução Temporal</div>
          <div className="text-[11px] text-[#8899b0] mt-0.5">Intensidade por dimensão psicossocial</div>
        </div>
        <div className="flex gap-1.5">
          {['Dimensões', 'Setores'].map((label, i) => (
            <button key={label} className={`text-[10.5px] font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
              i === 0
                ? 'bg-navy text-white border-navy'
                : 'text-[#8899b0] border-[#dde5ef] hover:bg-[#f6f8fb]'
            }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {heatmap.length === 0 ? (
          <EmptyState message="Dados de heatmap indisponíveis" />
        ) : (
          <div className="space-y-1.5">
            {/* Month labels */}
            <div className="flex ml-[108px] gap-1">
              {(heatmap[0]?.months || []).map((m, i) => (
                <div key={i} className="flex-1 text-center text-[9px] font-semibold text-[#8899b0] tracking-wider uppercase">
                  {m.label}
                </div>
              ))}
            </div>

            {/* Dimension rows */}
            {heatmap.map((row) => (
              <div key={row.dimensao_slug} className="flex items-center gap-1">
                <div className="w-[104px] text-[10.5px] font-medium text-[#5a6f8a] pr-2 text-right truncate flex-shrink-0">
                  {row.dimensao.split(' ').slice(0, 2).join(' ')}
                </div>
                {row.months.map((m, j) => (
                  <div
                    key={j}
                    className="flex-1 h-7 rounded-md transition-transform duration-150 hover:scale-110 hover:z-10 cursor-pointer group relative"
                    style={{ background: LEVEL_COLORS[m.level] }}
                    title={`${row.dimensao}: ${m.score.toFixed(1)} (${m.label})`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-navy text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {row.dimensao}: {m.score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-[10px] text-[#8899b0] font-medium">Intensidade:</span>
              {[
                { label: 'Baixo', color: LEVEL_COLORS[1] },
                { label: 'Moderado', color: LEVEL_COLORS[3] },
                { label: 'Alto', color: LEVEL_COLORS[4] },
                { label: 'Crítico', color: LEVEL_COLORS[5] },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-sm" style={{ background: item.color }} />
                  <span className="text-[9.5px] text-[#8899b0]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Radar Chart ──────────────────────────────────────────────

export function RadarChart() {
  const { radar, loading } = useDashboardStore()

  if (loading) return <div className="card skeleton h-72" />

  return (
    <div className="card overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-[#dde5ef]">
        <div className="section-title">Radar Organizacional</div>
        <div className="text-[11px] text-[#8899b0] mt-0.5">Perfil de risco multidimensional</div>
      </div>

      <div className="p-4" style={{ height: '280px' }}>
        {radar.length === 0 ? (
          <EmptyState message="Dados de radar indisponíveis" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadar data={radar}>
              <PolarGrid stroke="#dde5ef" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="dimensao"
                tick={{ fontSize: 10, fill: '#5a6f8a', fontFamily: 'Outfit', fontWeight: 500 }}
              />
              <Radar
                name="Risco Atual"
                dataKey="current"
                stroke="#e05252"
                strokeWidth={2}
                fill="#e05252"
                fillOpacity={0.15}
              />
              <Radar
                name="Referência"
                dataKey="benchmark"
                stroke="#3aab86"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="#3aab86"
                fillOpacity={0.08}
              />
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'Outfit', paddingTop: '8px' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a2b4a',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontFamily: 'Outfit',
                  color: 'white',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}`, '']}
              />
            </RechartsRadar>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Risk Bars ────────────────────────────────────────────────

export function RiskBars() {
  const { kpis, loading } = useDashboardStore()

  const DIMENSIONS = [
    { key: 'reconhecimento', label: 'Reconhecimento', color: '#e05252', level: 'critico' as const },
    { key: 'carga_trabalho', label: 'Carga de Trabalho', color: '#e05252', level: 'critico' as const },
    { key: 'exaustao_emocional', label: 'Exaustão Emocional', color: '#e8a53a', level: 'alto' as const },
    { key: 'equilibrio_vida_trabalho', label: 'Equil. Vida/Trabalho', color: '#e8a53a', level: 'alto' as const },
    { key: 'seguranca_psicologica', label: 'Seg. Psicológica', color: '#6c87e8', level: 'moderado' as const },
    { key: 'relacoes_interpessoais', label: 'Relacionamentos', color: '#6c87e8', level: 'moderado' as const },
    { key: 'lideranca', label: 'Liderança', color: '#3aab86', level: 'baixo' as const },
  ]

  const LEVEL_CHIPS = {
    critico: 'bg-[#e05252]/10 text-[#c0392b] border-[#e05252]/30',
    alto: 'bg-[#e8a53a]/10 text-[#b37c1a] border-[#e8a53a]/30',
    moderado: 'bg-[#6c87e8]/10 text-[#4a67d4] border-[#6c87e8]/30',
    baixo: 'bg-teal/10 text-[#1a7a5e] border-teal/30',
  }

  const LEVEL_LABELS = { critico: 'Crítico', alto: 'Alto', moderado: 'Moderado', baixo: 'Baixo' }

  if (loading) return <div className="card skeleton h-72" />

  return (
    <div className="card overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-[#dde5ef]">
        <div className="section-title">Risco por Dimensão</div>
        <div className="text-[11px] text-[#8899b0] mt-0.5">Score consolidado organizacional</div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {DIMENSIONS.map((dim, i) => {
          // In production, these come from kpis.dimension_scores
          const score = [82, 78, 65, 61, 44, 38, 29][i]
          return (
            <div key={dim.key} className="flex items-center gap-2.5">
              <div className="text-[11px] font-medium text-[#5a6f8a] w-[110px] flex-shrink-0 truncate">
                {dim.label}
              </div>
              <div className="flex-1 bg-[#f0f4f8] rounded-md h-[26px] overflow-hidden relative">
                <div
                  className="h-full rounded-md flex items-center transition-all duration-700 ease-out"
                  style={{
                    width: `${score}%`,
                    background: `linear-gradient(90deg, ${dim.color}cc, ${dim.color})`,
                  }}
                >
                  <span className="absolute right-2 text-white text-[10px] font-mono font-bold">
                    {score}
                  </span>
                </div>
              </div>
              <span className={`badge border text-[9px] w-16 justify-center ${LEVEL_CHIPS[dim.level]}`}>
                {LEVEL_LABELS[dim.level]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared empty state ───────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-[#8899b0] text-sm">
      {message}
    </div>
  )
}
