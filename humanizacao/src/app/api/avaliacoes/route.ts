import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const createAvaliacaoSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  anonymous: z.boolean().default(true),
  target_sectors: z.array(z.string().uuid()).default([]),
  target_roles: z.array(z.string()).default([]),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  reminder_days: z.array(z.number()).default([3, 1]),
  perguntas: z.array(z.object({
    dimensao_id: z.string().uuid().optional(),
    text: z.string().min(5),
    type: z.enum(['likert_5', 'likert_7', 'multiple_choice', 'single_choice', 'text_open', 'nps', 'frequency', 'boolean']),
    options: z.array(z.string()).default([]),
    required: z.boolean().default(true),
    inverted_score: z.boolean().default(false),
    order_index: z.number().default(0),
    help_text: z.string().optional(),
  })).default([]),
})

// GET - list all avaliacoes for company
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const page = parseInt(url.searchParams.get('page') || '1')

    let query = supabase
      .from('avaliacoes')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name, email, avatar_url),
        perguntas(count)
      `, { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      per_page: limit,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST - create new avaliacao
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single()

    // Role check
    const allowedRoles = ['admin_master', 'consultoria', 'rh_corporativo', 'dho', 'sesmt']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createAvaliacaoSchema.parse(body)

    // Calculate target count from sectors
    let targetCount = 0
    if (validated.target_sectors.length > 0) {
      const { data: sectorData } = await supabase
        .from('sectors')
        .select('employee_count')
        .in('id', validated.target_sectors)
      targetCount = sectorData?.reduce((acc, s) => acc + s.employee_count, 0) || 0
    } else {
      const { data: companyData } = await supabase
        .from('companies')
        .select('max_employees')
        .eq('id', profile.company_id)
        .single()
      targetCount = companyData?.max_employees || 0
    }

    // Create avaliacao
    const { data: avaliacao, error: avaliacaoError } = await supabase
      .from('avaliacoes')
      .insert({
        company_id: profile.company_id,
        created_by: session.user.id,
        title: validated.title,
        description: validated.description,
        anonymous: validated.anonymous,
        target_sectors: validated.target_sectors,
        target_roles: validated.target_roles,
        start_date: validated.start_date,
        end_date: validated.end_date,
        reminder_days: validated.reminder_days,
        target_count: targetCount,
        status: 'rascunho',
      })
      .select()
      .single()

    if (avaliacaoError) throw avaliacaoError

    // Create perguntas
    if (validated.perguntas.length > 0) {
      const { error: perguntasError } = await supabase
        .from('perguntas')
        .insert(
          validated.perguntas.map((p, i) => ({
            ...p,
            avaliacao_id: avaliacao.id,
            company_id: profile.company_id,
            order_index: p.order_index || i,
          }))
        )
      if (perguntasError) throw perguntasError
    }

    // Audit log
    await supabase.from('audit_log').insert({
      company_id: profile.company_id,
      user_id: session.user.id,
      action: 'create',
      resource_type: 'avaliacao',
      resource_id: avaliacao.id,
      new_values: { title: avaliacao.title, status: avaliacao.status },
    })

    return NextResponse.json({ data: avaliacao }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
