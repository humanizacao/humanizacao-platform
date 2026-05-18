import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  DashboardKPIs,
  SectorRanking,
  AIInsight,
  HeatmapData,
  RadarData,
  PlanoAcao,
} from '@/types'

interface DashboardState {
  // Data
  kpis: DashboardKPIs | null
  sectors: SectorRanking[]
  insights: AIInsight[]
  heatmap: HeatmapData[]
  radar: RadarData[]
  plans: PlanoAcao[]

  // UI State
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  selectedPeriod: string
  selectedSector: string | null

  // Actions
  fetchDashboard: () => Promise<void>
  fetchPlans: () => Promise<void>
  setSelectedPeriod: (period: string) => void
  setSelectedSector: (sectorId: string | null) => void
  dismissInsight: (insightId: string) => Promise<void>
  updatePlanStatus: (planId: string, status: string, progress: number) => Promise<void>
  refreshRealtime: () => void
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      kpis: null,
      sectors: [],
      insights: [],
      heatmap: [],
      radar: [],
      plans: [],
      loading: false,
      error: null,
      lastUpdated: null,
      selectedPeriod: 'current',
      selectedSector: null,

      fetchDashboard: async () => {
        set({ loading: true, error: null })
        try {
          const res = await fetch(`/api/dashboard${get().selectedSector ? `?sector_id=${get().selectedSector}` : ''}`)
          if (!res.ok) throw new Error('Falha ao carregar dados')
          const data = await res.json()
          set({
            kpis: data.kpis,
            sectors: data.sectors || [],
            insights: data.insights || [],
            heatmap: data.heatmap || [],
            radar: data.radar || [],
            loading: false,
            lastUpdated: new Date(),
          })
        } catch (err) {
          set({ error: (err as Error).message, loading: false })
        }
      },

      fetchPlans: async () => {
        try {
          const res = await fetch('/api/planos?status=em_andamento')
          if (!res.ok) return
          const data = await res.json()
          set({ plans: data.data || [] })
        } catch {}
      },

      setSelectedPeriod: (period) => {
        set({ selectedPeriod: period })
        get().fetchDashboard()
      },

      setSelectedSector: (sectorId) => {
        set({ selectedSector: sectorId })
        get().fetchDashboard()
      },

      dismissInsight: async (insightId) => {
        try {
          await fetch(`/api/dashboard/insights/${insightId}/dismiss`, { method: 'POST' })
          set(state => ({
            insights: state.insights.filter(i => i.id !== insightId)
          }))
        } catch {}
      },

      updatePlanStatus: async (planId, status, progress) => {
        try {
          await fetch('/api/planos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: planId, status, progress }),
          })
          set(state => ({
            plans: state.plans.map(p =>
              p.id === planId ? { ...p, status: status as PlanoAcao['status'], progress } : p
            )
          }))
        } catch {}
      },

      refreshRealtime: () => {
        get().fetchDashboard()
        get().fetchPlans()
      },
    }),
    { name: 'dashboard-store' }
  )
)

// ── Auth store ──────────────────────────────────────────────

interface AuthState {
  userId: string | null
  companyId: string | null
  role: string | null
  setAuth: (userId: string, companyId: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      userId: null,
      companyId: null,
      role: null,
      setAuth: (userId, companyId, role) => set({ userId, companyId, role }),
      clearAuth: () => set({ userId: null, companyId: null, role: null }),
    }),
    { name: 'auth-store' }
  )
)
