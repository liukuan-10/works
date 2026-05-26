import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('day', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, category, amount, note, year, month, day } = body

    const { data, error } = await supabase
      .from('records')
      .insert([{ type, category, amount, note, year, month, day }])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase.from('records').delete().eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
