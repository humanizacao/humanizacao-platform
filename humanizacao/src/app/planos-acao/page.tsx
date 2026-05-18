'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PlanoAcao } from '@/types'
import { ACTION_STATUS_LABELS, RISK_LABELS } from '@/types'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pendente: 'border-[#dde5ef] bg-white',
  em_andamento: 'border-[#e8a53a]/30 bg-[#e8a53a]/5',
  concluido: 'border-teal/30 bg-teal/5',
  cancelado: 'border-[#dde5ef] bg-[#f6f8fb] opacity-60',
  atrasado: 'border-[#e05252]/30 bg-[#e05252]/5',
}

const STATUS_BADGE = {
  pendente: 'text-[#8899b0] bg-[#f0f4f8] border-[#dde5ef]',
  em_andamento: 'text-[#b37c1a] bg-[#e8a53a]/10 border-[#e8a53a]/30',
  concluido: 'text-teal bg-teal/10 border-teal/30',
  cancelado: 'text-[#8899b0] bg-[#f0f4f8] border-[#dde5ef]',
  atrasado: 'text-[#c0392b] bg-[#e05252]/10 border-[#e05252]/30',
}

const PRIORITY_COLORS = {
  baixo: 'bg-teal/10 text-teal border-teal/25',
  moderado: 'bg-[#6c87e8]/10 text-[#4a67d4] border-[#6c87e8]/25',
  alto: 'bg-[#e8a53a]/10 text-[#b37c1a] border-[#e8a53a]/25',
  critico: 'bg-[#e05252]/10 text-[#c0392b] border-[#e05252]/25',
}

const KANBAN_COLUMNS = [
  { key: 'pendente', label: 'Pendente', icon: '⏳' },
  { key: 'em_andamento', label: 'Em Andamento', icon: '🔄' },
  { key: 'concluido', label: 'Concluído', icon: '✅' },
  { key: 'atrasado', label: 'Atrasado', icon: '⚠️' },
]

export default function PlanosPage() {
  const router = useRouter()
  const [planos, setPlanos] = useState<PlanoAcao[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'lista'>('lista')
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchPlanos()
  }, [])

  const fetchPlanos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/planos')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const today = new Date().toISOString().split('T')[0]
      // Mark overdue
      const enriched = (data.data || []).map((p: PlanoAcao) => ({
        ...p,
        status: ['pendente', 'em_andamento'].includes(p.status) && p.due_date < today
          ? 'atrasado' as const
          : p.status,
      }))
      setPlanos(enriched)
      setStats(data.stats?.by_status || {})
    } catch {
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/planos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...(status === 'concluido' ? { progress: 100, completed_date: new Date().toISOString().split('T')[0] } : {}) }),
      })
      toast.success('Status atualizado')
      fetchPlanos()
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Planos de Ação</h1>
          <p className="text-[#8899b0] text-sm mt-1">Gestão corretiva e preventiva · NR-1</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-[#dde5ef] rounded-xl overflow-hidden">
            {[
              { key: 'lista', label: '≡ Lista' },
              { key: 'kanban', label: '⊞ Kanban' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key as 'lista' | 'kanban')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  view === v.key ? 'bg-navy text-white' : 'text-[#8899b0] hover:bg-[#f6f8fb]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            ＋ Novo Plano
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { key: 'em_andamento', label: 'Em andamento', icon: '🔄', color: 'text-[#e8a53a]' },
          { key: 'atrasado', label: 'Em atraso', icon: '⚠️', color: 'text-[#e05252]' },
          { key: 'pendente', label: 'Pendentes', icon: '⏳', color: 'text-[#8899b0]' },
          { key: 'concluido', label: 'Concluídos', icon: '✅', color: 'text-teal' },
        ].map(s => (
          <div key={s.key} className="card p-4 flex items-center gap-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className={`font-mono text-2xl font-bold ${s.color}`}>
                {planos.filter(p => p.status === s.key).length}
              </div>
              <div className="text-[11px] text-[#8899b0]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : planos.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <div className="text-lg font-bold text-navy mb-2">Nenhum plano de ação</div>
          <p className="text-[#8899b0] text-sm mb-6">Crie planos a partir dos insights da IA ou manualmente</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Criar Plano</button>
        </div>
      ) : view === 'lista' ? (
        <ListView planos={planos} today={today} onStatusChange={updateStatus} />
      ) : (
        <KanbanView planos={planos} today={today} onStatusChange={updateStatus} />
      )}

      {showModal && <CreatePlanoModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchPlanos() }} />}
    </div>
  )
}

