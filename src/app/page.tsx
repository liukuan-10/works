"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator,
} from "@/components/ui/menubar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ZAxis, Tooltip,
} from "recharts"
import {
  Plus, Trash2, Download, FileSpreadsheet, Database, Settings, HelpCircle, TrendingUp, TrendingDown, Wallet, AlertTriangle, Sparkles, Loader2,
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, ScatterChart as ScatterChartIcon,
  CircleDot, Target,
} from "lucide-react"

// Types
interface Record {
  id: string
  type: string
  category: string
  amount: number
  note: string
  year: number
  month: number
  day: number
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalIncome: number
  totalExpense: number
  totalDebtIncrease: number
  totalRepayment: number
  netAssets: number
}

interface AppSettings {
  id: string
  budgetLimit: number
  debtWarningLine: number
}

interface AnalysisData {
  monthlyExpenseData: { month: string; amount: number }[]
  pieData: { name: string; value: number }[]
  rankingData: { date: string; category: string; amount: number; note: string }[]
  categorySummaryData: { category: string; total: number; count: number; average: number }[]
  currentYear: number
  currentMonth: number
  selectedPieYear: number
  selectedPieMonth: number
  monthOverMonthData: { category: string; currentAmount: number; prevAmount: number; delta: number; deltaPercent: number }[]
  totalDelta: number
  prevYear: number
  prevMonth: number
  availableMonths: { year: number; month: number; label: string }[]
}

const RECORD_TYPES = ["收入", "支出", "负债增加", "还款"]
const CATEGORIES = ["工资", "餐饮", "购物", "交通", "娱乐", "旅游", "医疗", "房租", "教育", "通讯", "转账", "其他"]

const PIE_COLORS = [
  "oklch(0.646 0.222 41.116)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.398 0.07 227.392)",
  "oklch(0.828 0.189 84.429)",
  "oklch(0.769 0.188 70.08)",
  "oklch(0.7 0.15 300)",
  "oklch(0.65 0.2 150)",
  "oklch(0.55 0.18 60)",
  "oklch(0.6 0.25 30)",
  "oklch(0.75 0.15 200)",
  "oklch(0.5 0.2 280)",
  "oklch(0.68 0.12 120)",
]

const typeColorMap: Record<string, string> = {
  "收入": "bg-emerald-100 text-emerald-800",
  "支出": "bg-red-100 text-red-800",
  "负债增加": "bg-amber-100 text-amber-800",
  "还款": "bg-sky-100 text-sky-800",
}

const categoryColorMap: Record<string, string> = {
  "工资": "bg-emerald-50 text-emerald-700",
  "餐饮": "bg-orange-50 text-orange-700",
  "购物": "bg-pink-50 text-pink-700",
  "交通": "bg-sky-50 text-sky-700",
  "娱乐": "bg-violet-50 text-violet-700",
  "旅游": "bg-teal-50 text-teal-700",
  "医疗": "bg-red-50 text-red-700",
  "房租": "bg-amber-50 text-amber-700",
  "教育": "bg-indigo-50 text-indigo-700",
  "通讯": "bg-cyan-50 text-cyan-700",
  "转账": "bg-lime-50 text-lime-700",
  "其他": "bg-gray-50 text-gray-700",
}

// ScrollPicker - iOS-style wheel picker, one step per scroll
const ITEM_H = 32
const VISIBLE_COUNT = 5
const CENTER_IDX = Math.floor(VISIBLE_COUNT / 2)

