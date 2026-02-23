import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const withoutLocker = searchParams.get('withoutLocker') === 'true'
    
    const employees = await prisma.employee.findMany({
      where: {
        ...(activeOnly && { isActive: true }),
        ...(withoutLocker && {
          contracts: {
            none: { isActive: true }
          }
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nik: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        contracts: {
          where: { isActive: true },
          include: {
            locker: true,
          },
        },
        heldKeys: {
          include: { locker: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nik, name, department, lockerId, contractSeq, startDate, endDate, lockerKeyId } = body
    
    if (!nik || !name || !department) {
      return NextResponse.json(
        { error: 'NIK, name, and department are required' },
        { status: 400 }
      )
    }
    
    // Check if NIK already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { nik },
    })
    
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this NIK already exists' },
        { status: 409 }
      )
    }
    
    const employee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: { nik, name, department },
      })
      
      // If locker is provided during creation, assign it
      if (lockerId) {
        await tx.contract.create({
          data: {
            lockerId,
            employeeId: created.id,
            contractSeq: contractSeq || 1,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            isActive: true,
          },
        })
        
        await tx.locker.update({
          where: { id: lockerId },
          data: { status: 'FILLED' },
        })
      }
      
      // If key is provided during creation, assign it
      if (lockerKeyId) {
        const newKey = await tx.lockerKey.update({
          where: { id: lockerKeyId },
          data: { status: 'WITH_EMPLOYEE', holderId: created.id },
        })
        
        await tx.keyLog.create({
          data: {
            lockerId: newKey.lockerId,
            lockerKeyId: newKey.id,
            employeeId: created.id,
            action: 'TAKEN',
            method: 'MANUAL',
          }
        })
      }
      
      return created
    })
    
    // Log the creation
    if (employee) {
      const logParts = [`Karyawan dibuat`]
      if (lockerId) logParts.push(`Locker di-assign`)
      if (lockerKeyId) logParts.push(`Kunci di-assign`)
      
      await prisma.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'EMPLOYEE',
          entityId: employee.id,
          description: `${nik} - ${name}: ${logParts.join(', ')}`,
        }
      })
    }
    
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
