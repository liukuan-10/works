import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    let query = supabase
      .from('records')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('day', { ascending: false })
      .order('created_at', { ascending: false })

    if (year) query = query.eq('year', parseInt(year))
    if (month) query = query.eq('month', parseInt(month))
    if (type) query = query.eq('type', type)
    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/records error:', error)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, category, amount, note, year, month, day } = body

    if (!type || !category || amount === undefined || !year || !month || !day) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('records')
      .insert([
        {
          type,
          category,
          amount: parseFloat(amount),
          note: note || '',
          year: parseInt(year),
          month: parseInt(month),
          day: parseInt(day),
        },
      ])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/records error:', error)
    return NextResponse.json({ error: '创建记录失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, category, amount, note, year, month, day } = body

    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (type) updateData.type = type
    if (category) updateData.category = category
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (note !== undefined) updateData.note = note
    if (year) updateData.year = parseInt(year)
    if (month) updateData.month = parseInt(month)
    if (day) updateData.day = parseInt(day)

    const { data, error } = await supabase
      .from('records')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('PUT /api/records error:', error)
    return NextResponse.json({ error: '更新记录失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/records error:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
