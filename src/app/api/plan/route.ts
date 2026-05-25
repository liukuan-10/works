import { NextRequest, NextResponse } from 'next/server'

interface ComparisonItem {
  category: string
  currentAmount: number
  prevAmount: number
  delta: number
  deltaPercent: number
}

interface PlanItem {
  title: string
  amount: string
  description: string
  suggestions: string[]
}

// Category-specific suggestions database
const CATEGORY_SUGGESTIONS: Record<string, {
  increase: string[]
  decrease: string[]
  stable: string[]
  high: string[]
}> = {
  "餐饮": {
    increase: ["减少外卖频次，尝试自己做饭", "制定每周菜单，避免冲动消费", "利用团购和优惠券降低餐饮成本"],
    decrease: ["保持当前餐饮消费水平", "可以适当提升饮食质量", "关注营养均衡，合理搭配荤素"],
    stable: ["维持当前餐饮支出水平", "尝试批量采购食材节约成本", "关注超市促销活动"],
    high: ["餐饮支出偏高，建议大幅削减", "设定每日餐费上限并严格执行", "减少高档餐厅消费频次"],
  },
  "购物": {
    increase: ["购物前制定清单，避免冲动消费", "设置购物冷静期，大件商品等3天再决定", "利用打折季集中采购必需品"],
    decrease: ["当前购物消费控制良好", "可将节省的额度用于必要投资", "继续保持理性消费习惯"],
    stable: ["保持理性购物习惯", "区分必需品和奢侈品", "定期清理闲置物品"],
    high: ["购物支出过高，需要严格管控", "卸载不常用购物APP减少诱惑", "每月设定购物预算上限"],
  },
  "交通": {
    increase: ["考虑办理月卡或季卡降低通勤成本", "短途出行选择步行或骑行", "拼车出行分摊交通费用"],
    decrease: ["交通费用控制得当", "可维持当前出行方式", "适当提升出行舒适度也合理"],
    stable: ["交通支出稳定", "合理规划出行路线减少绕路", "关注公共交通优惠活动"],
    high: ["交通支出偏高，建议优化出行方式", "优先选择公共交通出行", "减少不必要的打车消费"],
  },
  "娱乐": {
    increase: ["控制娱乐消费频次", "寻找免费或低成本娱乐方式", "设定每月娱乐预算上限"],
    decrease: ["娱乐消费控制良好", "适当放松有助于身心健康", "可保持当前娱乐支出水平"],
    stable: ["娱乐支出合理", "平衡工作与休闲时间", "选择性价比高的娱乐方式"],
    high: ["娱乐支出过高，需要精简", "减少高消费娱乐项目频次", "选择户外运动等低成本休闲方式"],
  },
  "旅游": {
    increase: ["提前规划行程享受早鸟优惠", "选择淡季出行降低费用", "合理规划旅游预算避免超支"],
    decrease: ["旅游支出有所减少", "可以利用空闲时间做周边短途游", "关注特价机票和酒店优惠"],
    stable: ["旅游支出稳定", "提前预订享受折扣", "合理选择住宿档次控制成本"],
    high: ["旅游支出偏高，需合理规划", "减少高消费长途旅行频次", "选择周边游替代远途旅行"],
  },
  "医疗": {
    increase: ["关注医疗保险报销政策", "定期体检避免大额医疗支出", "选择医保定点医院就诊"],
    decrease: ["医疗支出有所减少", "保持良好生活习惯预防疾病", "适当储备常用药品"],
    stable: ["医疗支出稳定", "坚持定期体检早预防", "注意日常健康管理"],
    high: ["医疗支出较高，注意医保报销", "关注慢病管理减少急性发作", "选择性价比高的医疗服务"],
  },
  "房租": {
    increase: ["房租上涨较快，可考虑续约谈判", "评估是否需要换租性价比更高的房源", "合租分摊降低居住成本"],
    decrease: ["房租稳定或已优化", "保持当前居住安排", "注意续约时的租金变化"],
    stable: ["房租支出稳定", "关注租房市场行情", "按时缴纳避免滞纳金"],
    high: ["房租占比过高，考虑调整居住方案", "寻找租金更低的替代房源", "考虑合租或搬到郊区降低成本"],
  },
  "教育": {
    increase: ["评估教育投入的回报率", "寻找免费或优惠的学习资源", "优先投资核心技能提升"],
    decrease: ["教育支出有所减少", "可以利用免费在线课程补充学习", "关注职业技能提升的性价比"],
    stable: ["教育投资值得坚持", "合理安排学习计划", "选择性价比高的培训课程"],
    high: ["教育支出偏高，需优化选择", "对比不同机构的价格和质量", "优先选择自学或线上课程"],
  },
  "通讯": {
    increase: ["对比不同运营商套餐选择最优方案", "检查是否有不必要附加服务可取消", "利用家庭套餐或集团套餐优惠"],
    decrease: ["通讯费用控制得当", "当前套餐较为合理", "可维持现有方案"],
    stable: ["通讯支出稳定", "定期检查套餐使用情况", "关注运营商优惠活动"],
    high: ["通讯支出偏高，建议更换套餐", "减少不必要的增值服务", "选择适合实际用量的套餐方案"],
  },
  "转账": {
    increase: ["梳理转账用途，减少非必要转账", "设定每月转账预算", "区分必要和非必要转账"],
    decrease: ["转账支出有所减少", "继续保持审慎的转账习惯", "记录每笔转账用途"],
    stable: ["转账支出稳定", "定期检查转账记录", "确保每笔转账都有明确用途"],
    high: ["转账支出偏高，需要审查用途", "减少非必要的转账支出", "设定转账额度提醒"],
  },
  "工资": {
    increase: [], stable: [], decrease: [], high: [],
  },
  "其他": {
    increase: ["细化其他支出分类，便于管理", "审查非必要支出项目", "设定杂项支出预算"],
    decrease: ["其他支出控制良好", "继续保持", "定期审视支出明细"],
    stable: ["其他支出稳定", "定期归类整理支出", "避免隐性消费累积"],
    high: ["其他支出偏高，需要逐项审查", "将大额其他支出归入具体类别", "削减不必要的杂项开支"],
  },
}