function ScrollPicker({ items, value, onChange, suffix }: { items: string[]; value: string; onChange: (v: string) => void; suffix?: string }) {
  const selectedIndex = items.indexOf(value)

  // Intercept wheel to step one item at a time
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const dir = e.deltaY > 0 ? 1 : -1
    const next = Math.max(0, Math.min(items.length - 1, selectedIndex + dir))
    if (next !== selectedIndex) {
      onChange(items[next])
    }
  }, [items, selectedIndex, onChange])

  return (
    <div className="relative select-none" style={{ height: VISIBLE_COUNT * ITEM_H }}>
      <div className="h-full overflow-hidden" onWheel={handleWheel}>
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${(CENTER_IDX - selectedIndex) * ITEM_H}px)` }}
        >
          {items.map((item) => {
            const isSelected = item === value
            return (
              <div
                key={item}
                style={{ height: ITEM_H }}
                className={`flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                  isSelected ? "text-primary font-semibold text-sm" : "text-foreground text-sm"
                }`}
                onClick={() => onChange(item)}
              >
                {item}{suffix}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AccountingApp() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("data")
  const [records, setRecords] = useState<Record[]>([])
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, totalDebtIncrease: 0, totalRepayment: 0, netAssets: 0 })
  const [settings, setSettings] = useState<AppSettings>({ id: "", budgetLimit: 0, debtWarningLine: 0 })
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  // Form states
  const [formType, setFormType] = useState("支出")
  const [formCategory, setFormCategory] = useState("餐饮")
  const [formAmount, setFormAmount] = useState("")
  const [formNote, setFormNote] = useState("")
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString())
  const [formMonth, setFormMonth] = useState((new Date().getMonth() + 1).toString())
  const [formDay, setFormDay] = useState(new Date().getDate().toString())

  // Settings form
  const [formBudgetLimit, setFormBudgetLimit] = useState("0")
  const [formDebtWarningLine, setFormDebtWarningLine] = useState("0")

  // Ranking filter
  const [rankingFilter, setRankingFilter] = useState("all")

  // Data list filters
  const [listMonthFilter, setListMonthFilter] = useState<string>("all")
  const [listTypeFilter, setListTypeFilter] = useState<string>("all")

  // Pie chart month selector
  const [pieMonthKey, setPieMonthKey] = useState("")

  // Chart style selector for monthly expense comparison
  const [chartStyle, setChartStyle] = useState<"bar" | "line" | "area" | "scatter">("bar")

  // Chart style selector for expense composition
  const [pieStyle, setPieStyle] = useState<"pie" | "donut" | "radar" | "bar">("pie")

  // AI plan dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [planData, setPlanData] = useState<{ summary: string; items: { title: string; amount: string; description: string; suggestions: string[] }[]; overallSuggestion: string } | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  // Refresh counter for triggering data reload
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const initialLoadRef = useRef(false)
  const chartScrollRef = useRef<HTMLDivElement>(null)

  // Load data on refresh
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [recordsRes, statsRes, settingsRes] = await Promise.all([
          fetch("/api/records"),
          fetch("/api/records/stats"),
          fetch("/api/settings"),
        ])
        if (cancelled) return

        if (recordsRes.ok) {
          const data = await recordsRes.json()
          setRecords(data)
        }
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data)
          if (!initialLoadRef.current) {
            setFormBudgetLimit(data.budgetLimit.toString())
            setFormDebtWarningLine(data.debtWarningLine.toString())
          }
        }
      } catch {
        // silently fail on refresh
        if (!initialLoadRef.current) {
          toast({ title: "加载记录失败", variant: "destructive" })
        }
      }
      initialLoadRef.current = true
    }

    loadData()
    return () => { cancelled = true }
  }, [refreshKey, toast])

  // Load analysis data when on analysis tab
  useEffect(() => {
    if (activeTab !== "analysis") return
    let cancelled = false

    async function loadAnalysis() {
      try {
        const params = new URLSearchParams()
        if (pieMonthKey) {
          const [y, m] = pieMonthKey.split("-")
          params.set("pieYear", y)
          params.set("pieMonth", m)
        }
        const res = await fetch(`/api/records/analysis?${params.toString()}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setAnalysisData(data)
        }
      } catch {
        // silently fail
      }
    }

    loadAnalysis()
    return () => { cancelled = true }
  }, [activeTab, refreshKey, pieMonthKey])

  // Scroll chart to the right (latest month) when analysis data loads
  useEffect(() => {
    if (activeTab !== "analysis") return
    const el = chartScrollRef.current
    if (el) {
      // Use requestAnimationFrame to ensure content is rendered
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth
      })
    }
  }, [activeTab, analysisData, chartStyle])

  const refreshData = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleLoadSampleData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      if (res.ok) {
        toast({ title: "示例数据已加载" })
        refreshData()
      }
    } catch {
      toast({ title: "加载示例数据失败", variant: "destructive" })
    }
  }

  // Check budget/debt warnings
  const budgetWarning = settings.budgetLimit > 0 && stats.totalExpense > settings.budgetLimit
  const debtWarning = settings.debtWarningLine > 0 && stats.totalDebtIncrease - stats.totalRepayment > settings.debtWarningLine

  // CRUD operations
  const handleAddRecord = async () => {
    if (!formAmount || parseFloat(formAmount) <= 0) {
      toast({ title: "请输入有效金额", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          category: formCategory,
          amount: formAmount,
          note: formNote,
          year: formYear,
          month: formMonth,
          day: formDay,
        }),
      })
      if (res.ok) {
        toast({ title: "添加成功" })
        setShowAddDialog(false)
        resetForm()
        refreshData()
      }
    } catch {
      toast({ title: "添加失败", variant: "destructive" })
    }
  }

  const handleEditRecord = async () => {
    if (!selectedRecord || !formAmount || parseFloat(formAmount) <= 0) {
      toast({ title: "请输入有效金额", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRecord.id,
          type: formType,
          category: formCategory,
          amount: formAmount,
          note: formNote,
          year: formYear,
          month: formMonth,
          day: formDay,
        }),
      })
      if (res.ok) {
        toast({ title: "编辑成功" })
        setShowEditDialog(false)
        setSelectedRecord(null)
        resetForm()
        refreshData()
      }
    } catch {
      toast({ title: "编辑失败", variant: "destructive" })
    }
  }

  const handleDeleteSelected = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const ids = Array.from(selectedRecords)
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/records?id=${id}`, { method: "DELETE" })
        )
      )
      const failedCount = results.filter(r => !r.ok).length
      if (failedCount > 0) {
        toast({ title: `${failedCount} 条记录删除失败`, variant: "destructive" })
      } else {
        toast({ title: `已删除 ${ids.length} 条记录` })
      }
      setShowDeleteDialog(false)
      setSelectedRecords(new Set())
      refreshData()
    } catch {
      toast({ title: "删除失败", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetLimit: formBudgetLimit,
          debtWarningLine: formDebtWarningLine,
        }),
      })
      if (res.ok) {
        toast({ title: "设置已保存" })
        setShowSettingsDialog(false)
        refreshData()
      }
    } catch {
      toast({ title: "保存设置失败", variant: "destructive" })
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "accounting_records.xlsx"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast({ title: "导出成功" })
      }
    } catch {
      toast({ title: "导出失败", variant: "destructive" })
    }
  }

  const handleGeneratePlan = async () => {
    if (!analysisData?.monthOverMonthData || analysisData.monthOverMonthData.length === 0) {
      toast({ title: "暂无对比数据，请先添加记录", variant: "destructive" })
      return
    }
    setPlanLoading(true)
    setShowPlanDialog(true)
    setPlanData(null)
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonData: analysisData.monthOverMonthData,
          budgetLimit: settings.budgetLimit,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPlanData(data.plan || null)
      } else {
        setPlanData({ summary: "生成规划方案失败，请稍后重试", items: [], overallSuggestion: "" })
      }
    } catch {
      setPlanData({ summary: "网络错误，请稍后重试", items: [], overallSuggestion: "" })
    }
    setPlanLoading(false)
  }

  const resetForm = () => {
    setFormType("支出")
    setFormCategory("餐饮")
    setFormAmount("")
    setFormNote("")
    const now = new Date()
    setFormYear(now.getFullYear().toString())
    setFormMonth((now.getMonth() + 1).toString())
    setFormDay(now.getDate().toString())
  }

  const openEditDialog = (record: Record) => {
    setSelectedRecord(record)
    setFormType(record.type)
    setFormCategory(record.category)
    setFormAmount(record.amount.toString())
    setFormNote(record.note)
    setFormYear(record.year.toString())
    setFormMonth(record.month.toString())
    setFormDay(record.day.toString())
    setShowEditDialog(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatDate = (r: Record) =>
    `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`

  // Generate year/month/day options
  const yearOptions = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString())
  const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const getDayOptions = () => {
    const y = parseInt(formYear)
    const m = parseInt(formMonth)
    const daysInMonth = new Date(y, m, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())
  }

  // Custom chart label for bar/area
  const ChartValueLabel = ({ x, y, width, value }: { x: number; y: number; width: number; value: number }) => {
    if (value === 0) return null
    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={500}>
        {`￥${value.toLocaleString()}`}
      </text>
    )
  }

  const CustomBarLabel = (props: Record<string, unknown>) => {
    const { x, y, width, value } = props as { x: number; y: number; width: number; value: number }
    if (value === undefined || value === null) return null
    return <ChartValueLabel x={x} y={y} width={width} value={value} />
  }

  // Pie chart label radius constant
  const PIE_OUTER_RADIUS = 58

  // Pre-compute adjusted Y positions for pie labels with anti-overlap
  // This sorts labels by their natural Y position on each side (left/right),
  // then applies push-down to prevent overlaps
  const pieLabelYOffsets = useMemo(() => {
    const data = analysisData?.pieData || []
    if (!data.length) return new Map<number, number>()

    const total = data.reduce((s, d) => s + d.value, 0)
    if (total === 0) return new Map()

    const RADIAN = Math.PI / 180
    let currentAngle = 0 // recharts default startAngle (0 = top/12 o'clock)

    const labels: Array<{ index: number; isRight: boolean; relativeY: number }> = []

    data.forEach((d, i) => {
      const percent = total > 0 ? d.value / total : 0
      if (percent < 0.03) {
        currentAngle += percent * 360
        return
      }

      const sliceAngle = percent * 360
      const midAngle = currentAngle + sliceAngle / 2
      currentAngle += sliceAngle

      const sinA = Math.sin(midAngle * RADIAN)
      const cosA = Math.cos(midAngle * RADIAN)

      labels.push({
        index: i,
        isRight: sinA >= 0,
        relativeY: -cosA, // proxy for Y position (higher value = lower on screen)
      })
    })

    // Anti-overlap per side - sort by Y position (top to bottom) then push down if too close
    const leftLabels = labels.filter(l => !l.isRight).sort((a, b) => a.relativeY - b.relativeY)
    const rightLabels = labels.filter(l => l.isRight).sort((a, b) => a.relativeY - b.relativeY)

    const result = new Map<number, number>() // index → Y pixel offset
    const elbowR = PIE_OUTER_RADIUS + 14
    const minGapPx = 18
    const minGapRelative = minGapPx / elbowR

    for (const sideLabels of [leftLabels, rightLabels]) {
      let prevRelY = -Infinity
      for (const l of sideLabels) {
        let relY = l.relativeY
        if (relY - prevRelY < minGapRelative) {
          relY = prevRelY + minGapRelative
        }
        const offsetPx = (relY - l.relativeY) * elbowR
        result.set(l.index, offsetPx)
        prevRelY = relY
      }
    }

    return result
  }, [analysisData?.pieData])

  // Pie chart label with polyline leader lines - percentage OUTSIDE with pre-computed anti-overlap
  const renderPieCustomLabel = (props: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number;
    percent: number; index: number
  }) => {
    const { cx, cy, midAngle, outerRadius, percent, index } = props
    // Skip very small slices
    if (percent < 0.03) return null

    const RADIAN = Math.PI / 180
    const sinA = Math.sin(midAngle * RADIAN)
    const cosA = Math.cos(midAngle * RADIAN)

    // Determine which side of the pie the label is on
    const isRight = sinA >= 0

    // Point on the outer edge of the slice
    const sx = cx + outerRadius * sinA
    const sy = cy - outerRadius * cosA

    // Elbow point: slightly outside the slice along the radial direction
    const elbowR = outerRadius + 14
    const elbowX = cx + elbowR * sinA
    const naturalElbowY = cy - elbowR * cosA

    // Apply pre-computed offset for anti-overlap
    const yOffset = pieLabelYOffsets.get(index) ?? 0
    const adjustedY = naturalElbowY + yOffset

    // Horizontal line endpoint
    const lineLen = 22
    const hx = isRight ? elbowX + lineLen : elbowX - lineLen

    return (
      <g key={`pie-label-${index}`}>
        <polyline
          points={`${sx},${sy} ${elbowX},${adjustedY} ${hx},${adjustedY}`}
          fill="none"
          stroke="#999"
          strokeWidth={1}
        />
        <circle cx={sx} cy={sy} r={1.5} fill="#999" />
        <text
          x={isRight ? hx + 4 : hx - 4}
          y={adjustedY}
          textAnchor={isRight ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={11}
          fill="#555"
          fontWeight={500}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    )
  }

  // Custom line/area/scatter chart label at data points
  const CustomPointLabel = (props: Record<string, unknown>) => {
    // Line/Area charts pass: { x, y, value }
    // Scatter charts pass: { x/cx, y/cy, value (may be undefined), payload: { month, amount } }
    const x = (props.x as number) ?? (props.cx as number) ?? 0
    const y = (props.y as number) ?? (props.cy as number) ?? 0
    const rawValue = props.value as number | undefined
    const payload = props.payload as { month?: string; amount?: number } | undefined
    const amount = rawValue ?? payload?.amount

    if (amount === undefined || amount === 0) return null
    return (
      <text x={x} y={y - 8} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={500}>
        {`￥${amount.toLocaleString()}`}
      </text>
    )
  }

  // Chart style options for monthly expense
  const chartStyleOptions = [
    { value: "bar" as const, label: "柱状图", icon: BarChart3 },
    { value: "line" as const, label: "折线图", icon: LineChartIcon },
    { value: "area" as const, label: "面积图", icon: AreaChartIcon },
    { value: "scatter" as const, label: "散点图", icon: ScatterChartIcon },
  ]

  // Chart style options for expense composition
  const pieStyleOptions = [
    { value: "pie" as const, label: "饼图", icon: PieChart as React.ComponentType<{ className?: string }> },
    { value: "donut" as const, label: "环形图", icon: CircleDot },
    { value: "radar" as const, label: "雷达图", icon: Target },
    { value: "bar" as const, label: "条形图", icon: BarChart3 },
  ]

  const filteredRankingData = rankingFilter === "all"
    ? analysisData?.rankingData || []
    : (analysisData?.rankingData || []).filter((r) => r.category === rankingFilter)

  // Filtered records for data list
  const filteredRecords = records.filter((r) => {
    if (listMonthFilter !== "all") {
      const [fy, fm] = listMonthFilter.split("-")
      if (r.year !== parseInt(fy) || r.month !== parseInt(fm)) return false
    }
    if (listTypeFilter !== "all" && r.type !== listTypeFilter) return false
    return true
  })

  return (
    <div className="w-[1200px] h-[700px] flex flex-col bg-background border border-border rounded-lg overflow-hidden shadow-lg mx-auto" style={{ position: "relative" }}>
      {/* Menu Bar */}
      <Menubar className="rounded-none border-x-0 border-t-0 h-8 flex-shrink-0">
        <MenubarMenu>
          <MenubarTrigger className="h-7 text-xs">文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleExport}>
              <Download className="mr-2 h-3.5 w-3.5" />
              导出Excel
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleLoadSampleData}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              加载示例数据
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => { resetForm(); setShowAddDialog(true) }}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              新增记录
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="h-7 text-xs">数据</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setActiveTab("data")}>
              <Database className="mr-2 h-3.5 w-3.5" />
              记录列表
            </MenubarItem>
            <MenubarItem onClick={() => setActiveTab("analysis")}>
              <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
              数据分析
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="h-7 text-xs">设置</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => { setShowSettingsDialog(true) }}>
              <Settings className="mr-2 h-3.5 w-3.5" />
              预算与预警
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="h-7 text-xs">帮助</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setShowHelpDialog(true)}>
              <HelpCircle className="mr-2 h-3.5 w-3.5" />
              使用说明
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Warning Banner */}
      {(budgetWarning || debtWarning) && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex-shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {budgetWarning && <span>支出已超过预算上限 {settings.budgetLimit.toLocaleString()} 元</span>}
          {budgetWarning && debtWarning && <span className="mx-2">|</span>}
          {debtWarning && <span>负债已超过预警线 {settings.debtWarningLine.toLocaleString()} 元</span>}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-background h-8 px-2 flex-shrink-0">
            <TabsTrigger value="data" className="text-xs h-6 data-[state=active]:bg-muted">数据列表</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs h-6 data-[state=active]:bg-muted">数据分析</TabsTrigger>
          </TabsList>

          {/* Data List Tab */}
          <TabsContent value="data" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden" style={{ height: "100%" }}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => { resetForm(); setShowAddDialog(true) }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加记录
              </Button>
              {selectedRecords.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  删除 ({selectedRecords.size})
                </Button>
              )}
              <div className="h-5 w-px bg-border mx-1" />
              <Select value={listMonthFilter} onValueChange={setListMonthFilter}>
                <SelectTrigger className="w-auto min-w-[90px] h-7 text-xs gap-1">
                  <SelectValue placeholder="全部月份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部月份</SelectItem>
                  {Array.from(new Set(records.map(r => `${r.year}-${String(r.month).padStart(2, "0")}`))).sort().reverse().map(ym => {
                    const [y, m] = ym.split("-")
                    return (
                      <SelectItem key={ym} value={ym} className="text-xs">{y}年{parseInt(m)}月</SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select value={listTypeFilter} onValueChange={setListTypeFilter}>
                <SelectTrigger className="w-auto min-w-[80px] h-7 text-xs gap-1">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部类型</SelectItem>
                  {RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(listMonthFilter !== "all" || listTypeFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 text-muted-foreground"
                  onClick={() => { setListMonthFilter("all"); setListTypeFilter("all") }}
                >
                  清除筛选
                </Button>
              )}
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground">{filteredRecords.length} 条记录</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1" />
                导出
              </Button>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-y-auto relative">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="text-xs">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={filteredRecords.length > 0 && filteredRecords.every(r => selectedRecords.has(r.id))}
                        ref={(el) => {
                          if (el) el.indeterminate = filteredRecords.some(r => selectedRecords.has(r.id)) && !filteredRecords.every(r => selectedRecords.has(r.id))
                        }}
                        onChange={() => {
                          if (filteredRecords.every(r => selectedRecords.has(r.id))) {
                            setSelectedRecords(new Set())
                          } else {
                            setSelectedRecords(new Set(filteredRecords.map((r) => r.id)))
                          }
                        }}
                        className="cb-sky"
                      />
                    </TableHead>
                    <TableHead className="w-24">日期</TableHead>
                    <TableHead className="w-20">类型</TableHead>
                    <TableHead className="w-20">类别</TableHead>
                    <TableHead className="w-28 text-right pr-6">金额</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <span>暂无记录，点击"添加记录"开始记账</span>
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleLoadSampleData}>
                            加载示例数据
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <span>没有符合条件的记录</span>
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setListMonthFilter("all"); setListTypeFilter("all") }}>
                            清除筛选
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className={`text-xs cursor-pointer`}
                        style={selectedRecords.has(record.id) ? { backgroundColor: "#f0f9ff" } : undefined}
                        onClick={() => toggleSelect(record.id)}
                        onDoubleClick={() => openEditDialog(record)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            className="cb-sky"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{formatDate(record)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${typeColorMap[record.type] || ""}`}>
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.category}</TableCell>
                        <TableCell className="text-right font-mono pr-6">
                          <span className={record.type === "收入" || record.type === "还款" ? "text-emerald-600" : "text-red-600"}>
                            {record.type === "收入" || record.type === "还款" ? "+" : "-"}{record.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[200px]">{record.note || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Data Analysis Tab - 2x2 Grid with solid dividers */}
          <TabsContent value="analysis" className="flex-1 m-0 min-h-0 overflow-hidden">
            <div className="h-full grid grid-cols-2 grid-rows-2">
              {/* Top Left: Monthly Expense Chart */}
              <div className="h-full flex flex-col p-3 border-r border-b border-border">
                <div className="flex items-center justify-between mb-2 flex-shrink-0 gap-2">
                  <h3 className="text-sm font-medium whitespace-nowrap">每月支出对比</h3>
                  <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
                    {chartStyleOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setChartStyle(opt.value)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                            chartStyle === opt.value
                              ? "bg-background shadow-sm text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={opt.label}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div ref={chartScrollRef} className="flex-1 min-h-0 overflow-x-auto">
                  <ChartContainer
                    config={{ amount: { label: "支出金额", color: "oklch(0.6 0.118 184.704)" } }}
                    className="h-full !aspect-auto"
                    style={{ minWidth: `${Math.max(500, (analysisData?.monthlyExpenseData || []).length * 80)}px` }}
                  >
                    {chartStyle === "bar" && (
                      <BarChart data={analysisData?.monthlyExpenseData || []} margin={{ top: 24, right: 16, bottom: 5, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.split("-")[1] + "月"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis hide />
                        <Bar
                          dataKey="amount"
                          fill="oklch(0.6 0.118 184.704)"
                          radius={[3, 3, 0, 0]}
                          label={CustomBarLabel}
                          maxBarSize={32}
                          barCategoryGap="60%"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </BarChart>
                    )}
                    {chartStyle === "line" && (
                      <LineChart data={analysisData?.monthlyExpenseData || []} margin={{ top: 24, right: 16, bottom: 5, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.split("-")[1] + "月"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="oklch(0.6 0.118 184.704)"
                          strokeWidth={2}
                          dot={{ fill: "oklch(0.6 0.118 184.704)", r: 4 }}
                          activeDot={{ r: 6 }}
                          label={CustomPointLabel}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </LineChart>
                    )}
                    {chartStyle === "area" && (
                      <AreaChart data={analysisData?.monthlyExpenseData || []} margin={{ top: 24, right: 16, bottom: 5, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.split("-")[1] + "月"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis hide />
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.6 0.118 184.704)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.6 0.118 184.704)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="oklch(0.6 0.118 184.704)"
                          strokeWidth={2}
                          fill="url(#areaGradient)"
                          dot={{ fill: "oklch(0.6 0.118 184.704)", r: 3 }}
                          label={CustomPointLabel}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </AreaChart>
                    )}
                    {chartStyle === "scatter" && (
                      <ScatterChart margin={{ top: 24, right: 16, bottom: 5, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          type="category"
                          data={analysisData?.monthlyExpenseData || []}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.split("-")[1] + "月"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          name="月份"
                        />
                        <YAxis
                          dataKey="amount"
                          type="number"
                          hide
                          name="支出金额"
                        />
                        <ZAxis range={[120, 120]} />
                        <Scatter
                          data={analysisData?.monthlyExpenseData || []}
                          fill="oklch(0.6 0.118 184.704)"
                          label={CustomPointLabel}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </ScatterChart>
                    )}
                  </ChartContainer>
                </div>
              </div>

              {/* Top Right: Current Month Expense Composition */}
              <div className="h-full flex flex-col p-3 border-b border-border relative">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h3 className="text-sm font-medium whitespace-nowrap">
                    支出构成
                  </h3>
                  <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
                    {pieStyleOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPieStyle(opt.value)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                            pieStyle === opt.value
                              ? "bg-background shadow-sm text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={opt.label}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex relative">
                  {(analysisData?.pieData || []).length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground text-xs">当月无支出数据</p>
                    </div>
                  ) : (
                    <>
                      {/* Chart area */}
                      <div className="flex-1 min-h-0 flex items-center justify-center overflow-visible">
                        <ChartContainer
                          config={Object.fromEntries(
                            CATEGORIES.map((cat, i) => [cat, { label: cat, color: PIE_COLORS[i % PIE_COLORS.length] }])
                          )}
                          className="h-full w-full !aspect-auto overflow-visible"
                        >
                          {pieStyle === "pie" && (
                            <PieChart margin={{ top: 20, right: 55, bottom: 20, left: 55 }}>
                              <Pie
                                data={analysisData?.pieData || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={PIE_OUTER_RADIUS}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={renderPieCustomLabel}
                                minAngle={5}
                              >
                                {(analysisData?.pieData || []).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          )}
                          {pieStyle === "donut" && (
                            <PieChart margin={{ top: 20, right: 55, bottom: 20, left: 55 }}>
                              <Pie
                                data={analysisData?.pieData || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={PIE_OUTER_RADIUS}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={renderPieCustomLabel}
                                minAngle={5}
                              >
                                {(analysisData?.pieData || []).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              {/* Center total label */}
                              <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#374151">
                                ￥{((analysisData?.pieData || []).reduce((s, d) => s + d.value, 0)).toLocaleString()}
                              </text>
                              <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#9ca3af">
                                总支出
                              </text>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          )}
                          {pieStyle === "radar" && (
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={analysisData?.pieData || []}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <PolarRadiusAxis tick={{ fontSize: 8 }} />
                              <Radar
                                name="支出金额"
                                dataKey="value"
                                stroke="oklch(0.6 0.118 184.704)"
                                fill="oklch(0.6 0.118 184.704)"
                                fillOpacity={0.25}
                                strokeWidth={2}
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </RadarChart>
                          )}
                          {pieStyle === "bar" && (
                            <BarChart data={(analysisData?.pieData || []).map(d => {
                              const total = (analysisData?.pieData || []).reduce((s, item) => s + item.value, 0)
                              return { ...d, percent: total > 0 ? Math.round(d.value / total * 100) : 0 }
                            })} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" hide />
                              <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 10 }}
                                width={36}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={20} label={(props: Record<string, unknown>) => {
                                const { x, y, width, value } = props as { x: number; y: number; width: number; value: number }
                                const payload = props.payload as { percent?: number } | undefined
                                const percent = payload?.percent
                                if (!value) return null
                                return (
                                  <text x={x + width + 4} y={y + 10} textAnchor="start" fontSize={9} fill="#6b7280" fontWeight={400}>
                                    {`￥${value.toLocaleString()}${percent !== undefined ? ` ${percent}%` : ""}`}
                                  </text>
                                )
                              }}>
                                {(analysisData?.pieData || []).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Bar>
                              <Tooltip
                                formatter={(value: number) => `￥${value.toLocaleString()}`}
                                labelFormatter={(label: string) => `${label}`}
                              />
                            </BarChart>
                          )}
                        </ChartContainer>
                      </div>
                      {/* Side legend for pie/donut - category names with color blocks */}
                      {(pieStyle === "pie" || pieStyle === "donut") && (
                        <div className="w-[85px] flex-shrink-0 overflow-y-auto py-2 pr-2">
                          <div className="space-y-1.5">
                            {(analysisData?.pieData || []).map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded flex-shrink-0"
                                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                  />
                                  <span className="text-[11px] text-foreground truncate leading-tight">{d.name}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {/* Date selector in bottom-right corner */}
                  <div className="absolute bottom-0 right-0 z-10">
                    <Select
                      value={pieMonthKey || `${analysisData?.selectedPieYear || new Date().getFullYear()}-${String(analysisData?.selectedPieMonth || new Date().getMonth() + 1).padStart(2, "0")}`}
                      onValueChange={(v) => setPieMonthKey(v)}
                    >
                      <SelectTrigger className="w-auto min-w-[80px] h-6 text-[10px] gap-1 pr-2 bg-background/80">
                        <SelectValue placeholder="选择月份" />
                      </SelectTrigger>
                      <SelectContent>
                        {(analysisData?.availableMonths || []).map((m) => (
                          <SelectItem key={`${m.year}-${String(m.month).padStart(2, "0")}`} value={`${m.year}-${String(m.month).padStart(2, "0")}`} className="text-xs">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bottom Left: Month-over-Month Comparison */}
              <div className="h-full flex flex-col p-3 border-r border-border">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h3 className="text-sm font-medium">
                    环比对比 ({analysisData?.selectedPieYear}-{String(analysisData?.selectedPieMonth).padStart(2, "0")} vs {analysisData?.prevYear}-{String(analysisData?.prevMonth).padStart(2, "0")})
                  </h3>
                  <Button
                    size="sm"
                    className="h-5 text-[10px] px-2"
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {planLoading ? "生成中..." : "智能规划"}
                  </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto relative">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="text-[11px]">
                        <TableHead className="w-16 h-7">类别</TableHead>
                        <TableHead className="w-18 text-right h-7">本月</TableHead>
                        <TableHead className="w-18 text-right h-7">上月</TableHead>
                        <TableHead className="w-18 text-right h-7">变化</TableHead>
                        <TableHead className="w-14 text-right h-7">幅度</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analysisData?.monthOverMonthData || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">
                            暂无对比数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        (analysisData?.monthOverMonthData || []).map((item, i) => (
                          <TableRow key={i} className="text-[11px]">
                            <TableCell className="py-1">{item.category}</TableCell>
                            <TableCell className="text-right font-mono py-1">￥{item.currentAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono py-1 text-muted-foreground">￥{item.prevAmount.toLocaleString()}</TableCell>
                            <TableCell className={`text-right font-mono py-1 ${item.delta > 0 ? "text-red-600" : item.delta < 0 ? "text-emerald-600" : ""}`}>
                              {item.delta > 0 ? "+" : ""}￥{item.delta.toLocaleString()}
                            </TableCell>
                            <TableCell className={`text-right py-1 ${item.deltaPercent > 0 ? "text-red-600" : item.deltaPercent < 0 ? "text-emerald-600" : ""}`}>
                              {item.deltaPercent > 0 ? "+" : ""}{item.deltaPercent}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {(analysisData?.monthOverMonthData || []).length > 0 && (
                        <TableRow className="text-xs font-medium border-t-2">
                          <TableCell className="py-1">合计</TableCell>
                          <TableCell className="text-right font-mono py-1">￥{((analysisData?.monthOverMonthData || []).reduce((s, d) => s + d.currentAmount, 0)).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono py-1 text-muted-foreground">￥{((analysisData?.monthOverMonthData || []).reduce((s, d) => s + d.prevAmount, 0)).toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono py-1 ${(analysisData?.totalDelta || 0) > 0 ? "text-red-600" : (analysisData?.totalDelta || 0) < 0 ? "text-emerald-600" : ""}`}>
                            {(analysisData?.totalDelta || 0) > 0 ? "+" : ""}￥{(analysisData?.totalDelta || 0).toLocaleString()}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Bottom Right: Category Summary */}
              <div className="h-full flex flex-col p-3">
                <h3 className="text-sm font-medium mb-2 flex-shrink-0">类别汇总</h3>
                <div className="flex-1 min-h-0 overflow-y-auto relative">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="text-[11px]">
                        <TableHead className="w-16 h-7">类别</TableHead>
                        <TableHead className="w-18 text-right h-7">总金额</TableHead>
                        <TableHead className="w-14 text-right h-7">笔数</TableHead>
                        <TableHead className="w-18 text-right h-7">平均</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analysisData?.categorySummaryData || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-4">
                            暂无数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        (analysisData?.categorySummaryData || []).map((item, i) => (
                          <TableRow key={i} className="text-[11px]">
                            <TableCell className="py-1">{item.category}</TableCell>
                            <TableCell className="text-right font-mono py-1">￥{item.total.toLocaleString()}</TableCell>
                            <TableCell className="text-right py-1">{item.count}</TableCell>
                            <TableCell className="text-right font-mono py-1">￥{item.average.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t bg-muted/30 flex-shrink-0 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <span className="text-muted-foreground">总收入:</span>
            <span className="font-mono font-medium text-emerald-600">{stats.totalIncome.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span className="text-muted-foreground">总支出:</span>
            <span className="font-mono font-medium text-red-600">{stats.totalExpense.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3 w-3" />
            <span className="text-muted-foreground">净资产:</span>
            <span className={`font-mono font-medium ${stats.netAssets >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {stats.netAssets.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-muted-foreground">
          共 {records.length} 条记录
        </div>
      </div>

      {/* Add Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>添加记录</DialogTitle>
            <DialogDescription>请填写记账信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">类型</Label>
              <div className="flex flex-wrap gap-1.5">
                {RECORD_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`px-3 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      formType === t
                        ? typeColorMap[t] || "bg-primary text-primary-foreground border-transparent"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">类别</Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormCategory(c)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      formCategory === c
                        ? categoryColorMap[c] || "bg-muted text-foreground font-medium"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">金额</Label>
              <Input
                type="number"
                placeholder="请输入金额"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="h-8 text-xs focus-visible:ring-0 focus-visible:border-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="relative grid grid-cols-3 border rounded-md bg-muted/30 py-1">
              {/* Unified center highlight bar across all three columns */}
              <div
                className="absolute left-[8%] right-[8%] z-10 pointer-events-none rounded border border-input bg-background/60"
                style={{ top: 4 + 20 + CENTER_IDX * ITEM_H, height: ITEM_H }}
              />
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">年</Label>
                <ScrollPicker items={yearOptions} value={formYear} onChange={setFormYear} suffix="年" />
              </div>
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">月</Label>
                <ScrollPicker items={monthOptions} value={formMonth} onChange={setFormMonth} suffix="月" />
              </div>
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">日</Label>
                <ScrollPicker items={getDayOptions()} value={formDay} onChange={setFormDay} suffix="日" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">备注</Label>
              <Input
                placeholder="选填备注信息"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="h-8 text-xs focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)} className="text-xs h-8">取消</Button>
            <Button size="sm" onClick={handleAddRecord} className="text-xs h-8">确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>编辑记录</DialogTitle>
            <DialogDescription>修改记账信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">类型</Label>
              <div className="flex flex-wrap gap-1.5">
                {RECORD_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`px-3 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      formType === t
                        ? typeColorMap[t] || "bg-primary text-primary-foreground border-transparent"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">类别</Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormCategory(c)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      formCategory === c
                        ? categoryColorMap[c] || "bg-muted text-foreground font-medium"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">金额</Label>
              <Input
                type="number"
                placeholder="请输入金额"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="h-8 text-xs focus-visible:ring-0 focus-visible:border-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="relative grid grid-cols-3 border rounded-md bg-muted/30 py-1">
              {/* Unified center highlight bar across all three columns */}
              <div
                className="absolute left-[8%] right-[8%] z-10 pointer-events-none rounded border border-input bg-background/60"
                style={{ top: 4 + 20 + CENTER_IDX * ITEM_H, height: ITEM_H }}
              />
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">年</Label>
                <ScrollPicker items={yearOptions} value={formYear} onChange={setFormYear} suffix="年" />
              </div>
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">月</Label>
                <ScrollPicker items={monthOptions} value={formMonth} onChange={setFormMonth} suffix="月" />
              </div>
              <div className="relative z-30 flex flex-col items-center">
                <Label className="text-[11px] text-muted-foreground/70 h-5 leading-5">日</Label>
                <ScrollPicker items={getDayOptions()} value={formDay} onChange={setFormDay} suffix="日" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">备注</Label>
              <Input
                placeholder="选填备注信息"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="h-8 text-xs focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowEditDialog(false); setSelectedRecord(null) }} className="text-xs h-8">取消</Button>
            <Button size="sm" onClick={handleEditRecord} className="text-xs h-8">保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!deleting) setShowDeleteDialog(open) }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除选中的 {selectedRecords.size} 条记录吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>取消</Button>
            <Button size="sm" className="text-xs h-8 bg-destructive hover:bg-destructive/90" onClick={handleDeleteSelected} disabled={deleting}>
              {deleting ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />删除中...</> : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>预算与预警设置</DialogTitle>
            <DialogDescription>设置月度预算和负债预警线</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">月度预算上限（元）</Label>
              <Input
                type="number"
                placeholder="0 表示不设置"
                value={formBudgetLimit}
                onChange={(e) => setFormBudgetLimit(e.target.value)}
                className="h-8 text-xs"
                min="0"
                step="100"
              />
              <p className="text-[10px] text-muted-foreground">当月支出超过此值时将显示预警提示</p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-xs">负债预警线（元）</Label>
              <Input
                type="number"
                placeholder="0 表示不设置"
                value={formDebtWarningLine}
                onChange={(e) => setFormDebtWarningLine(e.target.value)}
                className="h-8 text-xs"
                min="0"
                step="100"
              />
              <p className="text-[10px] text-muted-foreground">当负债净额超过此值时将显示预警提示</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(false)} className="text-xs h-8">取消</Button>
            <Button size="sm" onClick={handleSaveSettings} className="text-xs h-8">保存设置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>使用说明</DialogTitle>
          </DialogHeader>
          <div className="text-xs leading-relaxed text-muted-foreground space-y-2 max-h-80 overflow-y-auto">
            <p>本软件是一款智能记账工具，帮助您轻松管理个人财务。</p>
            <p>数据列表页面可以查看所有记账记录，点击添加记录按钮新增一条记录，双击记录行可以编辑已有记录，勾选记录后点击删除按钮可以批量删除记录。</p>
            <p>添加和编辑记录时需要填写类型、类别、金额和日期信息，其中类型包括收入、支出、负债增加和还款四种，类别包括工资、餐饮、购物、交通、娱乐、旅游、医疗、房租、教育、通讯、转账和其他十二种，日期通过年月日三个独立下拉菜单选择。</p>
            <p>数据分析页面提供四宫格布局，左上为近十二个月支出对比图表（支持柱状图、折线图、面积图、散点图四种样式切换），右上为当月支出构成图表（支持饼图、环形图、雷达图、条形图四种样式切换），左下为环比对比表和智能规划功能，右下为历史类别汇总统计。</p>
            <p>智能规划功能基于环比对比数据自动生成个性化支出建议，每个类别会给出建议金额、变化分析和具体可执行建议，所有计算在本地完成，无需联网即可使用。</p>
            <p>通过文件菜单可以导出所有记录为Excel文件，通过设置菜单可以设置月度预算上限和负债预警线，当支出超过预算或负债超过预警线时顶部会显示黄色提示条。</p>
            <p>底部状态栏实时显示总收入、总支出和净资产信息，所有数据使用SQLite数据库本地存储，完全离线可用。</p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowHelpDialog(false)} className="text-xs h-8">知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              智能支出规划方案
            </DialogTitle>
            <DialogDescription>基于环比对比数据智能生成的个性化建议</DialogDescription>
          </DialogHeader>
          <div className="py-1 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {planLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">正在生成规划方案...</span>
              </div>
            ) : planData ? (
              <div className="space-y-0">
                {/* Summary */}
                {planData.summary && (
                  <div className="px-1 py-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{planData.summary}</p>
                  </div>
                )}
                {/* Plan Items */}
                {planData.items.map((item, index) => (
                  <div key={index}>
                    {index > 0 || planData.summary ? <Separator className="my-0" /> : null}
                    <div className="px-1 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.amount && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-primary/10 text-primary">
                            {item.amount}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      )}
                      {item.suggestions.length > 0 && (
                        <ul className="space-y-1">
                          {item.suggestions.map((suggestion, si) => (
                            <li key={si} className="text-xs leading-relaxed flex items-start gap-1.5">
                              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
                {/* Overall Suggestion */}
                {planData.overallSuggestion && (
                  <>
                    <Separator className="my-0" />
                    <div className="px-1 py-3">
                      <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2">
                        <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">{planData.overallSuggestion}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowPlanDialog(false)} className="text-xs h-8">关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
