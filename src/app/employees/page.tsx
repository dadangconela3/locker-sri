'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Users,
  UserCheck,
  UserX,
  Upload,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ClipboardList,
  AlertTriangle,
  KeyRound,
  Calendar
} from 'lucide-react'
import { Employee, Locker, LockerKey, Contract } from '@/types'
import { EmployeeImportDialog } from '@/components/employee-import-dialog'
import { LockerSelect, TomSelectWrapper } from '@/components/tom-select-wrapper'
import { ContractForm } from '@/components/contract-form'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterNoLocker, setFilterNoLocker] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: 'nik' | 'name' | 'department' | 'locker';
    direction: 'asc' | 'desc';
  }>({ key: 'locker', direction: 'asc' }) // Default sort by locker
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    department: '',
    isActive: true,
    lockerId: '',
    contractSeq: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isPermanent: false,
    lockerKeyId: '',
  })
  
  const [availableLockers, setAvailableLockers] = useState<Locker[]>([])
  const [availableKeys, setAvailableKeys] = useState<LockerKey[]>([])
  
  // Fetch available lockers
  useEffect(() => {
    fetch('/api/lockers?status=AVAILABLE')
      .then(res => res.json())
      .then(data => setAvailableLockers(data))
      .catch(console.error)
  }, [])

  // Fetch keys when locker changes
  useEffect(() => {
    if (formData.lockerId) {
      fetch(`/api/keys?lockerId=${formData.lockerId}`)
        .then(res => res.json())
        .then((data: LockerKey[]) => {
          // Show available keys and the key currently held by this employee
          const validKeys = data.filter(k => k.status === 'AVAILABLE' || k.holderId === editingEmployee?.id);
          setAvailableKeys(validKeys);
        })
        .catch(console.error)
    } else {
      setAvailableKeys([])
    }
  }, [formData.lockerId, editingEmployee?.id])
  const [saving, setSaving] = useState(false)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [showExtendContract, setShowExtendContract] = useState(false)
  const [extendContractData, setExtendContractData] = useState<{
    lockerId: string
    lockerNumber: string
    currentContractSeq: number
    currentEmployee: Employee
    contracts: Contract[]
  } | null>(null)
  
  // Custom sort function for locker numbers
  // Order: M01 -> M02 -> F01 -> Others -> Empty
  const getLockerSortValue = (lockerNumber?: string) => {
    if (!lockerNumber) return 'ZZZZZ' // Put empty at the end
    if (lockerNumber.startsWith('M01')) return '1-' + lockerNumber
    if (lockerNumber.startsWith('M02')) return '2-' + lockerNumber
    if (lockerNumber.startsWith('F01')) return '3-' + lockerNumber
    return '4-' + lockerNumber
  }

  const sortedAndFilteredEmployees = employees
    .filter(employee => {
      if (filterNoLocker) {
        const hasLocker = employee.contracts?.some(c => c.isActive && c.locker)
        return employee.isActive && !hasLocker
      }
      return true
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig
      let valA: string = ''
      let valB: string = ''

      if (key === 'locker') {
        const lockerA = a.contracts?.find(c => c.isActive)?.locker?.lockerNumber
        const lockerB = b.contracts?.find(c => c.isActive)?.locker?.lockerNumber
        valA = getLockerSortValue(lockerA)
        valB = getLockerSortValue(lockerB)
      } else {
        valA = (a[key] as string || '').toLowerCase()
        valB = (b[key] as string || '').toLowerCase()
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1
      if (valA > valB) return direction === 'asc' ? 1 : -1
      return 0
    })

  const requestSort = (key: 'nik' | 'name' | 'department' | 'locker') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-black dark:text-white" />
      : <ArrowDown className="w-3 h-3 ml-1 text-black dark:text-white" />
  }

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/employees?${params}`)
      const data = await res.json()
      // Ensure we always have an array
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [search])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchEmployees])
  
  // Fetch activity logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/activity-logs?entity=EMPLOYEE&limit=30')
      const data = await res.json()
      setActivityLogs(data)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }, [])
  
  useEffect(() => {
    if (showLogs) fetchLogs()
  }, [showLogs, fetchLogs])
  
  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      const currentContract = employee.contracts?.find(c => c.isActive)
      const currentKey = employee.heldKeys?.[0]
      
      setFormData({
        nik: employee.nik,
        name: employee.name,
        department: employee.department,
        isActive: employee.isActive,
        lockerId: currentContract?.lockerId || '',
        contractSeq: currentContract?.contractSeq || 1,
        startDate: currentContract?.startDate ? new Date(currentContract.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: currentContract?.endDate ? new Date(currentContract.endDate).toISOString().split('T')[0] : '',
        isPermanent: currentContract ? !currentContract.endDate : false,
        lockerKeyId: currentKey?.id || '',
      })
      
      // If employee already has a locker, we need to add it to availableLockers if it's not there
      if (currentContract?.locker) {
        setAvailableLockers(prev => {
          if (!prev.find(l => l.id === currentContract.lockerId)) {
            return [...prev, currentContract.locker as unknown as Locker]
          }
          return prev
        })
      }
      
    } else {
      setEditingEmployee(null)
      setFormData({
        nik: '',
        name: '',
        department: '',
        isActive: true,
        lockerId: '',
        contractSeq: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isPermanent: false,
        lockerKeyId: '',
      })
    }
    setDialogOpen(true)
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingEmployee 
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees'
      
      const method = editingEmployee ? 'PATCH' : 'POST'
      
      const payload: Record<string, string | number | boolean | null> = { ...formData }
      // If permanent, remove endDate
      if (payload.isPermanent) {
        payload.endDate = null
      }
      // Only send locker details if lockerId is selected
      if (!payload.lockerId) {
        delete payload.contractSeq
        delete payload.startDate
        delete payload.endDate
        delete payload.lockerKeyId
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to save')
        return
      }
      
      setDialogOpen(false)
      fetchEmployees()
      if (showLogs) fetchLogs()
    } catch (error) {
      console.error('Failed to save employee:', error)
      alert('Failed to save employee')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      fetchEmployees()
      if (showLogs) fetchLogs()
    } catch (error) {
      console.error('Failed to delete employee:', error)
      alert('Failed to delete employee')
    }
  }
  
  const handleToggleActive = (employee: Employee) => {
    if (employee.isActive) {
      // Deactivating: show confirmation dialog
      setDeactivatingEmployee(employee)
      setDeactivateDialogOpen(true)
    } else {
      // Activating: simple toggle
      handleActivate(employee)
    }
  }

  const handleActivate = async (employee: Employee) => {
    try {
      await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      fetchEmployees()
    } catch (error) {
      console.error('Failed to activate employee:', error)
    }
  }

  const handleDeactivate = async (keyReturned: boolean) => {
    if (!deactivatingEmployee) return
    setDeactivating(true)
    try {
      await fetch(`/api/employees/${deactivatingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false, keyReturned }),
      })
      fetchEmployees()
      setDeactivateDialogOpen(false)
      setDeactivatingEmployee(null)
    } catch (error) {
      console.error('Failed to deactivate employee:', error)
      alert('Gagal menonaktifkan karyawan')
    } finally {
      setDeactivating(false)
    }
  }
  
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.isActive).length,
    inactive: employees.filter(e => !e.isActive).length,
  }

  const handleExportCSV = () => {
    const headers = ['NIK', 'Nama Karyawan', 'Departemen', 'No. Locker', 'Contract Ke-', 'Start Date', 'End Date', 'Status', 'Kode Kunci Locker']
    
    const rows = sortedAndFilteredEmployees.map(emp => {
      const contract = emp.contracts?.find(c => c.isActive)
      const key = emp.heldKeys?.[0]
      
      const formatDate = (d: Date | string | null | undefined) => {
        if (!d) return ''
        const date = new Date(d)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
      
      return [
        emp.nik,
        emp.name,
        emp.department,
        contract?.locker?.lockerNumber || '',
        contract?.contractSeq?.toString() || '',
        formatDate(contract?.startDate),
        contract?.endDate ? formatDate(contract.endDate) : 'Permanent',
        emp.isActive ? 'Active' : 'Inactive',
        key?.physicalKeyNumber || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                  Employee Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Manage employee data
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(true)}
                className="h-8 sm:h-9"
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Log Aktivitas</span>
                <span className="sm:hidden">Log</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 sm:h-9"
                disabled={employees.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="h-8 sm:h-9"
              >
                <Upload className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => handleOpenDialog()}
                className="h-8 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-gray-50 dark:bg-gray-800 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs sm:text-sm text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs sm:text-sm text-emerald-600">Active</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs sm:text-sm text-red-600">Inactive</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by NIK or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterNoLocker ? "default" : "outline"}
            onClick={() => setFilterNoLocker(!filterNoLocker)}
            className={`gap-2 ${filterNoLocker ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Active No Locker</span>
            <span className="sm:hidden">No Locker</span>
            {filterNoLocker && (
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white hover:bg-white/30 border-0">
                {sortedAndFilteredEmployees.length}
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => requestSort('nik')}
                    >
                      <div className="flex items-center">
                        NIK 
                        <SortIcon column="nik" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => requestSort('department')}
                    >
                      <div className="flex items-center">
                        Department
                        <SortIcon column="department" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => requestSort('locker')}
                    >
                      <div className="flex items-center">
                        Locker
                        <SortIcon column="locker" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-mono text-sm">{employee.nik}</TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-gray-500">
                          {employee.department}
                        </TableCell>
                        <TableCell>
                          {employee.contracts?.find(c => c.isActive)?.locker?.lockerNumber ? (
                            <Link href={`/?room=${employee.contracts.find(c => c.isActive)?.locker?.roomId}`}>
                              <Badge variant="secondary" className="font-mono hover:bg-gray-200 cursor-pointer">
                                {employee.contracts.find(c => c.isActive)?.locker?.lockerNumber}
                              </Badge>
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={employee.isActive 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(employee)}
                              title={employee.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {employee.isActive ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(employee)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Log Dialog moved to bottom of file */}
      </main>
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee information' : 'Add a new employee to the system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="e.g., EMP001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering"
              />
            </div>
            
            <div className="space-y-2">
              <Label>No. Locker</Label>
              <LockerSelect 
                lockers={availableLockers}
                value={formData.lockerId}
                onChange={(val) => setFormData(prev => ({ ...prev, lockerId: val, lockerKeyId: '' }))}
                placeholder="Select an available locker..."
              />
            </div>
            
            {formData.lockerId && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contract Ke-</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.contractSeq}
                      onChange={(e) => setFormData({ ...formData, contractSeq: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPermanent"
                        checked={formData.isPermanent}
                        onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isPermanent">Karyawan Tetap</Label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={formData.isPermanent}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Kode Kunci Locker</Label>
                  <TomSelectWrapper
                    options={availableKeys.map(k => ({
                      value: k.id,
                      text: k.physicalKeyNumber ? `${k.physicalKeyNumber} (Key #${k.keyNumber})` : `Key #${k.keyNumber}`,
                    }))}
                    value={formData.lockerKeyId}
                    onChange={(val) => setFormData(prev => ({ ...prev, lockerKeyId: val }))}
                    placeholder="Select key to assign..."
                  />
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            
            {editingEmployee && formData.lockerId && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/employees/${editingEmployee.id}`)
                    const fullEmployee = await res.json()
                    const activeContract = fullEmployee.contracts?.find((c: Contract) => c.isActive)
                    if (activeContract) {
                      setExtendContractData({
                        lockerId: activeContract.lockerId,
                        lockerNumber: activeContract.locker?.lockerNumber || '',
                        currentContractSeq: Math.max(...fullEmployee.contracts.map((c: Contract) => c.contractSeq)),
                        currentEmployee: editingEmployee,
                        contracts: fullEmployee.contracts || [],
                      })
                      setShowExtendContract(true)
                    } else {
                      alert('Karyawan tidak memiliki kontrak aktif untuk diperpanjang.')
                    }
                  } catch (error) {
                    console.error('Failed to fetch employee details:', error)
                    alert('Gagal memuat data kontrak karyawan.')
                  }
                }}
              >
                <Calendar className="w-4 h-4" />
                Extend Contract
              </Button>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.nik || !formData.name}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Extend Contract Dialog */}
      {showExtendContract && extendContractData && (
        <ContractForm
          lockerId={extendContractData.lockerId}
          lockerNumber={extendContractData.lockerNumber}
          currentContractSeq={extendContractData.currentContractSeq}
          currentEmployee={extendContractData.currentEmployee}
          contracts={extendContractData.contracts}
          open={showExtendContract}
          onClose={() => { setShowExtendContract(false); setExtendContractData(null) }}
          onSuccess={() => {
            setShowExtendContract(false)
            setExtendContractData(null)
            setDialogOpen(false)
            fetchEmployees()
          }}
        />
      )}
      
      {/* Import Dialog */}
      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={fetchEmployees}
      />
      
      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={(open) => { if (!open) { setDeactivateDialogOpen(false); setDeactivatingEmployee(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Nonaktifkan Karyawan
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Anda akan menonaktifkan karyawan <strong>{deactivatingEmployee?.name}</strong> ({deactivatingEmployee?.nik}).</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <KeyRound className="w-4 h-4" />
              Apakah karyawan sudah mengembalikan kunci locker?
            </div>
            <p className="text-xs text-gray-500">
              Jika <strong>sudah</strong>, locker akan diubah ke status Available. Jika <strong>belum</strong>, karyawan tetap muncul di daftar Overdue.
            </p>
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deactivating}>Batal</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDeactivate(false)}
              disabled={deactivating}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {deactivating ? 'Memproses...' : 'Belum Dikembalikan'}
            </Button>
            <Button
              onClick={() => handleDeactivate(true)}
              disabled={deactivating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {deactivating ? 'Memproses...' : 'Sudah Dikembalikan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Activity Log Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Riwayat Aktivitas Karyawan
            </DialogTitle>
            <DialogDescription>
              Menampilkan {activityLogs.length} aktivitas terbaru pada data karyawan, locker, dan kunci.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3">
            {activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <ClipboardList className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Belum ada log aktivitas</p>
              </div>
            ) : (
              activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border shadow-sm text-sm">
                  <Badge 
                    variant={log.action === 'CREATE' ? 'default' : log.action === 'DELETE' ? 'destructive' : log.action === 'IMPORT' ? 'outline' : 'secondary'}
                    className="mt-0.5 shrink-0 text-xs w-20 justify-center"
                  >
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      {new Date(log.timestamp).toLocaleString('id-ID', { 
                        weekday: 'long',
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
