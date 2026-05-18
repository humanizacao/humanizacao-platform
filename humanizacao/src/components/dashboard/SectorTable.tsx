'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardStore } from '@/store'
import { RISK_LABELS, RISK_COLORS } from '@/types'
import type { SectorRanking } from '@/types'

const RISK_BG = {
  critico: 'bg-[#e05252]/10 text-[#c0392b] border-[#e05252]/30',
  alto: 'bg-[#e8a53a]/10 text-[#b37c1a] border-[#e8a53a]/30',
  moderado: 'bg-[#6c87e8]/10 text-[#4a67d4] border-[#6c87e8]/30',
  baixo: 'bg-teal/10 text-[#1a7a5e] border-teal/30',
}

type SortKey = 'risk_score' | 'participation_rate' | 'plan_count'

export default function SectorTable() {
  const router = useRouter()
  const { sectors, loading } = useDashboardStore()
  const [sortKey, setSortKey] = useState<SortKey>('risk_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...sectors].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function setDir(fn: (d: 'asc' | 'desc') => 'asc' | 'desc') {
    setSortDir(fn(sortDir))
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className={`ml-1 text-[10px] ${sortKey === k ? 'text-teal' : 'text-[#c4d0df]'}`}>
      {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
    </span>
  )

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dde5ef] flex items-center justify-between">
        <div>
          <div className="section-title">Ranking de Criticidade · Setores</div>
          <div className="text-[11px] text-[#8899b0] mt-0.5">
            {sectors.length} setores analisados
          </div>
        </div>
        <button className="text-teal text-xs font-semibold hover:underline">
          Análise detalhada →
        </button>
      </div>

      {loading ? (
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Setor</th>
              <th className="table-header">Colaboradores</th>
              <th className="table-header cursor-pointer hover:text-navy" onClick={() => toggleSort('risk_score')}>
                Score de Risco <SortIcon k="risk_score" />
              </th>
              <th className="table-header">Dimensão Crítica</th>
              <th className="table-header cursor-pointer hover:text-navy" onClick={() => toggleSort('participation_rate')}>
                Participação <SortIcon k="participation_rate" />
              </th>
              <th className="table-header">Evolução</th>
              <th className="table-header">Status</th>
              <th className="table-header cursor-pointer hover:text-navy" onClick={() => toggleSort('plan_count')}>
                Planos <SortIcon k="plan_count" />
              </th>
              <th className="table-header">Ação</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <SectorRow key={item.sector.id} item={item} rank={i + 1} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function SectorRow({ item, rank }: { item: SectorRanking; rank: number }) {
  const router = useRouter()
  const rankColors = ['text-[#e05252]', 'text-[#e8a53a]', 'text-[#e8a53a]', 'text-[#6c87e8]', 'text-teal']

  return (
    <tr className="table-row group">
      <td className="table-cell">
        <span className={`font-mono font-bold text-sm ${rankColors[rank - 1] || 'text-[#8899b0]'}`}>
          {String(rank).padStart(2, '0')}
        </span>
      </td>

      <td className="table-cell">
        <div className="font-semibold text-navy text-sm">{item.sector.name}</div>
        <div className="text-[10px] text-[#8899b0] capitalize">{item.sector.type?.replace('_', ' ')}</div>
      </td>

      <td className="table-cell">
        <span className="font-mono text-sm text-[#5a6f8a]">{item.sector.employee_count}</span>
      </td>

      <td className="table-cell">
        <span className={`font-mono font-bold text-base ${
          item.risk_level === 'critico' ? 'text-[#e05252]' :
          item.risk_level === 'alto' ? 'text-[#e8a53a]' :
          item.risk_level === 'moderado' ? 'text-[#6c87e8]' :
          'text-teal'
        }`}>
          {item.risk_score.toFixed(1)}
        </span>
      </td>

      <td className="table-cell">
        <span className="text-xs text-[#5a6f8a]">{item.critical_dimension || '—'}</span>
      </td>

      <td className="table-cell">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-[#f0f4f8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.participation_rate}%`,
                background: item.participation_rate >= 80 ? '#3aab86' : item.participation_rate >= 60 ? '#e8a53a' : '#e05252',
              }}
            />
          </div>
          <span className="font-mono text-xs text-[#5a6f8a]">{item.participation_rate.toFixed(0)}%</span>
        </div>
      </td>

      <td className="table-cell">
        <span className={`font-bold text-xs ${
          item.trend > 0 ? 'text-[#e05252]' :
          item.trend < 0 ? 'text-teal-bright' :
          'text-[#8899b0]'
        }`}>
          {item.trend > 0 ? `▲ +${item.trend.toFixed(1)}` : item.trend < 0 ? `▼ ${item.trend.toFixed(1)}` : '● Estável'}
        </span>
      </td>

      <td className="table-cell">
        <span className={`badge border ${RISK_BG[item.risk_level]}`}>
          {RISK_LABELS[item.risk_level]}
        </span>
      </td>

      <td className="table-cell">
        <span className="font-mono text-sm text-[#5a6f8a]">{item.plan_count}</span>
      </td>

      <td className="table-cell">
        <button
          onClick={() => router.push(`/planos-acao?sector=${item.sector.id}`)}
          className="text-teal text-xs font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Ver plano →
        </button>
      </td>
    </tr>
  )
}
