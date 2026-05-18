// ============================================================
// HumanizAÇÃO Platform · TypeScript Types
// ============================================================

export type UserRole =
  | 'admin_master'
  | 'consultoria'
  | 'rh_corporativo'
  | 'dho'
  | 'sesmt'
  | 'diretoria'
  | 'lideranca'
  | 'gestor'
  | 'auditoria'
  | 'colaborador'

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'

export type ActionStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado' | 'atrasado'

export type AvaliacaoStatus = 'rascunho' | 'ativa' | 'encerrada' | 'arquivada'

export type QuestionType =
  | 'likert_5'
  | 'likert_7'
  | 'multiple_choice'
  | 'single_choice'
  | 'text_open'
  | 'nps'
  | 'frequency'
  | 'boolean'

// ============================================================
// ENTITIES
// ============================================================

export interface Company {
  id: string
  name: string
  slug: string
  cnpj?: string
  plan: 'starter' | 'professional' | 'enterprise'
  logo_url?: string
  primary_color: string
  secondary_color: string
  settings: Record<string, unknown>
  nr1_deadline?: string
  max_employees: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id: string
  full_name: string
  email: string
  role: UserRole
  sector?: string
  job_title?: string
  avatar_url?: string
  phone?: string
  is_active: boolean
  last_login?: string
  onboarding_completed: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relations
  company?: Company
}

export interface Sector {
  id: string
  company_id: string
  name: string
  type: string
  description?: string
  manager_id?: string
  employee_count: number
  risk_score: number
  risk_level: RiskLevel
  active: boolean
  created_at: string
  updated_at: string
  // Relations
  manager?: Profile
}

export interface Dimensao {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  weight: number
  order_index: number
  active: boolean
}

export interface Pergunta {
  id: string
  avaliacao_id?: string
  dimensao_id?: string
  company_id?: string
  text: string
  type: QuestionType
  options: string[]
  required: boolean
  inverted_score: boolean
  order_index: number
  conditional_logic?: Record<string, unknown>
  help_text?: string
  is_template: boolean
  created_at: string
  // Relations
  dimensao?: Dimensao
}

export interface Avaliacao {
  id: string
  company_id: string
  created_by: string
  title: string
  description?: string
  status: AvaliacaoStatus
  target_sectors: string[]
  target_roles: UserRole[]
  anonymous: boolean
  start_date?: string
  end_date?: string
  reminder_days: number[]
  participation_count: number
  target_count: number
  completion_rate: number
  settings: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relations
  perguntas?: Pergunta[]
  created_by_profile?: Profile
}

export interface Resposta {
  id: string
  avaliacao_id: string
  company_id: string
  respondent_id?: string
  respondent_token?: string
  sector_id?: string
  completed: boolean
  started_at: string
  completed_at?: string
  duration_seconds?: number
  answers: Record<string, { value: string | number; score: number }>
  dimension_scores: Record<string, number>
  overall_score?: number
  risk_level?: RiskLevel
  metadata: Record<string, unknown>
  created_at: string
}

export interface RiskAssessment {
  id: string
  company_id: string
  avaliacao_id?: string
  sector_id?: string
  assessed_at: string
  period_label?: string
  dimension_scores: Record<string, number>
  overall_score: number
  risk_level: RiskLevel
  sample_size: number
  participation_rate: number
  heatmap_data: Record<string, unknown>
  trend_data: TrendPoint[]
  recommendations: Recommendation[]
  nr1_compliance: Record<string, unknown>
  created_at: string
  // Relations
  sector?: Sector
}

export interface AIInsight {
  id: string
  company_id: string
  avaliacao_id?: string
  sector_id?: string
  type: 'burnout_risk' | 'turnover_risk' | 'pattern' | 'opportunity' | 'compliance'
  severity: RiskLevel
  title: string
  body: string
  affected_count: number
  confidence_score: number
  data_sources: string[]
  recommended_actions: string[]
  dismissed: boolean
  dismissed_by?: string
  dismissed_at?: string
  expires_at?: string
  created_at: string
  // Relations
  sector?: Sector
}