function ListView({ planos, today, onStatusChange }: { planos: PlanoAcao[]; today: string; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Título</th>
            <th className="table-header">Setor</th>
            <th className="table-header">Responsável</th>
            <th className="table-header">Prazo</th>
            <th className="table-header">Prioridade</th>
            <th className="table-header">Status</th>
            <th className="table-header">Progresso</th>
            <th className="table-header">Ações</th>
          </tr>
        </thead>
        <tbody>
          {planos.map(p => {
            const isOverdue = p.status === 'atrasado' || (['pendente', 'em_andamento'].includes(p.status) && p.due_date < today)
            return (
              <tr key={p.id} className="table-row">
                <td className="table-cell">
                  <div className="font-semibold text-navy text-sm max-w-[240px] truncate">{p.title}</div>
                  {p.dimensao && <div className="text-[10px] text-[#8899b0] mt-0.5">{p.dimensao.icon} {p.dimensao.name}</div>}
                </td>
                <td className="table-cell">
                  <span className="text-xs text-[#5a6f8a]">{p.sector?.name || '—'}</span>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-[#5a6f8a]">{p.responsible_name || '—'}</span>
                </td>
                <td className="table-cell">
                  <span className={`text-xs font-mono font-semibold ${isOverdue ? 'text-[#e05252]' : 'text-[#5a6f8a]'}`}>
                    {p.due_date ? format(parseISO(p.due_date), 'dd/MM/yyyy') : '—'}
                    {isOverdue && ' ⚠'}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge border ${PRIORITY_COLORS[p.priority]}`}>
                    {RISK_LABELS[p.priority]}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge border ${STATUS_BADGE[p.status]}`}>
                    {ACTION_STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#f0f4f8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-bright"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#8899b0]">{p.progress}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  {p.status !== 'concluido' && p.status !== 'cancelado' && (
                    <button
                      onClick={() => onStatusChange(p.id, 'concluido')}
                      className="text-xs text-teal font-semibold hover:underline"
                    >
                      Concluir
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KanbanView({ planos, today, onStatusChange }: { planos: PlanoAcao[]; today: string; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(col => {
        const colPlanos = planos.filter(p => p.status === col.key)
        return (
          <div key={col.key} className="bg-[#f6f8fb] border border-[#dde5ef] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <span>{col.icon}</span>
              <span className="text-sm font-bold text-navy">{col.label}</span>
              <span className="ml-auto text-xs font-mono font-bold text-[#8899b0]">{colPlanos.length}</span>
            </div>
            <div className="space-y-3">
              {colPlanos.map(p => (
                <div key={p.id} className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-card-hover transition-all ${STATUS_COLORS[p.status]}`}>
                  <div className="text-sm font-semibold text-navy mb-2 leading-tight">{p.title}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge border text-[9px] ${PRIORITY_COLORS[p.priority]}`}>
                      {RISK_LABELS[p.priority]}
                    </span>
                  </div>
                  {p.sector && <div className="text-[10px] text-[#8899b0] mb-1">📍 {p.sector.name}</div>}
                  <div className="text-[10px] text-[#8899b0]">
                    📅 {p.due_date ? format(parseISO(p.due_date), 'dd/MM/yyyy') : '—'}
                  </div>
                  <div className="mt-3 w-full h-1 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal-bright" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CreatePlanoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'moderado',
    responsible_name: '',
    due_date: '',
    nr1_related: true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title || !form.due_date || !form.responsible_name) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Plano criado!')
      onSaved()
    } catch {
      toast.error('Erro ao criar plano')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy-deep/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#dde5ef]">
          <div className="font-bold text-navy">Novo Plano de Ação</div>
          <button onClick={onClose} className="text-[#8899b0] hover:text-navy text-lg">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="Ex: Treinamento de liderança humanizada"
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prioridade</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="input"
              >
                <option value="baixo">Baixo</option>
                <option value="moderado">Moderado</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
            <div>
              <label className="label">Prazo *</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div>
            <label className="label">Responsável *</label>
            <input
              value={form.responsible_name}
              onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))}
              className="input"
              placeholder="Nome do responsável"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.nr1_related}
              onChange={e => setForm(f => ({ ...f, nr1_related: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-[#5a6f8a]">Relacionado à conformidade NR-1</span>
          </label>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-teal">
            {saving ? 'Salvando...' : '✓ Criar Plano'}
          </button>
        </div>
      </div>
    </div>
  )
}
