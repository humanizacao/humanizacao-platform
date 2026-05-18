import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = {
    id: '',
    full_name: 'Bruna Coutinho',
    email: '',
    role: 'consultoria' as const,
    company_id: '',
    is_active: true,
    onboarding_completed: true,
    metadata: {},
    created_at: '',
    updated_at: '',
    company: {
      id: '',
      name: 'Viação Santa Clara',
      slug: 'visac',
      plan: 'enterprise' as const,
      primary_color: '#1a2b4a',
      secondary_color: '#2d8c6e',
      settings: {},
      max_employees: 200,
      active: true,
      created_at: '',
      updated_at: '',
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb]">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden ml-[260px]">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
