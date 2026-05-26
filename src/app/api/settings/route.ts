import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    let settings = await db.settings.findFirst()

    if (!settings) {
      settings = await db.settings.create({
        data: {
          budgetLimit: 0,
          debtWarningLine: 0,
        },
      })
    }

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { budgetLimit, debtWarningLine } = body

    let settings = await db.settings.findFirst()

    if (settings) {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          ...(budgetLimit !== undefined && { budgetLimit: parseFloat(budgetLimit) }),
          ...(debtWarningLine !== undefined && { debtWarningLine: parseFloat(debtWarningLine) }),
        },
      })
    } else {
      settings = await db.settings.create({
        data: {
          budgetLimit: budgetLimit !== undefined ? parseFloat(budgetLimit) : 0,
          debtWarningLine: debtWarningLine !== undefined ? parseFloat(debtWarningLine) : 0,
        },
      })
    }

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}