// Risk level thresholds
const HIGH_SPENDING_RATIO = 0.25 // category takes >25% of total = high
const SHARP_INCREASE = 0.3       // increase >30% = sharp
const SHARP_DECREASE = -0.3      // decrease >30% = sharp

function generateLocalPlan(comparisonData: ComparisonItem[], budgetLimit: number) {
  const totalCurrent = comparisonData.reduce((s, d) => s + d.currentAmount, 0)
  const totalPrev = comparisonData.reduce((s, d) => s + d.prevAmount, 0)
  const totalDelta = totalCurrent - totalPrev
  const totalDeltaPercent = totalPrev > 0 ? Math.round((totalDelta / totalPrev) * 100) : 0

  // Filter out categories with 0 in both months
  const activeCategories = comparisonData.filter(d => d.currentAmount > 0 || d.prevAmount > 0)

  // Sort by delta amount descending (biggest increase first for attention)
  const sortedByDelta = [...activeCategories].sort((a, b) => b.delta - a.delta)

  // Generate summary
  let summary = ""
  if (totalDelta > 0) {
    const increaseCategories = activeCategories.filter(d => d.delta > 0)
    summary = `本月总支出￥${totalCurrent.toLocaleString()}，较上月增加￥${totalDelta.toLocaleString()}（${totalDeltaPercent >= 0 ? '+' : ''}${totalDeltaPercent}%）。`
    if (increaseCategories.length > 0) {
      const topIncrease = increaseCategories.sort((a, b) => b.delta - a.delta)[0]
      summary += `其中${topIncrease.category}增幅最大，增加￥${topIncrease.delta.toLocaleString()}。`
    }
    if (budgetLimit > 0 && totalCurrent > budgetLimit) {
      summary += `当前支出已超过预算上限￥${budgetLimit.toLocaleString()}，需重点管控。`
    }
  } else if (totalDelta < 0) {
    const decreaseCategories = activeCategories.filter(d => d.delta < 0)
    summary = `本月总支出￥${totalCurrent.toLocaleString()}，较上月减少￥${Math.abs(totalDelta).toLocaleString()}（${totalDeltaPercent}%），消费有所节制。`
    if (decreaseCategories.length > 0) {
      summary += `${decreaseCategories.length}个类别支出下降，继续保持良好习惯。`
    }
  } else {
    summary = `本月总支出￥${totalCurrent.toLocaleString()}，与上月持平，消费结构稳定。`
  }

  // Generate plan items for each active category
  const items: PlanItem[] = sortedByDelta.map(d => {
    const categoryRatio = totalCurrent > 0 ? d.currentAmount / totalCurrent : 0
    const isHigh = categoryRatio > HIGH_SPENDING_RATIO
    const isSharpIncrease = d.deltaPercent > SHARP_INCREASE * 100
    const isSharpDecrease = d.deltaPercent < SHARP_DECREASE * 100

    // Determine trend type
    let trendType: "increase" | "decrease" | "stable" | "high"
    if (isHigh && d.delta >= 0) {
      trendType = "high"
    } else if (d.delta > 0) {
      trendType = "increase"
    } else if (d.delta < 0) {
      trendType = "decrease"
    } else {
      trendType = "stable"
    }

    // Calculate suggested amount
    let suggestedAmount: number
    if (d.delta > 0 && isSharpIncrease) {
      // Sharp increase: suggest reducing to between previous and current
      suggestedAmount = Math.round((d.prevAmount + d.currentAmount) / 2 / 50) * 50
    } else if (d.delta > 0) {
      // Moderate increase: suggest slightly above previous
      suggestedAmount = Math.round((d.prevAmount * 1.05) / 50) * 50
    } else if (d.delta < 0 && isSharpDecrease) {
      // Sharp decrease: maintain current level
      suggestedAmount = Math.round(d.currentAmount / 50) * 50
    } else {
      // Stable or slight decrease: maintain current level
      suggestedAmount = Math.round(d.currentAmount / 50) * 50
    }
    suggestedAmount = Math.max(suggestedAmount, 0)

    // If budget is exceeded, reduce suggested amounts proportionally
    if (budgetLimit > 0 && totalCurrent > budgetLimit) {
      const ratio = budgetLimit / totalCurrent
      suggestedAmount = Math.round(d.currentAmount * ratio / 50) * 50
    }

    // Build description
    let description = ""
    if (d.delta > 0) {
      description = `较上月增加￥${d.delta.toLocaleString()}（${d.deltaPercent >= 0 ? '+' : ''}${d.deltaPercent}%），${isSharpIncrease ? "增幅较大需重点关注" : "增幅温和"}`
    } else if (d.delta < 0) {
      description = `较上月减少￥${Math.abs(d.delta).toLocaleString()}（${d.deltaPercent}%），${isSharpDecrease ? "降幅明显" : "降幅温和"}`
    } else {
      description = "与上月持平"
    }

    if (isHigh) {
      description += `，占总支出${Math.round(categoryRatio * 100)}%，占比偏高`
    }

    // Build amount string
    const amountStr = d.currentAmount > 0
      ? `建议控制在￥${suggestedAmount.toLocaleString()}`
      : ""

    // Get suggestions
    const suggestionDB = CATEGORY_SUGGESTIONS[d.category] || CATEGORY_SUGGESTIONS["其他"]
    let suggestions: string[]

    if (trendType === "high") {
      suggestions = [...suggestionDB.high]
    } else {
      suggestions = [...suggestionDB[trendType]]
    }

    // Add budget-specific suggestion if applicable
    if (budgetLimit > 0 && totalCurrent > budgetLimit && d.delta > 0) {
      suggestions.push(`按预算比例，该类别建议额度约￥${suggestedAmount.toLocaleString()}`)
    }

    // Limit to 3 suggestions
    suggestions = suggestions.slice(0, 3)

    return {
      title: d.category,
      amount: amountStr,
      description,
      suggestions,
    }
  })

  // Generate overall suggestion
  let overallSuggestion = ""
  if (totalDelta > 0 && budgetLimit > 0 && totalCurrent > budgetLimit) {
    overallSuggestion = `支出已超预算，建议下月重点管控${sortedByDelta.filter(d => d.delta > 0).map(d => d.category).slice(0, 2).join("、")}等增长类别，争取将总支出控制在￥${budgetLimit.toLocaleString()}以内。`
  } else if (totalDelta > 0) {
    const topCategories = sortedByDelta.filter(d => d.delta > 0).slice(0, 2).map(d => d.category)
    overallSuggestion = `下月重点关注${topCategories.join("、")}的支出增长趋势，合理规划各项开支，保持健康的消费习惯。`
  } else if (totalDelta < 0) {
    overallSuggestion = "本月消费控制良好，继续保持节约习惯，可适当奖励自己，但注意不要反弹。"
  } else {
    overallSuggestion = "消费结构稳定，建议定期审视各项支出，确保资金分配合理。"
  }

  return { summary, items, overallSuggestion }
}

export async function POST(request: NextRequest) {
  try {
    const { comparisonData, budgetLimit } = await request.json()

    if (!comparisonData || !Array.isArray(comparisonData) || comparisonData.length === 0) {
      return NextResponse.json({ error: '缺少对比数据' }, { status: 400 })
    }

    const planData = generateLocalPlan(comparisonData, budgetLimit || 0)

    return NextResponse.json({ plan: planData })
  } catch {
    return NextResponse.json({ error: '生成规划方案失败' }, { status: 500 })
  }
}
