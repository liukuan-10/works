import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings found, create one
      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert([
          {
            budget_limit: 0,
            debt_warning_line: 0,
          },
        ])
        .select()
        .single()

      if (createError) throw createError
      return NextResponse.json({
        id: newSettings.id,
        budgetLimit: newSettings.budget_limit,
        debtWarningLine: newSettings.debt_warning_line,
      })
    }

    if (error) throw error

    return NextResponse.json({
      id: settings.id,
      budgetLimit: settings.budget_limit,
      debtWarningLine: settings.debt_warning_line,
    })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { budgetLimit, debtWarningLine } = body

    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single()

    if (fetchError && fetchError.code === 'PGRST116') {
      // No settings exist, create one
      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert([
          {
            budget_limit: budgetLimit !== undefined ? parseFloat(budgetLimit) : 0,
            debt_warning_line: debtWarningLine !== undefined ? parseFloat(debtWarningLine) : 0,
          },
        ])
        .select()
        .single()

      if (createError) throw createError
      return NextResponse.json({
        id: newSettings.id,
        budgetLimit: newSettings.budget_limit,
        debtWarningLine: newSettings.debt_warning_line,
      })
    }

    if (fetchError) throw fetchError

    const updateData: Record<string, unknown> = {}
    if (budgetLimit !== undefined) updateData.budget_limit = parseFloat(budgetLimit)
    if (debtWarningLine !== undefined) updateData.debt_warning_line = parseFloat(debtWarningLine)

    const { data: updated, error: updateError } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      id: updated.id,
      budgetLimit: updated.budget_limit,
      debtWarningLine: updated.debt_warning_line,
    })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}
