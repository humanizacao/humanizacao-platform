'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { LoginForm } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Bem-vinda de volta!')
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-deep flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep via-navy to-navy-mid" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-bright/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Logo */}
          <div>
            <div className="font-sans text-2xl font-bold tracking-tight">
              <span className="text-white">Humaniz</span>
              <span className="text-teal-light">AÇÃO</span>
            </div>
            <div className="text-[10px] tracking-[3px] uppercase text-white/30 mt-1 font-medium">
              Inteligência Psicossocial · NR-1
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {/* Hero text */}
          <div className="font-display text-4xl text-white leading-tight mb-6">
            Transformando riscos<br />
            em <span className="text-teal-light italic">inteligência</span><br />
            organizacional.
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            Plataforma enterprise de gestão estratégica de riscos psicossociais,
            conformidade NR-1 e people analytics para RH estratégico.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[
              { num: 'NR-1', label: 'Conformidade total' },
              { num: '16', label: 'Dimensões analisadas' },
              { num: 'IA', label: 'Insights preditivos' },
            ].map((stat) => (
              <div key={stat.label} className="border-t border-white/10 pt-4">
                <div className="font-mono text-xl font-bold text-teal-light">{stat.num}</div>
                <div className="text-white/40 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="text-white/20 text-xs">
            © 2026 HumanizAÇÃO Consultoria Organizacional · LGPD Compliant
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f6f8fb]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="font-sans text-3xl font-bold">
              <span className="text-navy">Humaniz</span>
              <span className="text-teal">AÇÃO</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dde5ef] shadow-card-hover p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-navy tracking-tight">Bem-vinda de volta</h1>
              <p className="text-[#8899b0] text-sm mt-1">
                Acesse a plataforma com suas credenciais
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email profissional</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="bruna@humanizacao.com.br"
                  className="input"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-[#e05252] text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Senha</label>
                  <a href="/forgot-password" className="text-xs text-teal font-medium hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="input"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-[#e05252] text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Acessar Plataforma'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#dde5ef]">
              <div className="flex items-center justify-between text-xs text-[#8899b0]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-teal-bright animate-pulse-dot" />
                  Ambiente seguro · LGPD
                </div>
                <a href="/register" className="text-teal font-semibold hover:underline">
                  Criar conta →
                </a>
              </div>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 bg-navy/5 border border-navy/10 rounded-xl p-4">
            <div className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">
              Demo · Acesso rápido
            </div>
            <div className="space-y-1">
              <div className="text-xs text-navy/70">
                <span className="font-mono text-teal">bruna@humanizacao.com.br</span> · Consultoria
              </div>
              <div className="text-xs text-navy/50 font-mono">senha: demo123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
