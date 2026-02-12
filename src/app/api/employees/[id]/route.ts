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
    const { nik, name, department, isActive } = body
    
    const updateData: any = {}
    
    if (nik !== undefined) updateData.nik = nik
    if (name !== undefined) updateData.name = name
    if (department !== undefined) updateData.department = department
    if (isActive !== undefined) updateData.isActive = isActive
    
    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json(employee)
  } catch (error: any) {
    if (error.code === 'P2002') {
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
    
    await prisma.employee.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
