import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: records, error } = await supabase.from('records').select('*')

    if (error) throw error

    let totalIncome = 0
    let totalExpense = 0
    let totalDebtIncrease = 0
    let totalRepayment = 0

    records?.forEach(r => {
      if (r.type === '收入') totalIncome += r.amount
      else if (r.type === '支出') totalExpense += r.amount
      else if (r.type === '负债增加') totalDebtIncrease += r.amount
      else if (r.type === '还款') totalRepayment += r.amount
    })

    return NextResponse.json({
      totalIncome,
      totalExpense,
      totalDebtIncrease,
      totalRepayment,
      netAssets: totalIncome - totalExpense - totalDebtIncrease + totalRepayment,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
