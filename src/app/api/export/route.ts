import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('day', { ascending: false })

    if (error) throw error

    const data = (records || []).map((r, i) => ({
      序号: i + 1,
      日期: `${r.year}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`,
      类型: r.type,
      类别: r.category,
      金额: r.amount,
      备注: r.note,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, '记账记录')

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=accounting_records.xlsx',
      },
    })
  } catch (error) {
    console.error('GET /api/export error:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
