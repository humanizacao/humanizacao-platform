'use client'

import { useDashboardStore } from '@/store'
import { format, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PlanoAcao } from '@/types'

// ── Planos Widget ────────────────────────────────────────────

export default function PlanosWidget() {
  const { plans, updatePlanStatus, loading } = useDashboardStore()

  const today = new Date().toISOString().split('T')[0]
  const overdue = plans.filter(p => p.due_date < today && !['concluido', 'cancelado'].includes(p.status))
  const active = plans.filter(p => !['concluido', 'cancelado'].includes(p.status))

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dde5ef] flex items-center justify-between">
        <div>
          <div className="section-title">✅ Planos de Ação</div>
          <div className="text-[11px] text-[#8899b0] mt-0.5">Gestão corretiva e preventiva</div>
        </div>
        {overdue.length > 0 && (
          <span className="text-[11px] font-bold text-[#e05252]">
            ⚠ {overdue.length} em atraso
          </span>
        )}
      </div>

      <div className="divide-y divide-[#dde5ef]">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-8 text-[#8899b0] text-sm">
            <div className="text-3xl mb-2">🎉</div>
            Nenhum plano ativo
          </div>
        ) : (
          active.slice(0, 5).map(plan => (
            <PlanoItem key={plan.id} plan={plan} today={today} onUpdate={updatePlanStatus} />
          ))
        )}
      </div>

      {active.length > 5 && (
        <div className="px-6 py-3 border-t border-[#dde5ef]">
          <button className="text-teal text-xs font-semibold hover:underline">
            Ver todos os {active.length} planos →
          </button>
        </div>
      )}
    </div>
  )
}

function PlanoItem({ plan, today, onUpdate }: {
  plan: PlanoAcao
  today: string
  onUpdate: (id: string, status: string, progress: number) => void
}) {
  const isOverdue = plan.due_date < today && !['concluido', 'cancelado'].includes(plan.status)
  const isInProgress = plan.status === 'em_andamento'
  const isDone = plan.status === 'concluido'

  const statusDotColor = isDone ? 'bg-teal-bright' :
    isOverdue ? 'bg-[#e05252] ring-2 ring-[#e05252]/20' :
    isInProgress ? 'bg-[#e8a53a] ring-2 ring-[#e8a53a]/20' :
    'bg-[#c4d0df]'

  const dueLabel = isOverdue
    ? `⚠ Venceu ${format(parseISO(plan.due_date), 'dd/MM', { locale: ptBR })}`
    : `📅 ${format(parseISO(plan.due_date), 'dd/MM/yyyy', { locale: ptBR })}`

  return (
    <div className="flex items-start gap-3 px-6 py-4 hover:bg-[#f6f8fb]/50 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusDotColor}`} />

      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-navy leading-tight mb-1 truncate">
          {plan.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {plan.sector && (
            <span className="text-[10px] text-[#8899b0]">{plan.sector.name}</span>
          )}
          <span className={`text-[10px] font-mono font-medium ${isOverdue ? 'text-[#e05252]' : 'text-[#8899b0]'}`}>
            {dueLabel}
          </span>
        </div>

        {/* Progress bar */}
        {isInProgress && (
          <div className="mt-2 w-full h-1 bg-[#f0f4f8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-bright transition-all duration-500"
              style={{ width: `${plan.progress}%` }}
            />
          </div>
        )}
      </div>

      {isDone ? (
        <span className="text-teal text-base flex-shrink-0">✅</span>
      ) : (
        <button
          onClick={() => onUpdate(plan.id, 'concluido', 100)}
          className="text-[10px] text-[#8899b0] hover:text-teal font-semibold transition-colors flex-shrink-0"
        >
          ✓
        </button>
      )}
    </div>
  )
}

// ── Participation Widget ─────────────────────────────────────

export function ParticipationWidget() {
  const { sectors, loading } = useDashboardStore()

  const totalEmployees = sectors.reduce((acc, s) => acc + s.sector.employee_count, 0)
  const totalParticipation = sectors.length
    ? sectors.reduce((acc, s) => acc + s.participation_rate, 0) / sectors.length
    : 0

  const SECTOR_COLORS = ['#3aab86', '#6c87e8', '#e8a53a', '#4fcba0', '#e05252']

  const circumference = 2 * Math.PI * 46
  const participationDash = (totalParticipation / 100) * circumference

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dde5ef]">
        <div className="section-title">📊 Participação por Setor</div>
        <div className="text-[11px] text-[#8899b0] mt-0.5">Taxa de resposta · Avaliação atual</div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-32 w-32 rounded-full mx-auto" />
            <div className="skeleton h-4 w-40 rounded-lg mx-auto" />
          </div>
        ) : (
          <>
            {/* Big number */}
            <div className="font-display text-[52px] text-navy tracking-[-2px] leading-none">
              {totalParticipation.toFixed(0)}
              <span className="text-[24px] text-[#8899b0]">%</span>
            </div>
            <div className="text-[12px] text-[#8899b0] mb-5">
              taxa global de participação · {totalEmployees} colaboradores
            </div>

            {/* Donut chart SVG */}
            <div className="flex justify-center mb-5">
              <div className="relative w-28 h-28">
                <svg width="112" height="112" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#eef2f7" strokeWidth="14" />
                  <circle
                    cx="60" cy="60" r="46"
                    fill="none"
                    stroke="#3aab86"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${participationDash} ${circumference}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-bold text-navy">
                    {totalParticipation.toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-[#8899b0] font-medium">respondido</span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {sectors.map((s, i) => (
                <div key={s.sector.id} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                  />
                  <div className="flex-1 text-xs text-[#5a6f8a] truncate">{s.sector.name}</div>
                  <div className="font-mono text-xs font-semibold text-navy">
                    {s.participation_rate.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-[#8899b0]">{s.sector.employee_count}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
