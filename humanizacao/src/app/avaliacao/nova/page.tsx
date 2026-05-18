'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { QuestionType } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  anonymous: z.boolean().default(true),
  end_date: z.string().min(1, 'Informe a data de encerramento'),
  perguntas: z.array(z.object({
    text: z.string().min(5, 'Pergunta muito curta'),
    type: z.string(),
    dimensao_id: z.string().optional(),
    required: z.boolean().default(true),
    inverted_score: z.boolean().default(false),
    help_text: z.string().optional(),
    options: z.array(z.string()).default([]),
  })).min(1, 'Adicione pelo menos uma pergunta'),
})

type FormData = z.infer<typeof schema>

const QUESTION_TYPES = [
  { value: 'likert_5', label: 'Likert 5 pontos', icon: '⭐' },
  { value: 'frequency', label: 'Frequência', icon: '🔄' },
  { value: 'nps', label: 'NPS (0–10)', icon: '📊' },
  { value: 'text_open', label: 'Resposta aberta', icon: '✏️' },
  { value: 'boolean', label: 'Sim / Não', icon: '✓✗' },
]

const DEFAULT_LIKERT_OPTIONS = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']
const DEFAULT_FREQUENCY_OPTIONS = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']

const TEMPLATE_QUESTIONS = [
  { text: 'Com que frequência você sente que tem trabalho demais para o tempo disponível?', type: 'frequency', options: DEFAULT_FREQUENCY_OPTIONS, dimensao: 'Carga de Trabalho' },
  { text: 'Você se sente emocionalmente esgotado pelo seu trabalho?', type: 'frequency', options: DEFAULT_FREQUENCY_OPTIONS, dimensao: 'Exaustão Emocional' },
  { text: 'Você se sente seguro para expressar opiniões sem medo de consequências negativas?', type: 'likert_5', options: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'], dimensao: 'Segurança Psicológica' },
  { text: 'Você recebe reconhecimento adequado pelo trabalho que realiza?', type: 'likert_5', options: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'], dimensao: 'Reconhecimento' },
  { text: 'Sua liderança demonstra interesse genuíno pelo seu bem-estar?', type: 'likert_5', options: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'], dimensao: 'Liderança' },
  { text: 'Você consegue equilibrar adequadamente vida pessoal e trabalho?', type: 'frequency', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], dimensao: 'Equilíbrio Vida/Trabalho' },
  { text: 'Você já presenciou ou sofreu situações de assédio moral no trabalho?', type: 'frequency', options: DEFAULT_FREQUENCY_OPTIONS, dimensao: 'Assédio', inverted: true },
  { text: 'Em uma escala de 0 a 10, qual a probabilidade de você recomendar esta empresa como um bom lugar para trabalhar?', type: 'nps', options: [], dimensao: 'Satisfação' },
]

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      anonymous: true,
      perguntas: [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'perguntas',
  })

  const addTemplateQuestion = (q: typeof TEMPLATE_QUESTIONS[0]) => {
    append({
      text: q.text,
      type: q.type as QuestionType,
      options: q.options,
      required: true,
      inverted_score: q.inverted || false,
      help_text: '',
      dimensao_id: '',
    })
    toast.success(`"${q.dimensao}" adicionada`)
  }

  const addBlankQuestion = () => {
    append({
      text: '',
      type: 'likert_5',
      options: DEFAULT_LIKERT_OPTIONS,
      required: true,
      inverted_score: false,
      help_text: '',
      dimensao_id: '',
    })
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          end_date: new Date(data.end_date).toISOString(),
          start_date: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar')
      }
      const { data: avaliacao } = await res.json()
      toast.success('Avaliação criada com sucesso!')
      router.push(`/avaliacao`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const totalSteps = 3

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="btn-ghost text-sm mb-4">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Nova Avaliação Psicossocial</h1>
        <p className="text-[#8899b0] text-sm mt-1">Conforme NR-1 · Portaria MTE nº 1.419/2024</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { n: 1, label: 'Configuração' },
          { n: 2, label: 'Perguntas' },
          { n: 3, label: 'Revisão' },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s.n
                ? 'bg-navy text-white'
                : 'bg-[#f0f4f8] text-[#8899b0]'
            }`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-sm font-medium ${step >= s.n ? 'text-navy' : 'text-[#8899b0]'}`}>
              {s.label}
            </span>
            {s.n < totalSteps && (
              <div className={`w-12 h-0.5 rounded ${step > s.n ? 'bg-teal' : 'bg-[#dde5ef]'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Config */}
        {step === 1 && (
          <div className="card p-8 space-y-6 animate-fade-in-up">
            <div>
              <label className="label">Título da Avaliação *</label>
              <input
                {...register('title')}
                className="input"
                placeholder="Ex: Avaliação Psicossocial · NR-1 · Maio 2026"
              />
              {errors.title && <p className="text-[#e05252] text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Descrição (opcional)</label>
              <textarea
                {...register('description')}
                className="input resize-none"
                rows={3}
                placeholder="Explique o objetivo desta avaliação para os participantes..."
              />
            </div>

            <div>
              <label className="label">Data de Encerramento *</label>
              <input
                {...register('end_date')}
                type="date"
                className="input w-56"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.end_date && <p className="text-[#e05252] text-xs mt-1">{errors.end_date.message}</p>}
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f6f8fb] rounded-xl border border-[#dde5ef]">
              <div>
                <div className="text-sm font-semibold text-navy">Respostas anônimas</div>
                <div className="text-xs text-[#8899b0] mt-0.5">Recomendado — protege a identidade dos participantes (LGPD)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('anonymous')} className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-[#dde5ef] peer-focus:ring-2 peer-focus:ring-teal/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal" />
              </label>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                Próximo: Perguntas →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Template bank */}
            <div className="card p-6">
              <div className="font-bold text-navy mb-1">Banco de Perguntas NR-1</div>
              <div className="text-xs text-[#8899b0] mb-4">Clique para adicionar perguntas validadas por dimensão psicossocial</div>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addTemplateQuestion(q)}
                    className="text-left p-3 rounded-xl border border-[#dde5ef] hover:border-teal hover:bg-teal/5 transition-all group"
                  >
                    <div className="text-[10px] font-bold text-teal uppercase tracking-wide mb-1">{q.dimensao}</div>
                    <div className="text-xs text-[#5a6f8a] line-clamp-2 leading-relaxed">{q.text}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current questions */}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="card p-5 group">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-navy text-white text-xs rounded-lg flex items-center justify-center font-mono flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        {...register(`perguntas.${index}.text`)}
                        className="input text-sm"
                        placeholder="Texto da pergunta..."
                      />
                      <div className="flex items-center gap-3">
                        <select
                          {...register(`perguntas.${index}.type`)}
                          className="input text-sm w-48"
                        >
                          {QUESTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs text-[#5a6f8a] font-medium cursor-pointer">
                          <input type="checkbox" {...register(`perguntas.${index}.required`)} className="rounded" />
                          Obrigatória
                        </label>
                        <label className="flex items-center gap-2 text-xs text-[#5a6f8a] font-medium cursor-pointer">
                          <input type="checkbox" {...register(`perguntas.${index}.inverted_score`)} className="rounded" />
                          Score invertido
                        </label>
                      </div>
                      <input
                        {...register(`perguntas.${index}.help_text`)}
                        className="input text-xs"
                        placeholder="Dica para o respondente (opcional)..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="opacity-0 group-hover:opacity-100 text-[#e05252] hover:bg-[#e05252]/10 w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addBlankQuestion}
              className="w-full py-3 border-2 border-dashed border-[#dde5ef] rounded-2xl text-sm font-semibold text-[#8899b0] hover:border-teal hover:text-teal hover:bg-teal/5 transition-all"
            >
              ＋ Pergunta personalizada
            </button>

            {errors.perguntas && (
              <p className="text-[#e05252] text-xs">{errors.perguntas.message || errors.perguntas.root?.message}</p>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => fields.length > 0 ? setStep(3) : toast.error('Adicione ao menos uma pergunta')}
                className="btn-primary"
              >
                Próximo: Revisão →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="card p-8">
              <div className="text-lg font-bold text-navy mb-6">Revise sua avaliação</div>

              <div className="grid grid-cols-2 gap-6 mb-6 p-5 bg-[#f6f8fb] rounded-xl">
                <div>
                  <div className="text-xs font-bold text-[#8899b0] uppercase tracking-wide mb-1">Título</div>
                  <div className="font-semibold text-navy">{watch('title') || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#8899b0] uppercase tracking-wide mb-1">Encerramento</div>
                  <div className="font-semibold text-navy">{watch('end_date') || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#8899b0] uppercase tracking-wide mb-1">Anonimato</div>
                  <div className="font-semibold text-teal">{watch('anonymous') ? '✅ Ativo' : '❌ Inativo'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#8899b0] uppercase tracking-wide mb-1">Total de perguntas</div>
                  <div className="font-mono font-bold text-navy">{fields.length}</div>
                </div>
              </div>

              <div className="space-y-2">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-3 py-2 border-b border-[#dde5ef] last:border-0">
                    <span className="font-mono text-xs text-[#8899b0] w-6">{i + 1}.</span>
                    <span className="text-sm text-navy">{watch(`perguntas.${i}.text`) || 'Sem texto'}</span>
                    <span className="ml-auto text-[10px] text-[#8899b0]">{watch(`perguntas.${i}.type`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost">
                ← Anterior
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-teal flex items-center gap-2 px-8"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : '✓ Criar Avaliação'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
