'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseLockerCSV, LockerImportRow } from '@/lib/csv-parser'

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

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<LockerImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setImportResult(null)
    
    // Parse CSV
    const result = await parseLockerCSV(selectedFile)
    setParsedData(result.data)
    setParseErrors(result.errors)
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/locker-import-template.csv'
    link.download = 'locker-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/import/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData })
      })

      const result = await res.json()
      setImportResult(result)
      
      // Clear file if all successful
      if (result.success) {
        setFile(null)
        setParsedData([])
        setParseErrors([])
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const hasErrors = parseErrors.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Import Locker Assignments
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bulk import locker assignments from CSV file
              </p>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing locker assignments. Make sure it follows the template format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {parsedData.length} rows
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parse Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CSV Format Errors</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {parseErrors.map((error, idx) => (
                  <div key={idx} className="text-sm">
                    {error.row === 0 ? (
                      <span className="font-medium">{error.message}</span>
                    ) : (
                      <span>Row {error.row}: {error.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Data */}
        {parsedData.length > 0 && !hasErrors && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Data</CardTitle>
                  <CardDescription>
                    Review the data before importing
                  </CardDescription>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing || hasErrors}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {importing ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Locker Number</TableHead>
                      <TableHead>Employee NIK</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{idx + 2}</TableCell>
                        <TableCell className="font-medium">{row.locker_number}</TableCell>
                        <TableCell>{row.employee_nik}</TableCell>
                        <TableCell>
                          <Badge variant={row.end_date ? 'secondary' : 'default'} className={row.end_date ? '' : 'bg-emerald-100 text-emerald-700'}>
                            {row.end_date ? 'Kontrak' : 'Tetap'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.start_date}</TableCell>
                        <TableCell>{row.end_date || <span className="text-gray-400 italic">Permanent</span>}</TableCell>
                        <TableCell className="text-gray-500">{row.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Result */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-green-700 dark:text-green-300">Imported</div>
                  <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Errors:</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Locker</TableHead>
                          <TableHead>Employee NIK</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{error.row}</TableCell>
                            <TableCell>{error.locker_number || '-'}</TableCell>
                            <TableCell>{error.employee_nik || '-'}</TableCell>
                            <TableCell className="text-red-600">{error.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {importResult.success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    All {importResult.imported} locker assignments have been imported successfully.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <ol className="list-decimal list-inside space-y-2">
              <li>Download the CSV template using the button above</li>
              <li>Fill in your locker assignment data following the format</li>
              <li>For <strong>karyawan tetap</strong> (permanent): leave end_date empty</li>
              <li>For <strong>karyawan kontrak</strong>: fill in end_date (YYYY-MM-DD)</li>
              <li>Upload the completed CSV file</li>
              <li>Review the preview to ensure data is correct</li>
              <li>{`Click "Import Data" to process the assignments`}</li>
            </ol>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <p className="font-medium text-amber-800 dark:text-amber-200">Important Notes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-amber-700 dark:text-amber-300">
                <li>Lockers must exist in the system and be AVAILABLE</li>
                <li>Employees must exist (valid NIK)</li>
                <li>Dates must be in YYYY-MM-DD format</li>
                <li>Start date must be before end date (if provided)</li>
                <li>Key status will be automatically set to WITH_EMPLOYEE</li>
                <li>Empty end_date = permanent employee (no expiry)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
