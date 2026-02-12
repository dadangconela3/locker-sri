/**
 * CSV Parser Utility
 * Parses CSV text into array of objects
 */

export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '')
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  if (headers.length === 0) {
    throw new Error('CSV header is empty')
  }
  
  // Parse data rows
  const data: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
    }
    
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index]
    })
    
    data.push(obj)
  }
  
  return data
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quotes
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last value
  values.push(current.trim())
  
  return values
}

/**
 * Generate CSV template for employee import
 */
export function generateEmployeeCSVTemplate(): string {
  const headers = ['nik', 'name', 'department', 'isActive']
  const examples = [
    ['EMP001', 'John Doe', 'Engineering', 'true'],
    ['EMP002', 'Jane Smith', 'Marketing', 'true'],
    ['EMP003', 'Bob Wilson', 'Finance', 'false']
  ]
  
  const rows = [
    headers.join(','),
    ...examples.map(row => row.join(','))
  ]
  
  return rows.join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
