import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const sampleRecords = [
      { type: "收入", category: "工资", amount: 15000, note: "3月工资", year, month, day: 5 },
      { type: "支出", category: "房租", amount: 3500, note: "月租金", year, month, day: 1 },
      { type: "支出", category: "餐饮", amount: 890, note: "日常饮食", year, month, day: 3 },
      { type: "支出", category: "交通", amount: 320, note: "地铁公交", year, month, day: 4 },
      { type: "支出", category: "购物", amount: 1280, note: "生活用品", year, month, day: 6 },
      { type: "支出", category: "娱乐", amount: 450, note: "电影游戏", year, month, day: 7 },
      { type: "支出", category: "医疗", amount: 260, note: "体检", year, month, day: 8 },
      { type: "支出", category: "旅游", amount: 3200, note: "周末短途游", year, month, day: 9 },
      { type: "支出", category: "教育", amount: 680, note: "在线课程", year, month, day: 10 },
      { type: "支出", category: "通讯", amount: 158, note: "话费", year, month, day: 11 },
      { type: "支出", category: "餐饮", amount: 560, note: "聚餐", year, month, day: 12 },
      { type: "负债增加", category: "其他", amount: 5000, note: "信用卡", year, month, day: 14 },
      { type: "还款", category: "转账", amount: 2000, note: "还花呗", year, month, day: 15 },
      // Previous months
      { type: "收入", category: "工资", amount: 15000, note: "2月工资", year, month: month > 1 ? month - 1 : 12, day: 5 },
      { type: "支出", category: "房租", amount: 3500, note: "月租金", year, month: month > 1 ? month - 1 : 12, day: 1 },
      { type: "支出", category: "餐饮", amount: 1200, note: "日常饮食", year, month: month > 1 ? month - 1 : 12, day: 8 },
      { type: "支出", category: "购物", amount: 2300, note: "衣服", year, month: month > 1 ? month - 1 : 12, day: 14 },
      { type: "支出", category: "交通", amount: 280, note: "打车", year, month: month > 1 ? month - 1 : 12, day: 20 },
      { type: "支出", category: "通讯", amount: 158, note: "话费", year, month: month > 1 ? month - 1 : 12, day: 11 },
      { type: "支出", category: "旅游", amount: 5600, note: "春节旅行", year, month: month > 1 ? month - 1 : 12, day: 3 },
      // 3 months ago
      { type: "收入", category: "工资", amount: 15000, note: "1月工资", year, month: month > 2 ? month - 2 : (month > 1 ? 12 : 11), day: 5 },
      { type: "支出", category: "房租", amount: 3500, note: "月租金", year, month: month > 2 ? month - 2 : (month > 1 ? 12 : 11), day: 1 },
      { type: "支出", category: "医疗", amount: 1500, note: "看病", year, month: month > 2 ? month - 2 : (month > 1 ? 12 : 11), day: 12 },
      { type: "支出", category: "餐饮", amount: 980, note: "日常", year, month: month > 2 ? month - 2 : (month > 1 ? 12 : 11), day: 15 },
      { type: "支出", category: "教育", amount: 1200, note: "培训费", year, month: month > 2 ? month - 2 : (month > 1 ? 12 : 11), day: 18 },
      // 4 months ago
      { type: "收入", category: "工资", amount: 14500, note: "12月工资", year: month > 3 ? year : year - 1, month: month > 3 ? month - 3 : month + 9, day: 5 },
      { type: "支出", category: "房租", amount: 3500, note: "月租金", year: month > 3 ? year : year - 1, month: month > 3 ? month - 3 : month + 9, day: 1 },
      { type: "支出", category: "娱乐", amount: 800, note: "聚会", year: month > 3 ? year : year - 1, month: month > 3 ? month - 3 : month + 9, day: 22 },
      { type: "支出", category: "购物", amount: 1800, note: "年货", year: month > 3 ? year : year - 1, month: month > 3 ? month - 3 : month + 9, day: 25 },
      { type: "支出", category: "交通", amount: 600, note: "年底出行", year: month > 3 ? year : year - 1, month: month > 3 ? month - 3 : month + 9, day: 28 },
    ]

    const { data, error } = await supabase
      .from('records')
      .insert(sampleRecords)
      .select()

    if (error) throw error

    return NextResponse.json({ count: data?.length || 0, message: "示例数据已添加" })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: '添加示例数据失败' }, { status: 500 })
  }
}
