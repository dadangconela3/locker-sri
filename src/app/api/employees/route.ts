import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    const employees = await prisma.employee.findMany({
      where: {
        ...(activeOnly && { isActive: true }),
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
            locker: {
              select: {
                lockerNumber: true,
                roomId: true,
              },
            },
          },
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
    const { nik, name, department } = body
    
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
    
    const employee = await prisma.employee.create({
      data: { nik, name, department },
    })
    
    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
