import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/qr-lookup?nik=XXX - Lookup employee by NIK for QR scanner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nik = searchParams.get('nik')
    
    if (!nik) {
      return NextResponse.json(
        { error: 'NIK is required' },
        { status: 400 }
      )
    }
    
    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { nik },
    })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    // Find active contract with locker
    const contract = await prisma.contract.findFirst({
      where: {
        employeeId: employee.id,
        isActive: true,
      },
      include: {
        locker: true,
      },
      orderBy: {
        contractSeq: 'desc',
      },
    })
    
    if (!contract) {
      return NextResponse.json(
        { error: 'No active locker assignment found' },
        { status: 404 }
      )
    }
    
    // Get latest key log to determine if key is taken
    const latestKeyLog = await prisma.keyLog.findFirst({
      where: {
        lockerId: contract.lockerId,
        employeeId: employee.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })
    
    const hasKey = latestKeyLog?.action === 'TAKEN'
    
    return NextResponse.json({
      employee: {
        id: employee.id,
        nik: employee.nik,
        name: employee.name,
        department: employee.department,
      },
      locker: {
        id: contract.locker.id,
        lockerNumber: contract.locker.lockerNumber,
        roomId: contract.locker.roomId,
        status: contract.locker.status,
      },
      contract: {
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        contractSeq: contract.contractSeq,
      },
      hasKey,
    })
  } catch (error) {
    console.error('Failed to lookup employee:', error)
    return NextResponse.json(
      { error: 'Failed to lookup employee' },
      { status: 500 }
    )
  }
}
