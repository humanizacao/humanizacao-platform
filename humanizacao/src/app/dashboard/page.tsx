'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/store'
import KPIGrid from '@/components/dashboard/KPIGrid'
import HeatmapChart from '@/components/dashboard/HeatmapChart'
import { RadarChart } from '@/components/dashboard/RadarChart'
import RiskBars from '@/components/dashboard/RiskBars'
import InsightsList from '@/components/dashboard/InsightsList'
import PlanosWidget, { ParticipationWidget } from '@/components/dashboard/PlanosWidget'
import SectorTable from '@/components/dashboard/SectorTable'
import NR1Banner from '@/components/dashboard/NR1Banner'

export default function DashboardPage() {
  const { fetchDashboard, fetchPlans, refreshRealtime, kpis, loading } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
    fetchPlans()
    const refreshInterval = setInterval(refreshRealtime, 5 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [])

  if (loading && !kpis) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px]">
      <NR1Banner />
      <KPIGrid />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1"><HeatmapChart /></div>
        <div className="col-span-1"><RadarChart /></div>
        <div className="col-span-1"><RiskBars /></div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <InsightsList />
        <PlanosWidget />
        <ParticipationWidget />
      </div>
      <SectorTable />
    </div>
  )
}
