import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const now = new Date()
    const currentYear = year ? parseInt(year) : now.getFullYear()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1

    const { data: records, error } = await supabase.from('records').select('*')

    if (error) throw error

    return NextResponse.json({
      records: records || [],
      currentYear,
      currentMonth,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }
}
