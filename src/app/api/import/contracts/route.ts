import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ImportRow {
  locker_number: string
  employee_nik: string
  start_date: string
  end_date?: string  // Optional: empty = permanent employee
  notes?: string
}

interface ImportError {
  row: number
  locker_number?: string
  employee_nik?: string
  error: string
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: ImportError[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body as { data: ImportRow[] }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }
    
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    }
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 for header and 0-index
      
      try {
        // Find locker by number
        const locker = await prisma.locker.findFirst({
          where: { lockerNumber: row.locker_number },
          include: {
            contracts: {
              where: { isActive: true }
            },
            keys: true  // Include keys for status update
          }
        })
        
        if (!locker) {
          result.errors.push({
            row: rowNumber,
            locker_number: row.locker_number,
            employee_nik: row.employee_nik,
            error: `Locker '${row.locker_number}' not found`
          })
          result.failed++
          continue
        }
        
        // Check if locker is available
        if (locker.status !== 'AVAILABLE') {
          result.errors.push({
            row: rowNumber,
            locker_number: row.locker_number,
            employee_nik: row.employee_nik,
            error: `Locker is ${locker.status}, not AVAILABLE`
          })
          result.failed++
          continue
        }
        
        // Check for active contract
        if (locker.contracts.length > 0) {
          result.errors.push({
            row: rowNumber,
            locker_number: row.locker_number,
            employee_nik: row.employee_nik,
            error: 'Locker already has an active contract'
          })
          result.failed++
          continue
        }
        
        // Find employee by NIK
        const employee = await prisma.employee.findUnique({
          where: { nik: row.employee_nik }
        })
        
        if (!employee) {
          result.errors.push({
            row: rowNumber,
            locker_number: row.locker_number,
            employee_nik: row.employee_nik,
            error: `Employee with NIK '${row.employee_nik}' not found`
          })
          result.failed++
          continue
        }
        
        // Get next contract sequence
        const existingContracts = await prisma.contract.findMany({
          where: { lockerId: locker.id },
          orderBy: { contractSeq: 'desc' },
          take: 1
        })
        
        const nextSeq = existingContracts.length > 0 
          ? existingContracts[0].contractSeq + 1 
          : 1
        
        // Determine if permanent or contract employee
        const isPermanent = !row.end_date
        
        // Create contract and update locker/keys in transaction
        await prisma.$transaction(async (tx) => {
          // Create contract
          await tx.contract.create({
            data: {
              lockerId: locker.id,
              employeeId: employee.id,
              contractSeq: nextSeq,
              startDate: new Date(row.start_date),
              endDate: isPermanent ? null : new Date(row.end_date!),
              isActive: true,
            }
          })
          
          // Update locker status
          await tx.locker.update({
            where: { id: locker.id },
            data: { status: 'FILLED' }
          })
          
          // Update all keys for this locker to WITH_EMPLOYEE and assign holder
          if (locker.keys.length > 0) {
            await tx.lockerKey.updateMany({
              where: { 
                lockerId: locker.id,
                status: 'AVAILABLE'
              },
              data: { 
                status: 'WITH_EMPLOYEE',
                holderId: employee.id
              }
            })
            
            // Create key log for first key (record key taken)
            const firstKey = locker.keys[0]
            await tx.keyLog.create({
              data: {
                lockerId: locker.id,
                lockerKeyId: firstKey.id,
                employeeId: employee.id,
                action: 'TAKEN',
                method: 'MANUAL',
              }
            })
          }
        })
        
        result.imported++
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        result.errors.push({
          row: rowNumber,
          locker_number: row.locker_number,
          employee_nik: row.employee_nik,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        result.failed++
      }
    }
    
    result.success = result.failed === 0
    
    return NextResponse.json(result, { status: result.success ? 200 : 207 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    )
  }
}
