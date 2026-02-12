'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { parseCSV, generateEmployeeCSVTemplate, downloadCSV } from '@/lib/csv-utils'

interface ImportResult {
  total: number
  imported: number
  failed: number
  duplicates: number
  results: {
    success: any[]
    errors: any[]
    duplicates: any[]
  }
}

interface EmployeeImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function EmployeeImportDialog({ 
  open, 
  onOpenChange,
  onImportComplete 
}: EmployeeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleDownloadTemplate = () => {
    const template = generateEmployeeCSVTemplate()
    downloadCSV(template, 'employee_import_template.csv')
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }
  
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }
    
    setImporting(true)
    setError(null)
    setResult(null)
    
    try {
      // Read file
      const text = await file.text()
      
      // Parse CSV
      const employees = parseCSV(text)
      
      if (employees.length === 0) {
        setError('CSV file contains no data rows')
        setImporting(false)
        return
      }
      
      // Send to API
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to import employees')
        setImporting(false)
        return
      }
      
      setResult(data)
      
      // If any employees were imported successfully, refresh the list
      if (data.imported > 0) {
        onImportComplete()
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to process CSV file')
    } finally {
      setImporting(false)
    }
  }
  
  const handleClose = () => {
    setFile(null)
    setError(null)
    setResult(null)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Employees from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple employees at once
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          
          {/* Instructions */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>How to Import</AlertTitle>
            <AlertDescription className="text-sm space-y-2 mt-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the CSV template below</li>
                <li>Fill in employee data (NIK, Name, Department, isActive)</li>
                <li>Save the file as CSV format</li>
                <li>Upload the file using the button below</li>
              </ol>
              <div className="mt-3 pt-2 border-t">
                <p className="font-medium mb-1">CSV Format:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li><strong>nik</strong>: Employee ID (required, must be unique)</li>
                  <li><strong>name</strong>: Employee name (required)</li>
                  <li><strong>department</strong>: Department name (required)</li>
                  <li><strong>isActive</strong>: true/false, 1/0, yes/no, or active/inactive (optional, default: true)</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Download Template */}
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
          
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-xs text-gray-500">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Result Display */}
          {result && (
            <div className="space-y-3">
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Import Complete</AlertTitle>
                <AlertDescription className="text-blue-800">
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Total rows: <strong>{result.total}</strong></div>
                    <div className="text-green-700">Imported: <strong>{result.imported}</strong></div>
                    <div className="text-red-700">Failed: <strong>{result.failed}</strong></div>
                    <div className="text-amber-700">Duplicates: <strong>{result.duplicates}</strong></div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {/* Success Details */}
              {result.results.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Successfully Imported ({result.results.success.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {result.results.success.map((item, i) => (
                      <div key={i} className="text-green-800">
                        Row {item.row}: {item.nik} - {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Duplicate Details */}
              {result.results.duplicates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Duplicates Skipped ({result.results.duplicates.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {result.results.duplicates.map((item, i) => (
                      <div key={i} className="text-amber-800">
                        Row {item.row}: {item.nik} - {item.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Error Details */}
              {result.results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Errors ({result.results.errors.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-2">
                    {result.results.errors.map((item, i) => (
                      <div key={i} className="text-red-800">
                        <div className="font-medium">Row {item.row}: {item.nik}</div>
                        <ul className="list-disc list-inside ml-2">
                          {item.errors.map((err: string, j: number) => (
                            <li key={j}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </>
              )}
            </Button>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  )
}
