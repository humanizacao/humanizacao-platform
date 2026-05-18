'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Avaliacao, Pergunta } from '@/types'
import toast from 'react-hot-toast'

type Answer = { value: string | number; score: number }

function scoreFromLikert(value: number, totalOptions: number): number {
  return ((value - 1) / (totalOptions - 1)) * 100
}

export default function ResponderAvaliacao() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get('t') || crypto.randomUUID()
  const supabase = createClient()

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sectorId, setSectorId] = useState<string>('')
  const [startTime] = useState(Date.now())

  useEffect(() => {
    loadAvaliacao()
  }, [])

  const loadAvaliacao = async () => {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select(`*, perguntas(*, dimensao:dimensoes(*))`)
      .eq('id', params.id)
      .eq('status', 'ativa')
      .single()

    if (error || !data) {
      toast.error('Avaliação não encontrada ou encerrada')
      setLoading(false)
      return
    }

    setAvaliacao(data)
    setPerguntas((data.perguntas || []).sort((a: Pergunta, b: Pergunta) => a.order_index - b.order_index))
    setLoading(false)
  }

  const handleAnswer = (perguntaId: string, value: string | number, options: string[]) => {
    let score = 0
    if (typeof value === 'number') {
      score = scoreFromLikert(value, options.length)
    }
    setAnswers(prev => ({ ...prev, [perguntaId]: { value, score } }))
  }

  const currentPergunta = perguntas[currentStep]
  const progress = ((currentStep) / perguntas.length) * 100
  const isAnswered = currentPergunta && answers[currentPergunta.id] !== undefined

  const handleNext = () => {
    if (currentStep < perguntas.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avaliacao_id: avaliacao!.id,
          respondent_token: token,
          sector_id: sectorId || undefined,
          answers,
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          metadata: { source: 'web' },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      setSubmitted(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao enviar resposta')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[#8899b0] text-sm">Carregando avaliação...</div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-deep to-navy flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <div className="font-display text-3xl text-white mb-3">Obrigado!</div>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Sua resposta foi registrada com anonimato garantido. Sua participação é fundamental
            para construirmos um ambiente de trabalho mais saudável e seguro.
          </p>
          <div className="bg-teal/15 border border-teal/25 rounded-2xl px-6 py-5">
            <div className="text-teal-light text-xs font-semibold uppercase tracking-wide mb-2">
              🔒 Privacidade garantida
            </div>
            <div className="text-white/50 text-xs leading-relaxed">
              Suas respostas são totalmente anônimas e protegidas por criptografia.
              Apenas dados agregados serão utilizados nas análises organizacionais.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!avaliacao || !currentPergunta) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center p-6">
        <div className="text-center text-[#8899b0]">Avaliação não encontrada ou encerrada.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* Header */}
      <div className="bg-white border-b border-[#dde5ef] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="font-sans font-bold text-navy">
              Humaniz<span className="text-teal">AÇÃO</span>
            </div>
            <div className="text-[11px] text-[#8899b0] font-mono">
              {currentStep + 1}/{perguntas.length}
            </div>
          </div>
          <div className="h-1.5 bg-[#f0f4f8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* First step - intro / sector select */}
        {currentStep === 0 && (
          <div className="mb-8 animate-fade-in-up">
            <div className="bg-navy text-white rounded-2xl px-6 py-5 mb-6">
              <div className="font-display text-xl mb-2">{avaliacao.title}</div>
              {avaliacao.description && (
                <div className="text-white/60 text-sm leading-relaxed">{avaliacao.description}</div>
              )}
              {avaliacao.anonymous && (
                <div className="flex items-center gap-2 mt-4 bg-teal/15 border border-teal/25 rounded-xl px-4 py-2.5">
                  <span className="text-teal-light text-base">🔒</span>
                  <span className="text-teal-light text-xs font-medium">
                    Suas respostas são 100% anônimas e confidenciais
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question */}
        <div className="animate-fade-in-up" key={currentPergunta.id}>
          {/* Dimension tag */}
          {currentPergunta.dimensao && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">{currentPergunta.dimensao.icon}</span>
              <span className="text-[10.5px] font-semibold text-teal uppercase tracking-wide">
                {currentPergunta.dimensao.name}
              </span>
            </div>
          )}

          {/* Question text */}
          <div className="text-lg font-semibold text-navy leading-snug mb-6">
            {currentPergunta.text}
          </div>

          {/* Answer options */}
          <QuestionInput
            pergunta={currentPergunta}
            value={answers[currentPergunta.id]?.value}
            onChange={(value, score) => setAnswers(prev => ({
              ...prev,
              [currentPergunta.id]: { value, score }
            }))}
          />

          {currentPergunta.help_text && (
            <div className="mt-4 text-xs text-[#8899b0] bg-[#f0f4f8] rounded-xl px-4 py-3">
              💡 {currentPergunta.help_text}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="btn-ghost disabled:opacity-30"
          >
            ← Anterior
          </button>

          <button
            onClick={handleNext}
            disabled={(!isAnswered && currentPergunta.required) || submitting}
            className="btn-primary px-8"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </div>
            ) : currentStep === perguntas.length - 1 ? (
              'Enviar Resposta ✓'
            ) : (
              'Próxima →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question Input Component ─────────────────────────────────

function QuestionInput({ pergunta, value, onChange }: {
  pergunta: Pergunta
  value?: string | number
  onChange: (value: string | number, score: number) => void
}) {
  const options = pergunta.options || []

  const getScore = (idx: number) => ((idx) / (options.length - 1)) * 100

  if (['likert_5', 'likert_7', 'frequency'].includes(pergunta.type)) {
    return (
      <div className="space-y-2.5">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1, getScore(i))}
            className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-150 text-sm font-medium ${
              value === i + 1
                ? 'border-teal bg-teal/8 text-navy'
                : 'border-[#dde5ef] bg-white text-[#5a6f8a] hover:border-[#c4d0df] hover:bg-[#f6f8fb]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                value === i + 1 ? 'border-teal bg-teal' : 'border-[#c4d0df]'
              }`}>
                {value === i + 1 && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    )
  }

  if (pergunta.type === 'text_open') {
    return (
      <textarea
        value={(value as string) || ''}
        onChange={e => onChange(e.target.value, 50)}
        placeholder="Escreva sua resposta aqui..."
        rows={4}
        className="input resize-none"
      />
    )
  }

  if (pergunta.type === 'nps') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-11 gap-1.5">
          {[...Array(11)].map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i, (i / 10) * 100)}
              className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                value === i
                  ? 'bg-navy text-white'
                  : i <= 6
                  ? 'bg-[#e05252]/10 text-[#e05252] hover:bg-[#e05252]/20'
                  : i <= 8
                  ? 'bg-[#e8a53a]/10 text-[#e8a53a] hover:bg-[#e8a53a]/20'
                  : 'bg-teal/10 text-teal hover:bg-teal/20'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#8899b0]">
          <span>Muito improvável</span>
          <span>Muito provável</span>
        </div>
      </div>
    )
  }

  return null
}