export interface PlanoAcao {
  id: string
  company_id: string
  avaliacao_id?: string
  sector_id?: string
  dimensao_id?: string
  insight_id?: string
  title: string
  description?: string
  status: ActionStatus
  priority: RiskLevel
  responsible_id?: string
  responsible_name?: string
  due_date: string
  completed_date?: string
  progress: number
  expected_impact?: string
  evidence_required?: string
  attachments: string[]
  comments: PlanoComment[]
  sla_days?: number
  nr1_related: boolean
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
  // Relations
  sector?: Sector
  dimensao?: Dimensao
  responsible?: Profile
}

export interface PlanoComment {
  id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
}

export interface Notification {
  id: string
  company_id: string
  user_id?: string
  type: string
  title: string
  body?: string
  link?: string
  read: boolean
  read_at?: string
  data: Record<string, unknown>
  created_at: string
}

// ============================================================
// DASHBOARD / ANALYTICS TYPES
// ============================================================

export interface DashboardKPIs {
  global_risk_score: number
  global_risk_level: RiskLevel
  emotional_exhaustion_pct: number
  psychological_safety_score: number
  healthy_leadership_score: number
  burnout_risk_count: number
  absenteeism_trend: number
  turnover_tendency: number
  participation_rate: number
  active_plans: number
  overdue_plans: number
  critical_sectors: number
  // Deltas (vs previous period)
  delta_risk_score: number
  delta_exhaustion: number
  delta_safety: number
  delta_participation: number
}

export interface HeatmapData {
  dimensao: string
  dimensao_slug: string
  months: { label: string; score: number; level: number }[]
}

export interface RadarData {
  dimensao: string
  current: number
  benchmark: number
  fullMark: number
}

export interface TrendPoint {
  period: string
  score: number
  level: RiskLevel
}

export interface SectorRanking {
  sector: Sector
  risk_score: number
  risk_level: RiskLevel
  participation_rate: number
  critical_dimension: string
  trend: number
  plan_count: number
}

export interface Recommendation {
  dimension: string
  action: string
  priority: RiskLevel
  estimated_impact: number
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================
// FORM TYPES
// ============================================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  full_name: string
  email: string
  password: string
  company_name: string
  cnpj?: string
  role: UserRole
}

export interface AvaliacaoForm {
  title: string
  description?: string
  anonymous: boolean
  target_sectors: string[]
  start_date: string
  end_date: string
  reminder_days: number[]
  perguntas: Omit<Pergunta, 'id' | 'created_at'>[]
}

export interface PlanoAcaoForm {
  title: string
  description?: string
  status: ActionStatus
  priority: RiskLevel
  responsible_id?: string
  responsible_name: string
  due_date: string
  expected_impact?: string
  sector_id?: string
  dimensao_id?: string
  nr1_related: boolean
  tags: string[]
}

// ============================================================
// CONSTANTS
// ============================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_master: 'Administrador Master',
  consultoria: 'Consultoria Estratégica',
  rh_corporativo: 'RH Corporativo',
  dho: 'DHO',
  sesmt: 'SESMT',
  diretoria: 'Diretoria',
  lideranca: 'Liderança',
  gestor: 'Gestor',
  auditoria: 'Auditoria',
  colaborador: 'Colaborador',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  baixo: '#3aab86',
  moderado: '#6c87e8',
  alto: '#e8a53a',
  critico: '#e05252',
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
}

export const NR1_DEADLINE = '2026-05-26'

export const ROLES_WITH_ANALYTICS: UserRole[] = [
  'admin_master',
  'consultoria',
  'rh_corporativo',
  'dho',
  'sesmt',
  'diretoria',
  'auditoria',
]

export const ROLES_WITH_ADMIN: UserRole[] = [
  'admin_master',
  'consultoria',
  'rh_corporativo',
]
