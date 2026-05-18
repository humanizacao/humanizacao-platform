import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const planoSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado', 'atrasado']).default('pendente'),
  priority: z.enum(['baixo', 'moderado', 'alto', 'critico']).default('moderado'),
  responsible_id: z.string().uuid().optional(),
  responsible_name: z.string(),
  due_date: z.string(),
  expected_impact: z.string().optional(),
  evidence_required: z.string().optional(),
  sector_id: z.string().uuid().optional(),
  dimensao_id: z.string().uuid().optional(),
  avaliacao_id: z.string().uuid().optional(),
  insight_id: z.string().uuid().optional(),
  nr1_related: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  sla_days: z.number().optional(),
})

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
    const priority = url.searchParams.get('priority')
    const sectorId = url.searchParams.get('sector_id')
    const overdue = url.searchParams.get('overdue') === 'true'

    let query = supabase
      .from('planos_acao')
      .select(`
        *,
        sector:sectors(id, name, type),
        dimensao:dimensoes(id, name, slug, icon),
        responsible:profiles!responsible_id(id, full_name, avatar_url, role)
      `, { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('due_date', { ascending: true })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (sectorId) query = query.eq('sector_id', sectorId)
    if (overdue) query = query
      .in('status', ['pendente', 'em_andamento'])
      .lt('due_date', new Date().toISOString().split('T')[0])

    const { data, count, error } = await query
    if (error) throw error

    // Stats
    const today = new Date().toISOString().split('T')[0]
    const stats = {
      total: count || 0,
      by_status: {
        pendente: data?.filter(p => p.status === 'pendente').length || 0,
        em_andamento: data?.filter(p => p.status === 'em_andamento').length || 0,
        concluido: data?.filter(p => p.status === 'concluido').length || 0,
        atrasado: data?.filter(p => ['pendente', 'em_andamento'].includes(p.status) && p.due_date < today).length || 0,
      },
      by_priority: {
        critico: data?.filter(p => p.priority === 'critico').length || 0,
        alto: data?.filter(p => p.priority === 'alto').length || 0,
      },
    }

    return NextResponse.json({ data, total: count || 0, stats })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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

    const allowedRoles = ['admin_master', 'consultoria', 'rh_corporativo', 'dho', 'sesmt', 'gestor', 'lideranca']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validated = planoSchema.parse(body)

    // Calculate SLA
    const slaDate = new Date(validated.due_date)
    const today = new Date()
    const slaDays = Math.ceil((slaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const { data: plano, error } = await supabase
      .from('planos_acao')
      .insert({
        ...validated,
        company_id: profile.company_id,
        created_by: session.user.id,
        sla_days: slaDays,
      })
      .select(`
        *,
        sector:sectors(id, name),
        dimensao:dimensoes(id, name, icon),
        responsible:profiles!responsible_id(id, full_name)
      `)
      .single()

    if (error) throw error

    // Create notification for responsible
    if (validated.responsible_id) {
      await supabase.from('notifications').insert({
        company_id: profile.company_id,
        user_id: validated.responsible_id,
        type: 'plano_atribuido',
        title: 'Novo plano de ação atribuído',
        body: `Você foi designado responsável pelo plano: "${validated.title}"`,
        link: `/planos-acao/${plano.id}`,
        data: { plano_id: plano.id },
      })
    }

    // Audit
    await supabase.from('audit_log').insert({
      company_id: profile.company_id,
      user_id: session.user.id,
      action: 'create',
      resource_type: 'plano_acao',
      resource_id: plano.id,
      new_values: { title: plano.title, priority: plano.priority, due_date: plano.due_date },
    })

    return NextResponse.json({ data: plano }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    // Get old values for audit
    const { data: oldPlano } = await supabase
      .from('planos_acao')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile?.company_id)
      .single()

    if (!oldPlano) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: plano, error } = await supabase
      .from('planos_acao')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit
    await supabase.from('audit_log').insert({
      company_id: profile?.company_id,
      user_id: session.user.id,
      action: 'update',
      resource_type: 'plano_acao',
      resource_id: id,
      old_values: oldPlano,
      new_values: updates,
    })

    return NextResponse.json({ data: plano })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
