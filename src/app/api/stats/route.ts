import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/stats - Get dashboard statistics
export async function GET() {
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
      unidentified: 0,
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
        case 'UNIDENTIFIED':
          result.unidentified = count
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
