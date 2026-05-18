'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Avaliacao } from '@/types'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'text-[#8899b0] bg-[#f0f4f8] border-[#dde5ef]', dot: 'bg-[#c4d0df]' },
  ativa: { label: 'Ativa', color: 'text-teal bg-teal/10 border-teal/30', dot: 'bg-teal-bright animate-pulse' },
  encerrada: { label: 'Encerrada', color: 'text-[#5a6f8a] bg-[#f0f4f8] border-[#dde5ef]', dot: 'bg-[#8899b0]' },
  arquivada: { label: 'Arquivada', color: 'text-[#8899b0] bg-[#f0f4f8] border-[#dde5ef]', dot: 'bg-[#c4d0df]' },
}

export default function AvaliacoesPage() {
  const router = useRouter()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchAvaliacoes()
  }, [filter])

  const fetchAvaliacoes = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/avaliacoes${params}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setAvaliacoes(data.data || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  const activateAvaliacao = async (id: string) => {
    try {
      const res = await fetch(`/api/avaliacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ativa', start_date: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Avaliação ativada!')
      fetchAvaliacoes()
    } catch {
      toast.error('Erro ao ativar avaliação')
    }
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/avaliacao/responder/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Avaliações Psicossociais</h1>
          <p className="text-[#8899b0] text-sm mt-1">
            {total} avaliação{total !== 1 ? 'ões' : ''} · Conformidade NR-1
          </p>
        </div>
        <button
          onClick={() => router.push('/avaliacao/nova')}
          className="btn-primary flex items-center gap-2"
        >
          ＋ Nova Avaliação
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'ativa', label: 'Ativas' },
          { key: 'rascunho', label: 'Rascunhos' },
          { key: 'encerrada', label: 'Encerradas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filter === f.key
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-[#8899b0] border-[#dde5ef] hover:bg-[#f6f8fb]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-lg font-bold text-navy mb-2">Nenhuma avaliação encontrada</div>
          <p className="text-[#8899b0] text-sm mb-6">Crie sua primeira avaliação psicossocial conforme NR-1</p>
          <button onClick={() => router.push('/avaliacao/nova')} className="btn-primary">
            Criar Avaliação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map((av) => {
            const status = STATUS_CONFIG[av.status]
            return (
              <div key={av.id} className="card card-hover overflow-hidden group">
                <div className="flex items-center gap-5 p-6">
                  {/* Status indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status.dot}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-navy text-[15px] truncate">{av.title}</h3>
                      <span className={`badge border ${status.color}`}>{status.label}</span>
                      {av.anonymous && (
                        <span className="text-[9px] font-bold text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-md">
                          🔒 Anônima
                        </span>
                      )}
                    </div>
                    {av.description && (
                      <p className="text-sm text-[#5a6f8a] truncate">{av.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-[#8899b0]">
                        📅 Criada em {format(new Date(av.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {av.end_date && (
                        <span className="text-[11px] text-[#8899b0]">
                          ⏰ Encerra {format(new Date(av.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    {av.status === 'ativa' && (
                      <div className="text-center">
                        <div className="font-mono text-xl font-bold text-navy">
                          {av.completion_rate.toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-[#8899b0]">participação</div>
                        <div className="w-20 h-1 bg-[#f0f4f8] rounded-full mt-1">
                          <div
                            className="h-full rounded-full bg-teal-bright"
                            style={{ width: `${av.completion_rate}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-mono text-xl font-bold text-navy">
                        {av.participation_count}
                      </div>
                      <div className="text-[10px] text-[#8899b0]">respostas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-xl font-bold text-navy">
                        {av.target_count || '—'}
                      </div>
                      <div className="text-[10px] text-[#8899b0]">meta</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {av.status === 'rascunho' && (
                      <button
                        onClick={() => activateAvaliacao(av.id)}
                        className="btn-teal text-xs px-3 py-2"
                      >
                        ▶ Ativar
                      </button>
                    )}
                    {av.status === 'ativa' && (
                      <button
                        onClick={() => copyLink(av.id)}
                        className="btn-secondary text-xs px-3 py-2"
                      >
                        🔗 Link
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/avaliacao/${av.id}`)}
                      className="btn-ghost text-xs"
                    >
                      Ver →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
