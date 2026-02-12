import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/keys - List all keys with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lockerId = searchParams.get('lockerId')
    const status = searchParams.get('status')
    const holderId = searchParams.get('holderId')
    const roomId = searchParams.get('roomId')
    
    const where: any = {}
    
    if (lockerId) {
      where.lockerId = lockerId
    }
    
    if (status) {
      where.status = status
    }
    
    if (holderId) {
      where.holderId = holderId
    }
    
    if (roomId) {
      where.locker = { roomId }
    }
    
    const keys = await prisma.lockerKey.findMany({
      where,
      include: {
        locker: true,
        holder: true,
      },
      orderBy: [
        { locker: { lockerNumber: 'asc' } },
        { keyNumber: 'asc' },
      ],
    })
    
    return NextResponse.json(keys)
  } catch (error) {
    console.error('Failed to fetch keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch keys' },
      { status: 500 }
    )
  }
}

// POST /api/keys - Create a new key for a locker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lockerId, label, status } = body
    
    if (!lockerId) {
      return NextResponse.json(
        { error: 'lockerId is required' },
        { status: 400 }
      )
    }
    
    // Get the next key number for this locker
    const existingKeys = await prisma.lockerKey.findMany({
      where: { lockerId },
      orderBy: { keyNumber: 'desc' },
      take: 1,
    })
    
    const nextKeyNumber = existingKeys.length > 0 ? existingKeys[0].keyNumber + 1 : 1
    
    const key = await prisma.lockerKey.create({
      data: {
        lockerId,
        keyNumber: nextKeyNumber,
        label: label || null,
        status: status || 'AVAILABLE',
      },
      include: {
        locker: true,
        holder: true,
      },
    })
    
    return NextResponse.json(key, { status: 201 })
  } catch (error) {
    console.error('Failed to create key:', error)
    return NextResponse.json(
      { error: 'Failed to create key' },
      { status: 500 }
    )
  }
}
