import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Parse date string in multiple formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, M/D/YYYY
 */
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const s = dateStr.trim()
  
  // Try YYYY-MM-DD first
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`)
    return isNaN(d.getTime()) ? null : d
  }
  
  // Fallback: try native parsing
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

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
      success: [] as { row: number; nik: string; name: string }[],
      errors: [] as { row: number; nik: string; errors: string[] }[],
      duplicates: [] as { row: number; nik: string; name: string; message: string }[]
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
      
      // Check if isActive is valid
      let isActive = true
      if (emp.isActive !== undefined && emp.isActive !== null && emp.isActive !== '') {
        const activeStr = String(emp.isActive).toLowerCase().trim()
        if (['false', '0', 'no', 'inactive'].includes(activeStr)) {
          isActive = false
        } else if (!['true', '1', 'yes', 'active'].includes(activeStr)) {
          errors.push('isActive must be true/false, 1/0, yes/no, or active/inactive')
        }
      }
      
      // Parse optional locker-related fields
      const lockerNumber = emp.lockerNumber?.trim() || ''
      const contractSeqStr = emp.contractSeq?.trim() || ''
      const startDateStr = emp.startDate?.trim() || ''
      const endDateStr = emp.endDate?.trim() || ''
      const physicalKeyNumber = emp.physicalKeyNumber?.trim() || ''
      
      if (lockerNumber && !startDateStr) {
        errors.push('startDate is required when lockerNumber is provided')
      }
      
      // Validate dates if provided
      let parsedStartDate: Date | null = null
      let parsedEndDate: Date | null = null
      
      if (startDateStr) {
        parsedStartDate = parseFlexibleDate(startDateStr)
        if (!parsedStartDate) {
          errors.push(`startDate format not recognized: "${startDateStr}". Use DD/MM/YYYY or YYYY-MM-DD`)
        }
      }
      
      if (endDateStr) {
        parsedEndDate = parseFlexibleDate(endDateStr)
        if (!parsedEndDate) {
          errors.push(`endDate format not recognized: "${endDateStr}". Use DD/MM/YYYY or YYYY-MM-DD`)
        }
      }
      
      if (errors.length > 0) {
        results.errors.push({
          row: rowNumber,
          nik: emp.nik || '',
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
      
      // Create employee (and optionally contract + key assignment) in a transaction
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create employee
          const created = await tx.employee.create({
            data: {
              nik: emp.nik.trim(),
              name: emp.name.trim(),
              department: emp.department.trim(),
              isActive
            }
          })
          
          // 2. If locker is specified, find it and create contract
          if (lockerNumber) {
            const locker = await tx.locker.findUnique({
              where: { lockerNumber }
            })
            
            if (!locker) {
              throw new Error(`Locker ${lockerNumber} not found`)
            }
            
            const contractSeq = parseInt(contractSeqStr) || 1
            
            // Deactivate any existing active contracts for this locker
            await tx.contract.updateMany({
              where: { lockerId: locker.id, isActive: true },
              data: { isActive: false },
            })
            
            // Create contract
            await tx.contract.create({
              data: {
                lockerId: locker.id,
                employeeId: created.id,
                contractSeq,
                startDate: parsedStartDate!,
                endDate: parsedEndDate,
                isActive: true,
              },
            })
            
            // Update locker status
            await tx.locker.update({
              where: { id: locker.id },
              data: { status: 'FILLED' },
            })
            
            // 3. If physical key number is specified, find and assign key
            if (physicalKeyNumber) {
              const key = await tx.lockerKey.findFirst({
                where: { lockerId: locker.id, physicalKeyNumber }
              })
              
              if (key) {
                await tx.lockerKey.update({
                  where: { id: key.id },
                  data: { status: 'WITH_EMPLOYEE', holderId: created.id },
                })
                
                await tx.keyLog.create({
                  data: {
                    lockerId: locker.id,
                    lockerKeyId: key.id,
                    employeeId: created.id,
                    action: 'TAKEN',
                    method: 'MANUAL',
                  }
                })
              }
              // If key not found, silently skip (don't fail the whole row)
            }
          }
          
          results.success.push({
            row: rowNumber,
            nik: created.nik,
            name: created.name
          })
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create employee'
        results.errors.push({
          row: rowNumber,
          nik: emp.nik,
          errors: [message]
        })
      }
    }
    
    // Log import activity
    if (results.success.length > 0) {
      await prisma.activityLog.create({
        data: {
          action: 'IMPORT',
          entity: 'EMPLOYEE',
          description: `Import CSV: ${results.success.length} berhasil, ${results.errors.length} gagal, ${results.duplicates.length} duplikat`,
          details: JSON.stringify({
            total: employees.length,
            imported: results.success.length,
            failed: results.errors.length,
            duplicates: results.duplicates.length,
          }),
        }
      })
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
