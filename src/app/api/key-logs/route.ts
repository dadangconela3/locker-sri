import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/key-logs - List key logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lockerId = searchParams.get('lockerId')
    const employeeId = searchParams.get('employeeId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const keyLogs = await prisma.keyLog.findMany({
      where: {
        ...(lockerId && { lockerId }),
        ...(employeeId && { employeeId }),
      },
      include: {
        employee: true,
        locker: true,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    
    return NextResponse.json(keyLogs)
  } catch (error) {
    console.error('Failed to fetch key logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key logs' },
      { status: 500 }
    )
  }
}

// POST /api/key-logs - Record key action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lockerId, employeeId, action, method } = body
    
    if (!lockerId || !employeeId || !action || !method) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }
    
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the key log
      const keyLog = await tx.keyLog.create({
        data: {
          lockerId,
          employeeId,
          action,
          method,
        },
        include: {
          employee: true,
          locker: true,
        },
      })
      
      // If key is RETURNED, end the active contract and clear the locker
      if (action === 'RETURNED') {
        // Find and end the active contract for this locker
        const activeContract = await tx.contract.findFirst({
          where: {
            lockerId,
            isActive: true,
          },
        })
        
        if (activeContract) {
          // End the contract
          await tx.contract.update({
            where: { id: activeContract.id },
            data: { isActive: false },
          })
        }
        
        // Update locker status to AVAILABLE
        await tx.locker.update({
          where: { id: lockerId },
          data: { status: 'AVAILABLE' },
        })
      }
      
      return keyLog
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create key log:', error)
    return NextResponse.json(
      { error: 'Failed to create key log' },
      { status: 500 }
    )
  }
}
