'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { differenceInDays } from 'date-fns'
import { NR1_DEADLINE } from '@/types'
import type { Profile, Notification } from '@/types'

interface TopbarProps {
  profile: Profile
}

export default function Topbar({ profile }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [daysToDeadline, setDaysToDeadline] = useState(0)

  useEffect(() => {
    setDaysToDeadline(differenceInDays(new Date(NR1_DEADLINE), new Date()))
    loadNotifications()

    // Real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotifications(data)
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('read', false)
    setNotifications([])
  }

  const deadlineColor = daysToDeadline <= 7
    ? 'text-[#e05252] bg-[#e05252]/10 border-[#e05252]/25'
    : daysToDeadline <= 30
    ? 'text-[#e8a53a] bg-[#e8a53a]/10 border-[#e8a53a]/25'
    : 'text-teal bg-teal/10 border-teal/25'

  return (
    <header className="h-16 bg-white border-b border-[#dde5ef] px-8 flex items-center justify-between sticky top-0 z-40 shadow-card">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="text-[17px] font-bold text-navy tracking-tight">
          Dashboard Executivo
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal font-semibold bg-teal/8 border border-teal/20 px-3 py-1.5 rounded-full">
          <div className="live-dot" />
          Tempo real
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* NR-1 countdown */}
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${deadlineColor}`}>
          <span>⚖️</span>
          <span>
            NR-1 · {daysToDeadline > 0 ? `${daysToDeadline} dias` : 'Prazo vencido'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-[#dde5ef] bg-white flex items-center justify-center text-base hover:bg-[#f6f8fb] transition-colors relative"
          >
            🔔
            {notifications.length > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e05252] rounded-full border-2 border-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-[#dde5ef] rounded-2xl shadow-card-hover z-50">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#dde5ef]">
                <div className="text-sm font-bold text-navy">Notificações</div>
                {notifications.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-teal font-semibold hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-[#8899b0] text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="px-5 py-3.5 border-b border-[#dde5ef] last:border-0 hover:bg-[#f6f8fb] cursor-pointer">
                      <div className="text-sm font-semibold text-navy mb-0.5">{notif.title}</div>
                      {notif.body && <div className="text-xs text-[#8899b0] leading-relaxed">{notif.body}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Export button */}
        <button
          onClick={() => router.push('/relatorios')}
          className="btn-primary flex items-center gap-2"
        >
          <span>⬇</span> Exportar Relatório
        </button>
      </div>
    </header>
  )
}
