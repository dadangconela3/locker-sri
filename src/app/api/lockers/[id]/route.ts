import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/lockers/[id] - Get single locker with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const locker = await prisma.locker.findUnique({
      where: { id },
      include: {
        contracts: {
          include: { employee: true },
          orderBy: { contractSeq: 'desc' },
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
    console.error('Failed to fetch locker:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locker' },
      { status: 500 }
    )
  }
}

// PATCH /api/lockers/[id] - Update locker status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body
    
    const locker = await prisma.locker.update({
      where: { id },
      data: { status },
    })
    
    return NextResponse.json(locker)
  } catch (error) {
    console.error('Failed to update locker:', error)
    return NextResponse.json(
      { error: 'Failed to update locker' },
      { status: 500 }
    )
  }
}
