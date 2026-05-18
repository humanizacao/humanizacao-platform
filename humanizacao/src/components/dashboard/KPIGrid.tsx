'use client'

import { useDashboardStore } from '@/store'
import { RISK_COLORS } from '@/types'
import type { RiskLevel } from '@/types'

interface KPIConfig {
  key: keyof import('@/types').DashboardKPIs
  label: string
  icon: string
  unit?: string
  deltaKey?: keyof import('@/types').DashboardKPIs
  format?: 'number' | 'percent' | 'score' | 'count'
  iconBg: string
  accentColor: string
  critical?: boolean
  invertDelta?: boolean // true = lower is better
}

const KPI_CONFIGS: KPIConfig[] = [
  {
    key: 'global_risk_score',
    label: 'Índice Global de Risco Psicossocial',
    icon: '⚠️',
    unit: '/100',
    deltaKey: 'delta_risk_score',
    format: 'score',
    iconBg: 'bg-[#e05252]/10',
    accentColor: '#e05252',
    invertDelta: true,
  },
  {
    key: 'emotional_exhaustion_pct',
    label: 'Índice de Exaustão Emocional',
    icon: '🔥',
    unit: '%',
    deltaKey: 'delta_exhaustion',
    format: 'percent',
    iconBg: 'bg-[#e8a53a]/10',
    accentColor: '#e8a53a',
    invertDelta: true,
  },
  {
    key: 'psychological_safety_score',
    label: 'Segurança Psicológica',
    icon: '🛡',
    unit: '/100',
    deltaKey: 'delta_safety',
    format: 'score',
    iconBg: 'bg-[#6c87e8]/10',
    accentColor: '#6c87e8',
  },
  {
    key: 'healthy_leadership_score',
    label: 'Índice de Liderança Saudável',
    icon: '👑',
    unit: '/100',
    format: 'score',
    iconBg: 'bg-teal/10',
    accentColor: '#3aab86',
  },
  {
    key: 'burnout_risk_count',
    label: 'Risco de Burnout Detectado · IA',
    icon: '😮‍💨',
    unit: ' colab.',
    format: 'count',
    iconBg: 'bg-[#e05252]/10',
    accentColor: '#e05252',
    invertDelta: true,
  },
  {
    key: 'absenteeism_trend',
    label: 'Tendência de Absenteísmo',
    icon: '📉',
    unit: '%',
    format: 'percent',
    iconBg: 'bg-[#e8a53a]/10',
    accentColor: '#e8a53a',
    invertDelta: true,
  },
  {
    key: 'participation_rate',
    label: 'Taxa de Participação',
    icon: '✅',
    unit: '%',
    deltaKey: 'delta_participation',
    format: 'percent',
    iconBg: 'bg-teal/10',
    accentColor: '#3aab86',
  },
  {
    key: 'active_plans',
    label: 'Planos de Ação Ativos',
    icon: '📋',
    unit: ' ativos',
    format: 'count',
    iconBg: 'bg-[#6c87e8]/10',
    accentColor: '#6c87e8',
  },
]

export default function KPIGrid() {
  const { kpis, loading } = useDashboardStore()

  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {KPI_CONFIGS.map((config, i) => {
        const value = kpis[config.key] as number
        const delta = config.deltaKey ? kpis[config.deltaKey] as number : null
        const isPositiveDelta = config.invertDelta ? (delta || 0) < 0 : (delta || 0) > 0
        const isNegativeDelta = config.invertDelta ? (delta || 0) > 0 : (delta || 0) < 0

        return (
          <div
            key={config.key}
            className="kpi-card group"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl transition-all duration-300 group-hover:h-1"
              style={{ background: config.accentColor }}
            />

            <div className="flex items-start justify-between mb-3">
              <div className="text-[10.5px] font-semibold text-[#8899b0] uppercase tracking-[0.8px] leading-tight max-w-[160px]">
                {config.label}
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${config.iconBg}`}>
                {config.icon}
              </div>
            </div>

            <div className="font-mono text-[32px] font-bold text-navy tracking-[-1px] leading-none mb-1.5">
              {formatValue(value, config.format)}
              <span className="text-base text-[#8899b0] font-medium ml-0.5">{config.unit}</span>
            </div>

            {delta !== null ? (
              <div className={`flex items-center gap-1 text-[11.5px] font-semibold ${
                isPositiveDelta ? 'text-teal-bright' :
                isNegativeDelta ? 'text-[#e05252]' :
                'text-[#8899b0]'
              }`}>
                {isPositiveDelta ? '▼' : isNegativeDelta ? '▲' : '●'}
                {' '}
                {Math.abs(delta).toFixed(1)}
                <span className="text-[#8899b0] font-normal text-[10px] ml-0.5">vs mês anterior</span>
              </div>
            ) : (
              <div className="text-[11px] text-[#8899b0]">
                {config.key === 'active_plans' && kpis.overdue_plans > 0
                  ? `⚠ ${kpis.overdue_plans} em atraso`
                  : config.key === 'burnout_risk_count'
                  ? 'Cluster detectado pela IA'
                  : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatValue(value: number, format?: string): string {
  if (!value && value !== 0) return '—'
  switch (format) {
    case 'percent': return value.toFixed(1)
    case 'score': return Math.round(value).toString()
    case 'count': return Math.round(value).toString()
    default: return value.toFixed(1)
  }
}
