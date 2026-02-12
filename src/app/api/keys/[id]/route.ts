import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/keys/[id] - Get a single key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const key = await prisma.lockerKey.findUnique({
      where: { id },
      include: {
        locker: true,
        holder: true,
        keyLogs: {
          include: {
            employee: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    })
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(key)
  } catch (error) {
    console.error('Failed to fetch key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key' },
      { status: 500 }
    )
  }
}

// PATCH /api/keys/[id] - Update a key (status, holder, label)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, holderId, label, physicalKeyNumber } = body
    
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (holderId !== undefined) {
      updateData.holderId = holderId || null
    }
    
    if (label !== undefined) {
      updateData.label = label
    }
    
    if (physicalKeyNumber !== undefined) {
      updateData.physicalKeyNumber = physicalKeyNumber || null
    }
    
    const key = await prisma.lockerKey.update({
      where: { id },
      data: updateData,
      include: {
        locker: true,
        holder: true,
      },
    })
    
    return NextResponse.json(key)
  } catch (error) {
    console.error('Failed to update key:', error)
    return NextResponse.json(
      { error: 'Failed to update key' },
      { status: 500 }
    )
  }
}

// DELETE /api/keys/[id] - Delete a key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.lockerKey.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete key:', error)
    return NextResponse.json(
      { error: 'Failed to delete key' },
      { status: 500 }
    )
  }
}
