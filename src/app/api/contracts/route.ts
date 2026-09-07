import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isOverdue } from '@/lib/contract-utils'

// GET /api/contracts - List contracts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const overdueOnly = searchParams.get('overdueOnly') === 'true'
    const lockerId = searchParams.get('lockerId')
    
    let contracts
    
    if (overdueOnly) {
      // Get all active contracts and filter overdue ones
      const allContracts = await prisma.contract.findMany({
        where: {
          isActive: true,
          ...(lockerId && { lockerId }),
        },
        include: {
          employee: true,
          locker: true,
        },
        orderBy: { endDate: 'asc' },
      })
      
      // Permanent employees (null endDate) are never overdue
      contracts = allContracts.filter(c => c.endDate && isOverdue(new Date(c.endDate)))
    } else {
      contracts = await prisma.contract.findMany({
        where: {
          ...(lockerId && { lockerId }),
        },
        include: {
          employee: true,
          locker: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }
    
    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lockerId, employeeId, contractSeq, startDate, endDate } = body
    
    if (!lockerId || !employeeId || !startDate) {
      return NextResponse.json(
        { error: 'lockerId, employeeId, and startDate are required' },
        { status: 400 }
      )
    }
    
    // Deactivate previous active contracts for this locker and this employee
    await prisma.contract.updateMany({
      where: {
        OR: [
          { lockerId, isActive: true },
          { employeeId, isActive: true },
        ],
      },
      data: { isActive: false },
    })

    // Determine contract sequence based on this employee's contract history
    let seq = contractSeq
    if (!seq) {
      const lastContract = await prisma.contract.findFirst({
        where: { employeeId },
        orderBy: { contractSeq: 'desc' },
      })
      seq = lastContract ? lastContract.contractSeq + 1 : 1
    }
    
    // Create new contract
    const contract = await prisma.contract.create({
      data: {
        lockerId,
        employeeId,
        contractSeq: seq,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
      include: {
        employee: true,
        locker: true,
      },
    })
    
    // Update locker status based on contract dates
    // Permanent employees (no endDate) are always FILLED, never OVERDUE
    const isContractOverdue = endDate ? isOverdue(new Date(endDate)) : false
    await prisma.locker.update({
      where: { id: lockerId },
      data: { status: isContractOverdue ? 'OVERDUE' : 'FILLED' },
    })
    
    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
