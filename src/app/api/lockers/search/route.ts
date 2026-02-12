import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/lockers/search?lockerNumber=L/M01/054 - Search locker by exact number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lockerNumber = searchParams.get('lockerNumber')

    if (!lockerNumber) {
      return NextResponse.json(
        { error: 'lockerNumber parameter is required' },
        { status: 400 }
      )
    }

    const locker = await prisma.locker.findFirst({
      where: {
        lockerNumber: lockerNumber,
      },
      include: {
        contracts: {
          include: { employee: true },
          orderBy: { contractSeq: 'desc' },
        },
        keys: {
          include: { holder: true },
        },
        keyLogs: {
          include: { employee: true },
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    })

    if (!locker) {
      return NextResponse.json(
        { error: 'Locker not found' },
        { status: 404 }
      )
    }

    // Find current active contract
    const currentContract = locker.contracts.find(c => c.isActive)

    return NextResponse.json({
      ...locker,
      currentContract,
    })
  } catch (error) {
    console.error('Failed to search locker:', error)
    return NextResponse.json(
      { error: 'Failed to search locker' },
      { status: 500 }
    )
  }
}
