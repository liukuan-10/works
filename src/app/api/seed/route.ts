import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const records = [
      { type: "收入", category: "工资", amount: 15000, note: "Monthly salary", year, month, day: 5 },
      { type: "支出", category: "房租", amount: 3500, note: "Rent", year, month, day: 1 },
      { type: "支出", category: "餐饮", amount: 890, note: "Meals", year, month, day: 3 },
      { type: "支出", category: "交通", amount: 320, note: "Transport", year, month, day: 4 },
      { type: "支出", category: "购物", amount: 1280, note: "Shopping", year, month, day: 6 },
      { type: "支出", category: "娱乐", amount: 450, note: "Entertainment", year, month, day: 7 },
      { type: "支出", category: "医疗", amount: 260, note: "Healthcare", year, month, day: 8 },
      { type: "支出", category: "旅游", amount: 3200, note: "Travel", year, month, day: 9 },
      { type: "支出", category: "教育", amount: 680, note: "Education", year, month, day: 10 },
      { type: "支出", category: "通讯", amount: 158, note: "Phone bill", year, month, day: 11 },
    ]

    const { data, error } = await supabase.from('records').insert(records).select()

    if (error) throw error
    return NextResponse.json({ count: data?.length || 0, message: 'Sample data added' })
  } catch {
    return NextResponse.json({ error: 'Failed to add sample data' }, { status: 500 })
  }
}
