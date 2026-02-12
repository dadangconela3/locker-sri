import Papa from 'papaparse'

export interface LockerImportRow {
  locker_number: string
  employee_nik: string
  start_date: string
  end_date?: string  // Optional: empty = permanent employee
  notes?: string
}

export interface ParseResult {
  data: LockerImportRow[]
  errors: Array<{
    row: number
    message: string
  }>
}

export function parseLockerCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const errors: Array<{ row: number; message: string }> = []
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        const data: LockerImportRow[] = []
        
        // Validate headers
        const requiredHeaders = ['locker_number', 'employee_nik', 'start_date']
        const headers = results.meta.fields || []
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingHeaders.length > 0) {
          errors.push({
            row: 0,
            message: `Missing required columns: ${missingHeaders.join(', ')}`
          })
          resolve({ data: [], errors })
          return
        }
        
        // Validate each row
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2 // +2 because: 1 for header, 1 for 0-index
          
          // Check required fields
          if (!row.locker_number?.trim()) {
            errors.push({ row: rowNumber, message: 'locker_number is required' })
            return
          }
          if (!row.employee_nik?.trim()) {
            errors.push({ row: rowNumber, message: 'employee_nik is required' })
            return
          }
          if (!row.start_date?.trim()) {
            errors.push({ row: rowNumber, message: 'start_date is required' })
            return
          }
          
          // Validate start_date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(row.start_date.trim())) {
            errors.push({ 
              row: rowNumber, 
              message: 'start_date must be in YYYY-MM-DD format' 
            })
            return
          }
          
          const startDate = new Date(row.start_date.trim())
          if (isNaN(startDate.getTime())) {
            errors.push({ row: rowNumber, message: 'start_date is not a valid date' })
            return
          }
          
          // Validate end_date only if provided (optional for permanent employees)
          const endDateStr = row.end_date?.trim() || ''
          if (endDateStr) {
            if (!dateRegex.test(endDateStr)) {
              errors.push({ 
                row: rowNumber, 
                message: 'end_date must be in YYYY-MM-DD format' 
              })
              return
            }
            
            const endDate = new Date(endDateStr)
            if (isNaN(endDate.getTime())) {
              errors.push({ row: rowNumber, message: 'end_date is not a valid date' })
              return
            }
            if (startDate >= endDate) {
              errors.push({ row: rowNumber, message: 'start_date must be before end_date' })
              return
            }
          }
          
          // Add valid row
          data.push({
            locker_number: row.locker_number.trim(),
            employee_nik: row.employee_nik.trim(),
            start_date: row.start_date.trim(),
            end_date: endDateStr || undefined,
            notes: row.notes?.trim() || undefined
          })
        })
        
        resolve({ data, errors })
      },
      error: (error) => {
        errors.push({ row: 0, message: `CSV parsing error: ${error.message}` })
        resolve({ data: [], errors })
      }
    })
  })
}
