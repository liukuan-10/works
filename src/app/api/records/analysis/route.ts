import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const pieYear = searchParams.get('pieYear')
    const pieMonth = searchParams.get('pieMonth')

    const now = new Date()
    const currentYear = year ? parseInt(year) : now.getFullYear()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1
    const selectedPieYear = pieYear ? parseInt(pieYear) : currentYear
    const selectedPieMonth = pieMonth ? parseInt(pieMonth) : currentMonth

    const { data: allRecords, error: recordsError } = await supabase
      .from('records')
      .select('*')

    if (recordsError) throw recordsError

    const records = allRecords || []
    const expenseRecords = records.filter((r) => r.type === '支出')

    // Monthly expense comparison (last 12 months)
    const monthlyExpense: Record<string, number> = {}
    const months: string[] = []

    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const key = `${y}-${String(m).padStart(2, '0')}`
      months.push(key)
      monthlyExpense[key] = 0
    }

    expenseRecords.forEach((record) => {
      const key = `${record.year}-${String(record.month).padStart(2, '0')}`
      if (key in monthlyExpense) {
        monthlyExpense[key] += record.amount
      }
    })

    const monthlyExpenseData = months.map((m) => ({
      month: m,
      amount: Math.round(monthlyExpense[m] * 100) / 100,
    }))

    // Selected month expense pie chart data
    const selectedMonthExpenses = expenseRecords.filter(
      (r) => r.year === selectedPieYear && r.month === selectedPieMonth
    )

    const categoryMap: Record<string, number> = {}
    selectedMonthExpenses.forEach((r) => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount
    })

    const pieData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))

    // Selected month expense ranking
    const rankingData = selectedMonthExpenses
      .sort((a, b) => b.amount - a.amount)
      .map((r) => ({
        date: `${r.year}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`,
        category: r.category,
        amount: r.amount,
        note: r.note,
      }))

    // Category summary (all time)
    const categorySummary: Record<string, { total: number; count: number }> = {}
    expenseRecords.forEach((r) => {
      if (!categorySummary[r.category]) {
        categorySummary[r.category] = { total: 0, count: 0 }
      }
      categorySummary[r.category].total += r.amount
      categorySummary[r.category].count += 1
    })

    const categorySummaryData = Object.entries(categorySummary)
      .map(([category, data]) => ({
        category,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        average: Math.round((data.total / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)

    // Month-over-month comparison: selected month vs previous month
    const prevMonthDate = new Date(selectedPieYear, selectedPieMonth - 2, 1)
    const prevYear = prevMonthDate.getFullYear()
    const prevMonth = prevMonthDate.getMonth() + 1

    const prevMonthExpenses = expenseRecords.filter(
      (r) => r.year === prevYear && r.month === prevMonth
    )

    const prevCategoryMap: Record<string, number> = {}
    prevMonthExpenses.forEach((r) => {
      prevCategoryMap[r.category] = (prevCategoryMap[r.category] || 0) + r.amount
    })

    // Build comparison data for all categories that appear in either month
    const allCategories = new Set([
      ...Object.keys(categoryMap),
      ...Object.keys(prevCategoryMap),
    ])

    const monthOverMonthData = Array.from(allCategories).map((cat) => {
      const currentAmount = Math.round((categoryMap[cat] || 0) * 100) / 100
      const prevAmount = Math.round((prevCategoryMap[cat] || 0) * 100) / 100
      const delta = Math.round((currentAmount - prevAmount) * 100) / 100
      const deltaPercent = prevAmount > 0
        ? Math.round((delta / prevAmount) * 10000) / 100
        : (currentAmount > 0 ? 100 : 0)

      return {
        category: cat,
        currentAmount,
        prevAmount,
        delta,
        deltaPercent,
      }
    }).sort((a, b) => b.delta - a.delta)

    const currentTotal = monthOverMonthData.reduce((s, d) => s + d.currentAmount, 0)
    const prevTotal = monthOverMonthData.reduce((s, d) => s + d.prevAmount, 0)
    const totalDelta = Math.round((currentTotal - prevTotal) * 100) / 100

    // Available months for pie chart selector (months that have records)
    const availableMonths: { year: number; month: number; label: string }[] = []
    const monthSet = new Set<string>()
    records.forEach((r) => {
      const key = `${r.year}-${r.month}`
      if (!monthSet.has(key)) {
        monthSet.add(key)
        availableMonths.push({
          year: r.year,
          month: r.month,
          label: `${r.year}年${r.month}月`,
        })
      }
    })
    availableMonths.sort((a, b) => (b.year - a.year) || (b.month - a.month))

    return NextResponse.json({
      monthlyExpenseData,
      pieData,
      rankingData,
      categorySummaryData,
      currentYear,
      currentMonth,
      selectedPieYear,
      selectedPieMonth,
      monthOverMonthData,
      totalDelta,
      prevYear,
      prevMonth,
      availableMonths,
    })
  } catch (error) {
    console.error('GET /api/records/analysis error:', error)
    return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 })
  }
}
