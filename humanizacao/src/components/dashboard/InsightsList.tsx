'use client'

import { useDashboardStore } from '@/store'
import type { AIInsight } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SEVERITY_CONFIG = {
  critico: {
    tag: '🔴 Crítico',
    tagColor: 'text-[#e05252]',
    border: 'border-l-[#e05252]',
    bg: 'bg-[#f6f8fb]',
  },
  alto: {
    tag: '🟡 Alerta',
    tagColor: 'text-[#e8a53a]',
    border: 'border-l-[#e8a53a]',
    bg: 'bg-[#f6f8fb]',
  },
  moderado: {
    tag: '🔵 Observação',
    tagColor: 'text-[#6c87e8]',
    border: 'border-l-[#6c87e8]',
    bg: 'bg-[#f6f8fb]',
  },
  baixo: {
    tag: '🟢 Oportunidade',
    tagColor: 'text-teal',
    border: 'border-l-teal',
    bg: 'bg-[#f6f8fb]',
  },
}

const TYPE_LABELS = {
  burnout_risk: 'Risco de Burnout',
  turnover_risk: 'Risco de Turnover',
  pattern: 'Padrão Detectado',
  opportunity: 'Oportunidade',
  compliance: 'Compliance NR-1',
}

export default function InsightsList() {
  const { insights, dismissInsight, loading } = useDashboardStore()

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#dde5ef]">
          <div className="skeleton h-5 w-32 rounded-lg" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dde5ef] flex items-center justify-between">
        <div>
          <div className="section-title flex items-center gap-2">
            🤖 Insights da IA
            {insights.length > 0 && (
              <span className="bg-[#e05252] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                {insights.length}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#8899b0] mt-0.5">Análise preditiva automática</div>
        </div>
        <span className="text-[9px] font-bold bg-navy text-teal-light px-2 py-1 rounded-md tracking-wider uppercase">
          NR-1 AI
        </span>
      </div>

      <div className="p-4 space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-[#8899b0] text-sm">
            <div className="text-3xl mb-2">✅</div>
            Nenhum insight crítico no momento
          </div>
        ) : (
          insights.slice(0, 3).map(insight => (
            <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
          ))
        )}
      </div>

      {insights.length > 3 && (
        <div className="px-6 pb-4">
          <button className="text-teal text-xs font-semibold hover:underline">
            Ver todos os {insights.length} insights →
          </button>
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: (id: string) => void }) {
  const config = SEVERITY_CONFIG[insight.severity]
  const timeAgo = formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: ptBR })

  return (
    <div className={`${config.bg} border border-[#dde5ef] border-l-4 ${config.border} rounded-xl p-4 cursor-pointer hover:border-teal-bright/30 hover:shadow-sm transition-all group`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold tracking-wider uppercase ${config.tagColor}`}>
            {config.tag}
          </span>
          <span className="text-[9px] text-[#8899b0] font-medium">
            {TYPE_LABELS[insight.type]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="bg-navy text-teal-light text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
            IA
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(insight.id) }}
            className="opacity-0 group-hover:opacity-100 text-[#8899b0] hover:text-[#e05252] transition-all text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <p className="text-[12px] text-[#5a6f8a] leading-[1.55] font-normal">
        {insight.body}
      </p>

      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[10px] text-[#8899b0]">⏱ {timeAgo}</span>
        {insight.affected_count > 0 && (
          <span className="text-[10px] text-[#8899b0]">· {insight.affected_count} colaboradores</span>
        )}
        {insight.confidence_score > 0 && (
          <span className="text-[10px] text-[#8899b0]">· Confiança: {Math.round(insight.confidence_score * 100)}%</span>
        )}
      </div>
    </div>
  )
}
