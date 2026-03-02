import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH /api/contracts/[id] - Update a contract (dates only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startDate, endDate } = body
    
    const updateData: any = {}
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    
    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
    })
    
    // Log the update
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'CONTRACT',
        entityId: id,
        description: `Kontrak diupdate tanggalnya (Start: ${startDate}, End: ${endDate || 'Permanent'})`,
      },
    })
    
    return NextResponse.json(contract)
  } catch (error) {
    console.error('Failed to update contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[id] - Delete a contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { employee: true }
    })
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.contract.delete({
        where: { id }
      })
      
      // If we deleted the active contract, we should probably set locker to AVAILABLE and employee active to false.
      if (contract.isActive) {
        await tx.locker.update({
           where: { id: contract.lockerId },
           data: { status: 'AVAILABLE' }
        })
        
        // Also check if employee has other active contracts? Probably not, 1 employee = 1 active locker at a time.
        await tx.employee.update({
           where: { id: contract.employeeId },
           data: { isActive: false }
        })
      }
    })
    
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'CONTRACT',
        entityId: id,
        description: `Menghapus data kontrak untuk karyawan ${contract.employee.name} (Seq: ${contract.contractSeq})`,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete contract:', error)
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    )
  }
}
