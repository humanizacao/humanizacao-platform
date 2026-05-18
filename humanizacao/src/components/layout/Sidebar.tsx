'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'
import { ROLE_LABELS, ROLES_WITH_ANALYTICS, ROLES_WITH_ADMIN } from '@/types'
import toast from 'react-hot-toast'

interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number | string
  badgeType?: 'red' | 'green'
  roles?: string[]
}

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard Executivo', href: '/dashboard', icon: '⬡' },
      { label: 'People Analytics', href: '/dashboard/analytics', icon: '📊', roles: ROLES_WITH_ANALYTICS },
      { label: 'Matriz de Risco', href: '/dashboard/matriz', icon: '🗺', roles: ROLES_WITH_ANALYTICS },
      { label: 'IA · Insights', href: '/dashboard/insights', icon: '🤖', roles: ROLES_WITH_ANALYTICS },
    ] as NavItem[],
  },
  {
    label: 'Avaliações',
    items: [
      { label: 'Avaliações Psicossociais', href: '/avaliacao', icon: '📋' },
      { label: 'Aplicação e Envios', href: '/avaliacao/envios', icon: '📨', roles: ROLES_WITH_ANALYTICS },
      { label: 'Resultados', href: '/resultados', icon: '📈', roles: ROLES_WITH_ANALYTICS },
    ] as NavItem[],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Planos de Ação', href: '/planos-acao', icon: '✅' },
      { label: 'Relatórios Executivos', href: '/relatorios', icon: '📄', roles: ROLES_WITH_ANALYTICS },
      { label: 'Auditoria · Compliance', href: '/dashboard/auditoria', icon: '🔍', roles: ['admin_master', 'auditoria', 'consultoria'] },
      { label: 'Benchmark Setorial', href: '/dashboard/benchmark', icon: '📊', roles: ROLES_WITH_ANALYTICS },
    ] as NavItem[],
  },
  {
    label: 'Configuração',
    items: [
      { label: 'Usuários e Perfis', href: '/configuracoes/usuarios', icon: '👥', roles: ROLES_WITH_ADMIN },
      { label: 'LGPD e Privacidade', href: '/configuracoes/lgpd', icon: '🔒', roles: ROLES_WITH_ADMIN },
      { label: 'Configurações', href: '/configuracoes', icon: '⚙️', roles: ROLES_WITH_ADMIN },
    ] as NavItem[],
  },
]

interface SidebarProps {
  profile: Profile & { company?: { name: string; plan: string; logo_url?: string } }
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const canAccess = (roles?: string[]) => {
    if (!roles) return true
    return roles.includes(profile.role)
  }

  const initials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-navy-deep flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.07]">
        <div className="font-sans text-[22px] font-extrabold tracking-[-0.5px]">
          <span className="text-white">Humaniz</span>
          <span className="text-teal-light">AÇÃO</span>
        </div>
        <div className="text-[9px] tracking-[2.5px] uppercase text-white/25 mt-1 font-medium">
          Inteligência Psicossocial · NR-1
        </div>
      </div>

      {/* Company badge */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <div className="bg-teal/10 border border-teal/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal to-navy-mid rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile.company?.name?.slice(0, 2).toUpperCase() || 'HA'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">
              {profile.company?.name || 'Empresa'}
            </div>
            <div className="text-teal-light text-[10px] font-medium capitalize">
              ✦ {profile.company?.plan || 'starter'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(item => canAccess(item.roles))
          if (visibleItems.length === 0) return null

          return (
            <div key={section.label}>
              <div className="text-[9px] tracking-[2px] uppercase text-white/20 font-semibold px-3 mb-2">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`nav-item w-full text-left relative ${isActive(item.href) ? 'active' : ''}`}
                  >
                    {isActive(item.href) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-light rounded-r" />
                    )}
                    <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                        item.badgeType === 'green'
                          ? 'bg-teal/20 text-teal-light'
                          : 'bg-[#e05252] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="w-8 h-8 bg-gradient-to-br from-teal to-[#1a5e46] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-teal-light/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{profile.full_name}</div>
            <div className="text-teal-light text-[10px] truncate">{ROLE_LABELS[profile.role]}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/80 text-base"
            title="Sair"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  )
}
