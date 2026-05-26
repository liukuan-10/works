"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Download } from "lucide-react"

interface Record {
  id: string
  type: "收入" | "支出" | "负债增加" | "还款"
  category: string
  amount: number
  note: string
  year: number
  month: number
  day: number
}

interface Stats {
  totalIncome: number
  totalExpense: number
  totalDebtIncrease: number
  totalRepayment: number
  netAssets: number
}

const TYPES = ["收入", "支出", "负债增加", "还款"]
const CATEGORIES = {
  "收入": ["工资", "奖金", "投资", "其他"],
  "支出": ["餐饮", "购物", "交通", "娱乐", "医疗", "房租", "教育", "通讯", "旅游", "其他"],
  "负债增加": ["信用卡", "借贷", "其他"],
  "还款": ["转账", "还款", "其他"],
}

export default function Home() {
  const { toast } = useToast()
  const [records, setRecords] = useState<Record[]>([])
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, totalDebtIncrease: 0, totalRepayment: 0, netAssets: 0 })
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Form states
  const [formType, setFormType] = useState("支出")
  const [formCategory, setFormCategory] = useState("餐饮")
  const [formAmount, setFormAmount] = useState("")
  const [formNote, setFormNote] = useState("")
  const now = new Date()
  const [formYear, setFormYear] = useState(now.getFullYear().toString())
  const [formMonth, setFormMonth] = useState((now.getMonth() + 1).toString())
  const [formDay, setFormDay] = useState(now.getDate().toString())

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [recordsRes, statsRes] = await Promise.all([
        fetch("/api/records"),
        fetch("/api/records/stats"),
      ])
      if (recordsRes.ok && statsRes.ok) {
        setRecords(await recordsRes.json())
        setStats(await statsRes.json())
      }
    } catch (error) {
      toast({ title: "加载失败", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddRecord = async () => {
    if (!formAmount) {
      toast({ title: "请输入金额", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          category: formCategory,
          amount: parseFloat(formAmount),
          note: formNote,
          year: parseInt(formYear),
          month: parseInt(formMonth),
          day: parseInt(formDay),
        }),
      })

      if (res.ok) {
        toast({ title: "记录已添加" })
        setFormAmount("")
        setFormNote("")
        setIsOpen(false)
        loadData()
      }
    } catch (error) {
      toast({ title: "添加失败", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/records?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "已删除" })
        loadData()
      }
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" })
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "accounting_records.xlsx"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      toast({ title: "导出失败", variant: "destructive" })
    }
  }

  const handleSeedData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      if (res.ok) {
        toast({ title: "示例数据已添加" })
        loadData()
      }
    } catch (error) {
      toast({ title: "添加示例数据失败", variant: "destructive" })
    }
  }

  const categoryOptions = CATEGORIES[formType as keyof typeof CATEGORIES] || []

  const getTypeColor = (type: string) => {
    switch (type) {
      case "收入":
        return "text-emerald-600"
      case "支出":
        return "text-red-600"
      case "负债增加":
        return "text-amber-600"
      case "还款":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">智能记账</h1>
          <p className="text-slate-600">管理您的收支，掌握财务动向</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 mb-1">总收入</div>
              <div className="text-2xl font-bold text-emerald-600">¥{stats.totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 mb-1">总支出</div>
              <div className="text-2xl font-bold text-red-600">¥{stats.totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 mb-1">负债增加</div>
              <div className="text-2xl font-bold text-amber-600">¥{stats.totalDebtIncrease.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 mb-1">还款金额</div>
              <div className="text-2xl font-bold text-blue-600">¥{stats.totalRepayment.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 mb-1">净资产</div>
              <div className="text-2xl font-bold text-primary">¥{stats.netAssets.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                新增记录
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>新增记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">类别</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">金额</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">备注</label>
                  <Input
                    placeholder="可选"
                    value={formNote}
                    onChange={e => setFormNote(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm font-medium">年</label>
                    <Select value={formYear} onValueChange={setFormYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => (now.getFullYear() - 5 + i).toString()).map(y => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">月</label>
                    <Select value={formMonth} onValueChange={setFormMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">日</label>
                    <Select value={formDay} onValueChange={setFormDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddRecord} className="w-full">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleSeedData}>
            加载示例
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download size={20} />
            导出
          </Button>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>记录列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-slate-500">加载中...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-slate-500">暂无记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">日期</th>
                      <th className="text-left py-3 px-4 font-medium">类型</th>
                      <th className="text-left py-3 px-4 font-medium">类别</th>
                      <th className="text-right py-3 px-4 font-medium">金额</th>
                      <th className="text-left py-3 px-4 font-medium">备注</th>
                      <th className="text-center py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(record => (
                      <tr key={record.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">{formatDate(record.year, record.month, record.day)}</td>
                        <td className={`py-3 px-4 font-medium ${getTypeColor(record.type)}`}>{record.type}</td>
                        <td className="py-3 px-4">{record.category}</td>
                        <td className="text-right py-3 px-4 font-medium">¥{record.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-600">{record.note}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
