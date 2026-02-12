import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/employees/import - Import employees from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employees } = body
    
    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { error: 'No employee data provided' },
        { status: 400 }
      )
    }
    
    const results = {
      success: [] as any[],
      errors: [] as any[],
      duplicates: [] as any[]
    }
    
    // Validate and process each employee
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i]
      const rowNumber = i + 2 // +2 because row 1 is header, array is 0-indexed
      
      // Validation
      const errors: string[] = []
      
      if (!emp.nik || emp.nik.trim() === '') {
        errors.push('NIK is required')
      }
      
      if (!emp.name || emp.name.trim() === '') {
        errors.push('Name is required')
      }
      
      if (!emp.department || emp.department.trim() === '') {
        errors.push('Department is required')
      }
      
      // Check if isActive is valid (should be 'true', 'false', '1', '0', 'yes', 'no')
      let isActive = true
      if (emp.isActive !== undefined && emp.isActive !== null && emp.isActive !== '') {
        const activeStr = String(emp.isActive).toLowerCase().trim()
        if (['false', '0', 'no', 'inactive'].includes(activeStr)) {
          isActive = false
        } else if (!['true', '1', 'yes', 'active'].includes(activeStr)) {
          errors.push('isActive must be true/false, 1/0, yes/no, or active/inactive')
        }
      }
      
      if (errors.length > 0) {
        results.errors.push({
          row: rowNumber,
          nik: emp.nik,
          errors
        })
        continue
      }
      
      // Check for duplicate NIK in database
      const existing = await prisma.employee.findUnique({
        where: { nik: emp.nik.trim() }
      })
      
      if (existing) {
        results.duplicates.push({
          row: rowNumber,
          nik: emp.nik,
          name: emp.name,
          message: 'NIK already exists in database'
        })
        continue
      }
      
      // Create employee
      try {
        const created = await prisma.employee.create({
          data: {
            nik: emp.nik.trim(),
            name: emp.name.trim(),
            department: emp.department.trim(),
            isActive
          }
        })
        
        results.success.push({
          row: rowNumber,
          nik: created.nik,
          name: created.name
        })
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          nik: emp.nik,
          errors: [error.message || 'Failed to create employee']
        })
      }
    }
    
    return NextResponse.json({
      total: employees.length,
      imported: results.success.length,
      failed: results.errors.length,
      duplicates: results.duplicates.length,
      results
    })
    
  } catch (error) {
    console.error('Failed to import employees:', error)
    return NextResponse.json(
      { error: 'Failed to import employees' },
      { status: 500 }
    )
  }
}
