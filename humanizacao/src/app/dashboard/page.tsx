'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/store'
import { createClient } from '@/lib/supabase'
import KPIGrid from '@/components/dashboard/KPIGrid'
import HeatmapChart from '@/components/dashboard/HeatmapChart'
import RadarChart from '@/components/dashboard/RadarChart'
import RiskBars from '@/components/dashboard/RiskBars'
import InsightsList from '@/components/dashboard/InsightsList'
import PlanosWidget from '@/components/dashboard/PlanosWidget'
import SectorTable from '@/components/dashboard/SectorTable'
import NR1Banner from '@/components/dashboard/NR1Banner'
import ParticipationWidget from '@/components/dashboard/ParticipationWidget'

export default function DashboardPage() {
  const { fetchDashboard, fetchPlans, refreshRealtime, kpis, loading } = useDashboardStore()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboard()
    fetchPlans()

    // Real-time subscriptions
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'respostas' }, () => {
        refreshRealtime()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planos_acao' }, () => {
        fetchPlans()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_assessments' }, () => {
        fetchDashboard()
      })
      .subscribe()

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(refreshRealtime, 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(refreshInterval)
    }
  }, [])

  if (loading && !kpis) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px]">
      {/* NR-1 Alert Banner */}
      <NR1Banner />

      {/* KPI Grid */}
      <KPIGrid />

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1">
          <HeatmapChart />
        </div>
        <div className="col-span-1">
          <RadarChart />
        </div>
        <div className="col-span-1">
          <RiskBars />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-5">
        <InsightsList />
        <PlanosWidget />
        <ParticipationWidget />
      </div>

      {/* Sector Ranking Table */}
      <SectorTable />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="skeleton h-20 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  )
}
