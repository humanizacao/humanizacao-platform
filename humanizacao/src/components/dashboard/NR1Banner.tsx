'use client'

import { useState, useEffect } from 'react'
import { differenceInDays } from 'date-fns'
import { NR1_DEADLINE } from '@/types'
import { useDashboardStore } from '@/store'

export default function NR1Banner() {
  const { kpis } = useDashboardStore()
  const [days, setDays] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDays(differenceInDays(new Date(NR1_DEADLINE), new Date()))
  }, [])

  if (dismissed) return null

  const isUrgent = days <= 14
  const isExpired = days < 0
  const conformidade = 68 // Would come from kpis in production

  return (
    <div className={`relative rounded-2xl overflow-hidden ${isUrgent ? 'bg-gradient-to-r from-[#1a2b4a] to-[#243558]' : 'bg-gradient-to-r from-navy-deep to-navy'}`}>
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-light to-teal" />

      <div className="px-7 py-5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Icon */}
          <div className="w-11 h-11 bg-teal/15 border border-teal/25 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
            ⚖️
          </div>

          {/* Text */}
          <div>
            <div className="text-white font-bold text-sm mb-0.5">
              Prazo NR-1 · Portaria MTE nº 1.419/2024
              {isUrgent && !isExpired && (
                <span className="ml-2 text-[#e8a53a] text-[10px] font-bold uppercase tracking-wide animate-pulse">
                  ⚡ Urgente
                </span>
              )}
            </div>
            <div className="text-white/50 text-xs leading-relaxed">
              Inventário de Riscos Psicossociais concluído · PGR em finalização · Planos de ação ativos
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Days countdown */}
          <div className={`rounded-xl px-4 py-2.5 text-center border ${
            isExpired
              ? 'bg-[#e05252]/15 border-[#e05252]/30'
              : isUrgent
              ? 'bg-[#e8a53a]/15 border-[#e8a53a]/30'
              : 'bg-teal/15 border-teal/30'
          }`}>
            <div className={`font-mono text-2xl font-bold leading-none ${
              isExpired ? 'text-[#e05252]' : isUrgent ? 'text-[#e8a53a]' : 'text-teal-light'
            }`}>
              {isExpired ? '!' : Math.abs(days)}
            </div>
            <div className={`text-[9px] tracking-[2px] uppercase mt-0.5 ${
              isExpired ? 'text-[#e05252]/60' : isUrgent ? 'text-[#e8a53a]/60' : 'text-teal/60'
            }`}>
              {isExpired ? 'vencido' : 'dias restantes'}
            </div>
          </div>

          {/* Conformidade */}
          <div className="bg-teal/15 border border-teal/25 rounded-xl px-4 py-2.5 text-center">
            <div className="font-mono text-2xl font-bold text-teal-light leading-none">
              {conformidade}<span className="text-sm">%</span>
            </div>
            <div className="text-[9px] tracking-[2px] uppercase text-teal/60 mt-0.5">
              conformidade
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-white/25 hover:text-white/60 transition-colors text-lg ml-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
