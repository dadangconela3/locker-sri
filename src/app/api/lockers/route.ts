import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/lockers - List all lockers with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const status = searchParams.get('status')
    const withContracts = searchParams.get('withContracts') === 'true'
    
    const lockers = await prisma.locker.findMany({
      where: {
        ...(roomId && { roomId }),
        ...(status && { status: status as any }),
      },
      include: withContracts ? {
        contracts: {
          where: { isActive: true },
          include: { employee: true },
          orderBy: { contractSeq: 'desc' },
          take: 1,
        },
      } : undefined,
      orderBy: { lockerNumber: 'asc' },
    })
    
    return NextResponse.json(lockers)
  } catch (error) {
    console.error('Failed to fetch lockers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lockers' },
      { status: 500 }
    )
  }
}

// GET /api/lockers/stats - Get locker statistics
export async function HEAD(request: NextRequest) {
  try {
    const stats = await prisma.locker.groupBy({
      by: ['status'],
      _count: { status: true },
    })
    
    const result = {
      total: 0,
      available: 0,
      filled: 0,
      overdue: 0,
      maintenance: 0,
    }
    
    stats.forEach((s) => {
      const count = s._count.status
      result.total += count
      switch (s.status) {
        case 'AVAILABLE':
          result.available = count
          break
        case 'FILLED':
          result.filled = count
          break
        case 'OVERDUE':
          result.overdue = count
          break
        case 'MAINTENANCE':
          result.maintenance = count
          break
      }
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
