import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (year) where.year = parseInt(year)
    if (month) where.month = parseInt(month)
    if (type) where.type = type
    if (category) where.category = category

    const records = await db.record.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/records error:', error)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, category, amount, note, year, month, day } = body

    if (!type || !category || amount === undefined || !year || !month || !day) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const record = await db.record.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        note: note || '',
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: '创建记录失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, category, amount, note, year, month, day } = body

    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    const record = await db.record.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(note !== undefined && { note }),
        ...(year && { year: parseInt(year) }),
        ...(month && { month: parseInt(month) }),
        ...(day && { day: parseInt(day) }),
      },
    })

    return NextResponse.json(record)
  } catch {
    return NextResponse.json({ error: '更新记录失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    try {
      await db.record.delete({
        where: { id },
      })
    } catch (deleteError: unknown) {
      // P2025: Record not found - treat as success (idempotent delete)
      const prismaError = deleteError as { code?: string }
      if (prismaError.code !== 'P2025') {
        throw deleteError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
