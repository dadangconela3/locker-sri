import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/employees/[id] - Get a single employee with their contracts and keys
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        contracts: {
          include: { locker: true },
          orderBy: { createdAt: 'desc' },
        },
        heldKeys: {
          include: { locker: true },
        },
      },
    })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Failed to fetch employee:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

// PATCH /api/employees/[id] - Update an employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nik, name, department, isActive, lockerId, contractSeq, startDate, endDate, lockerKeyId } = body
    
    // First, update the basic employee details
    const updateData: Record<string, string | boolean> = {}
    
    if (nik !== undefined) updateData.nik = nik
    if (name !== undefined) updateData.name = name
    if (department !== undefined) updateData.department = department
    if (isActive !== undefined) updateData.isActive = isActive
    
    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    })
    
    // Process locker, contract, and key updates using a transaction
    await prisma.$transaction(async (tx) => {
      // Find current active contract for this employee
      const currentContract = await tx.contract.findFirst({
        where: { employeeId: id, isActive: true },
        include: { locker: true },
      })
      
      const hasLockerChange = lockerId !== undefined && lockerId !== (currentContract?.lockerId || null)
      
      // Handle locker / contract changes
      if (hasLockerChange) {
        // 1. If there's an existing contract, deactivate it AND free up its locker
        if (currentContract) {
          await tx.contract.update({
            where: { id: currentContract.id },
            data: { isActive: false },
          })
          
          await tx.locker.update({
            where: { id: currentContract.lockerId },
            data: { status: 'AVAILABLE' },
          })
        }
        
        // 2. If a new locker is selected, create a new contract and mark locker as FILLED
        if (lockerId) {
          await tx.contract.create({
            data: {
              lockerId,
              employeeId: id,
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
      } else if (currentContract && (startDate !== undefined || endDate !== undefined || contractSeq !== undefined)) {
        // Only update dates/seq on the existing contract if no locker change
        const contractUpdate: Record<string, Date | number | null> = {}
        if (startDate) contractUpdate.startDate = new Date(startDate)
        if (endDate !== undefined) contractUpdate.endDate = endDate ? new Date(endDate) : null
        if (contractSeq) contractUpdate.contractSeq = contractSeq
        
        if (Object.keys(contractUpdate).length > 0) {
          await tx.contract.update({
            where: { id: currentContract.id },
            data: contractUpdate,
          })
        }
      }
      
      // Handle Key changes
      if (lockerKeyId !== undefined) {
        // Find current key held by this employee
        const currentKey = await tx.lockerKey.findFirst({
          where: { holderId: id },
        })
        
        const hasKeyChange = lockerKeyId !== (currentKey?.id || null)
        
        if (hasKeyChange) {
          // If employee had a key, return it
          if (currentKey) {
            await tx.lockerKey.update({
              where: { id: currentKey.id },
              data: { status: 'AVAILABLE', holderId: null },
            })
            
            // Log the return
            await tx.keyLog.create({
              data: {
                lockerId: currentKey.lockerId,
                lockerKeyId: currentKey.id,
                employeeId: id,
                action: 'RETURNED',
                method: 'MANUAL',
              }
            })
          }
          
          // If a new key is assigned, take it
          if (lockerKeyId) {
            const newKey = await tx.lockerKey.update({
              where: { id: lockerKeyId },
              data: { status: 'WITH_EMPLOYEE', holderId: id },
            })
            
            // Log the taking
            await tx.keyLog.create({
              data: {
                lockerId: newKey.lockerId,
                lockerKeyId: newKey.id,
                employeeId: id,
                action: 'TAKEN',
                method: 'MANUAL',
              }
            })
          }
        }
      }
    })
    
    // Log the update activity
    const logParts: string[] = []
    if (nik !== undefined || name !== undefined || department !== undefined) {
      logParts.push(`Data karyawan diupdate`)
    }
    if (lockerId !== undefined) {
      logParts.push(lockerId ? `Locker di-assign` : `Locker di-unassign`)
    }
    if (contractSeq !== undefined || startDate !== undefined || endDate !== undefined) {
      logParts.push(`Contract diupdate`)
    }
    if (lockerKeyId !== undefined) {
      logParts.push(lockerKeyId ? `Kunci di-assign` : `Kunci di-unassign`)
    }
    
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'EMPLOYEE',
        entityId: id,
        description: `${employee.nik} - ${employee.name}: ${logParts.join(', ') || 'Data diupdate'}`,
        details: JSON.stringify({ fields: Object.keys(body) }),
      }
    })
    
    return NextResponse.json(employee)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'NIK already exists' },
        { status: 400 }
      )
    }
    console.error('Failed to update employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Delete an employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get employee info before deleting for log
    const emp = await prisma.employee.findUnique({ where: { id } })
    
    await prisma.employee.delete({
      where: { id },
    })
    
    if (emp) {
      await prisma.activityLog.create({
        data: {
          action: 'DELETE',
          entity: 'EMPLOYEE',
          entityId: id,
          description: `Karyawan dihapus: ${emp.nik} - ${emp.name}`,
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
