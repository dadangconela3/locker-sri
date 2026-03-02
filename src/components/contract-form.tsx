'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Employee, Contract } from '@/types'
import { Loader2 } from 'lucide-react'
import { EmployeeSelect } from './tom-select-wrapper'
import { format, addDays, addMonths } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ContractFormProps {
  lockerId: string
  lockerNumber: string
  currentContractSeq: number
  currentEmployee?: Employee  // For contract extensions
  contracts?: Contract[]  // All contracts for history display
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ContractForm({ 
  lockerId, 
  lockerNumber, 
  currentContractSeq,
  currentEmployee,
  contracts = [],
  open, 
  onClose, 
  onSuccess 
}: ContractFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isPermanent, setIsPermanent] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: currentEmployee?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })
  
  // Calculate start date when modal opens based on latest contract
  useEffect(() => {
    if (open && currentEmployee && contracts?.length > 0) {
      let startDateString = new Date().toISOString().split('T')[0]
      
      const latestContract = contracts.reduce((prev, current) => 
        (prev.contractSeq > current.contractSeq) ? prev : current
      )
      
      if (latestContract.endDate) {
        // Safe date addition using date-fns to handle timezone offsets properly
        // This parses the DB's UTC ISO string into a local Date object and adds 1 day
        const localEndDate = new Date(latestContract.endDate)
        startDateString = format(addDays(localEndDate, 1), 'yyyy-MM-dd')
      }
      
      setFormData(prev => ({
        ...prev,
        employeeId: currentEmployee.id,
        startDate: startDateString
      }))
    }
  }, [open, currentEmployee, contracts])
  
  // Fetch employees only for new assignments (not extensions)
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/employees?withoutLocker=true')
        const data = await res.json()
        setEmployees(data)
      } catch (error) {
        console.error('Failed to fetch employees:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Only fetch employees if this is a new assignment (no currentEmployee)
    if (open && !currentEmployee) {
      fetchEmployees()
    }
  }, [open, currentEmployee])
  
  // Set default end date based on custom formula:
  // If start date is 1-15: (Start + 5 Months) - 1 Day
  // If start date is 16-31: (Start + 6 Months) - 1 Day
  useEffect(() => {
    if (formData.startDate) {
      // Split safely to avoid any UTC to local timezone shifting parsing bugs
      const [y, m, d] = formData.startDate.split('-').map(Number)
      const start = new Date(y, m - 1, d)
      
      const monthsToAdd = d <= 15 ? 5 : 6
      const endDateObj = addDays(addMonths(start, monthsToAdd), -1)
      
      setFormData(prev => ({ 
        ...prev, 
        endDate: format(endDateObj, 'yyyy-MM-dd')
      }))
    }
  }, [formData.startDate])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate overlapping dates
    if (contracts && contracts.length > 0) {
      const sortedContracts = [...contracts].sort((a,b) => a.contractSeq - b.contractSeq)
      const latestContract = sortedContracts[sortedContracts.length - 1]
      
      if (latestContract && latestContract.endDate) {
        if (new Date(formData.startDate) <= new Date(latestContract.endDate)) {
          alert('Error: Tanggal Mulai kontrak baru tidak boleh mendahului atau bersamaan dengan Tanggal Selesai kontrak sebelumnya.')
          return
        }
      }
    }
    
    // Validate that End Date is not before Start Date
    if (!isPermanent && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        alert('Error: Tanggal Akhir kontrak tidak boleh mendahului Tanggal Awal kontrak.')
        return
      }
    }
    
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockerId,
          employeeId: formData.employeeId,
          contractSeq: currentContractSeq + 1,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: isPermanent ? null : new Date(formData.endDate).toISOString(),
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to create contract')
      }
      
      onSuccess()
    } catch (error) {
      console.error('Failed to create contract:', error)
      alert('Failed to create contract. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentContractSeq > 0 ? 'Extend Contract' : 'Assign Locker'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contract History */}
          {contracts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Riwayat Contract</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {contracts
                  .sort((a, b) => a.contractSeq - b.contractSeq)
                  .map((c) => (
                    <div key={c.id} className={`px-3 py-2 text-sm flex items-center justify-between ${c.isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-xs">
                          Contract {c.contractSeq}
                        </Badge>
                        {c.isActive && <span className="text-xs text-blue-600 font-medium">Active</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(c.startDate), 'dd/MM/yyyy')} - {c.endDate ? format(new Date(c.endDate), 'dd/MM/yyyy') : 'Permanent'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Contract Ke-{currentContractSeq + 1} (Baru)
          </div>
          
          <div className="space-y-2">
            <Label>Locker</Label>
            <Input value={lockerNumber} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            {currentEmployee ? (
              // For contract extension: show readonly employee info
              <Input 
                value={`${currentEmployee.nik} - ${currentEmployee.name}`}
                disabled
                className="bg-gray-50"
              />
            ) : loading ? (
              // For new assignment: show loading state
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading employees...</span>
              </div>
            ) : (
              // For new assignment: show TomSelect
              <EmployeeSelect
                employees={employees}
                value={formData.employeeId}
                onChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                placeholder="Search employee by NIK, name, or department..."
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="isPermanent"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="isPermanent" className="text-sm font-normal cursor-pointer">
              Karyawan Tetap (tanpa batas waktu kontrak)
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                type="date" 
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            {!isPermanent && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  type="date" 
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !formData.employeeId || (!isPermanent && !formData.endDate)}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentContractSeq > 0 ? 'Extend Contract' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
