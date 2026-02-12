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
import { Employee } from '@/types'
import { Loader2 } from 'lucide-react'
import { EmployeeSelect } from './tom-select-wrapper'

interface ContractFormProps {
  lockerId: string
  lockerNumber: string
  currentContractSeq: number
  currentEmployee?: Employee  // For contract extensions
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ContractForm({ 
  lockerId, 
  lockerNumber, 
  currentContractSeq,
  currentEmployee,
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
  
  // Fetch employees only for new assignments (not extensions)
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/employees')
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
  
  // Set default end date to 1 year from start
  useEffect(() => {
    if (formData.startDate) {
      const start = new Date(formData.startDate)
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)
      setFormData(prev => ({ 
        ...prev, 
        endDate: end.toISOString().split('T')[0] 
      }))
    }
  }, [formData.startDate])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
