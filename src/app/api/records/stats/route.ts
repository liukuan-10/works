import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('records')
      .select('*')

    if (error) throw error

    let totalIncome = 0
    let totalExpense = 0
    let totalDebtIncrease = 0
    let totalRepayment = 0

    records?.forEach((record) => {
      switch (record.type) {
        case '收入':
          totalIncome += record.amount
          break
        case '支出':
          totalExpense += record.amount
          break
        case '负债增加':
          totalDebtIncrease += record.amount
          break
        case '还款':
          totalRepayment += record.amount
          break
      }
    })

    const netAssets = totalIncome - totalExpense - totalDebtIncrease + totalRepayment

    return NextResponse.json({
      totalIncome,
      totalExpense,
      totalDebtIncrease,
      totalRepayment,
      netAssets,
    })
  } catch (error) {
    console.error('GET /api/records/stats error:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
