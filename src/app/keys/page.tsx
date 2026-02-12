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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Pencil, 
  Key,
  Search,
  User,
  Plus,
  Trash2
} from 'lucide-react'
import { LockerKey, Employee, Locker, ROOM_CONFIGS, KEY_STATUS_LABELS, KEY_STATUS_COLORS, KeyStatus } from '@/types'
import { EmployeeSelect, LockerSelect } from '@/components/tom-select-wrapper'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function KeysPage() {
  const [keys, setKeys] = useState<LockerKey[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<LockerKey | null>(null)
  const [deletingKey, setDeletingKey] = useState<LockerKey | null>(null)
  const [formData, setFormData] = useState({
    status: 'AVAILABLE' as KeyStatus,
    holderId: '',
    label: '',
    physicalKeyNumber: '',
  })
  const [createFormData, setCreateFormData] = useState({
    lockerId: '',
    label: '',
    physicalKeyNumber: '',
    status: 'AVAILABLE' as KeyStatus,
  })
  const [saving, setSaving] = useState(false)
  
  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedRoom !== 'all') params.set('roomId', selectedRoom)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      
      const res = await fetch(`/api/keys?${params}`)
      const data = await res.json()
      // Ensure we always have an array
      setKeys(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch keys:', error)
      setKeys([])
    } finally {
      setLoading(false)
    }
  }, [selectedRoom, selectedStatus])
  
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees?activeOnly=true')
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }
  
  const fetchLockers = async () => {
    try {
      const res = await fetch('/api/lockers')
      const data = await res.json()
      setLockers(data)
    } catch (error) {
      console.error('Failed to fetch lockers:', error)
    }
  }
  
  useEffect(() => {
    fetchKeys()
    fetchEmployees()
    fetchLockers()
  }, [fetchKeys])
  
  const handleOpenDialog = (key: LockerKey) => {
    setEditingKey(key)
    setFormData({
      status: key.status as KeyStatus,
      holderId: key.holderId || '',
      label: key.label || '',
      physicalKeyNumber: key.physicalKeyNumber || '',
    })
    setDialogOpen(true)
  }
  
  const handleSave = async () => {
    if (!editingKey) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/keys/${editingKey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          holderId: formData.holderId || null,
          label: formData.label,
          physicalKeyNumber: formData.physicalKeyNumber || null,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to save')
        return
      }
      
      setDialogOpen(false)
      fetchKeys()
    } catch (error) {
      console.error('Failed to save key:', error)
      alert('Failed to save key')
    } finally {
      setSaving(false)
    }
  }
  
  const handleCreate = async () => {
    if (!createFormData.lockerId) {
      alert('Please select a locker')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockerId: createFormData.lockerId,
          label: createFormData.label || null,
          physicalKeyNumber: createFormData.physicalKeyNumber || null,
          status: createFormData.status,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create key')
        return
      }
      
      setCreateDialogOpen(false)
      setCreateFormData({
        lockerId: '',
        label: '',
        physicalKeyNumber: '',
        status: 'AVAILABLE',
      })
      fetchKeys()
    } catch (error) {
      console.error('Failed to create key:', error)
      alert('Failed to create key')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!deletingKey) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/keys/${deletingKey.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to delete key')
        return
      }
      
      setDeleteDialogOpen(false)
      setDeletingKey(null)
      fetchKeys()
    } catch (error) {
      console.error('Failed to delete key:', error)
      alert('Failed to delete key')
    } finally {
      setSaving(false)
    }
  }
  
  const openDeleteDialog = (key: LockerKey) => {
    setDeletingKey(key)
    setDeleteDialogOpen(true)
  }
  
  // Filter by search
  const filteredKeys = keys.filter(key => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      key.locker?.lockerNumber.toLowerCase().includes(searchLower) ||
      key.holder?.name.toLowerCase().includes(searchLower) ||
      key.holder?.nik.toLowerCase().includes(searchLower) ||
      key.label?.toLowerCase().includes(searchLower)
    )
  })
  
  // Stats
  const stats = {
    total: keys.length,
    available: keys.filter(k => k.status === 'AVAILABLE').length,
    withEmployee: keys.filter(k => k.status === 'WITH_EMPLOYEE').length,
    withHRGA: keys.filter(k => k.status === 'WITH_HRGA').length,
    lost: keys.filter(k => k.status === 'LOST').length,
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
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg sm:rounded-xl">
                <Key className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                  Key Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Manage locker keys
                </p>
              </div>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Key</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          <Card className="bg-gray-50 dark:bg-gray-800 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-emerald-600">Available</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-emerald-600">{stats.available}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-blue-600">With Employee</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-blue-600">{stats.withEmployee}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-purple-600">With HRGA</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-purple-600">{stats.withHRGA}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-0 col-span-2 sm:col-span-1">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-red-600">Lost</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-red-600">{stats.lost}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by locker, employee, or label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {ROOM_CONFIGS.map(room => (
                <SelectItem key={room.roomId} value={room.roomId}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="WITH_EMPLOYEE">With Employee</SelectItem>
              <SelectItem value="WITH_HRGA">With HRGA</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locker</TableHead>
                    <TableHead>Key #</TableHead>
                    <TableHead className="hidden lg:table-cell">Physical Key #</TableHead>
                    <TableHead className="hidden sm:table-cell">Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Holder</TableHead>
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
                  ) : filteredKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm">
                          {key.locker?.lockerNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">#{key.keyNumber}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {key.physicalKeyNumber ? (
                            <span className="font-mono text-sm">{key.physicalKeyNumber}</span>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Duplicate</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-gray-500">
                          {key.label || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={KEY_STATUS_COLORS[key.status as KeyStatus]}>
                            {KEY_STATUS_LABELS[key.status as KeyStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {key.holder ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{key.holder.name}</span>
                              <span className="text-xs text-gray-400">({key.holder.nik})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(key)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(key)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </main>
      
      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Key</DialogTitle>
            <DialogDescription>
              Update key #{editingKey?.keyNumber} for {editingKey?.locker?.lockerNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Employee Key, HRGA Backup"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="physicalKeyNumber">Physical Key Number</Label>
              <Input
                id="physicalKeyNumber"
                value={formData.physicalKeyNumber}
                onChange={(e) => setFormData({ ...formData, physicalKeyNumber: e.target.value })}
                placeholder="e.g., M01-001 (leave empty for duplicate keys)"
              />
              <p className="text-xs text-gray-500">
                Leave empty for duplicate/spare keys without physical numbers
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as KeyStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="WITH_EMPLOYEE">With Employee</SelectItem>
                  <SelectItem value="WITH_HRGA">With HRGA</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.status === 'WITH_EMPLOYEE') && (
              <div className="space-y-2">
                <Label htmlFor="holder">Key Holder</Label>
                <EmployeeSelect
                  employees={employees}
                  value={formData.holderId}
                  onChange={(value) => setFormData({ ...formData, holderId: value })}
                  placeholder="Search employee by NIK or name..."
                />
              </div>
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
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Key</DialogTitle>
            <DialogDescription>
              Create a new key for a locker
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="locker">Locker *</Label>
              <LockerSelect
                lockers={lockers}
                value={createFormData.lockerId}
                onChange={(value) => setCreateFormData({ ...createFormData, lockerId: value })}
                placeholder="Search locker by number or room..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="createLabel">Label</Label>
              <Input
                id="createLabel"
                value={createFormData.label}
                onChange={(e) => setCreateFormData({ ...createFormData, label: e.target.value })}
                placeholder="e.g., Employee Key, HRGA Backup"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="createPhysicalKeyNumber">Physical Key Number (Kode Kunci)</Label>
              <Input
                id="createPhysicalKeyNumber"
                value={createFormData.physicalKeyNumber}
                onChange={(e) => setCreateFormData({ ...createFormData, physicalKeyNumber: e.target.value })}
                placeholder="e.g., M01-001-A"
              />
              <p className="text-xs text-gray-500">
                Leave empty for duplicate/spare keys without physical numbers
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="createStatus">Status</Label>
              <Select
                value={createFormData.status}
                onValueChange={(value) => setCreateFormData({ ...createFormData, status: value as KeyStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="WITH_EMPLOYEE">With Employee</SelectItem>
                  <SelectItem value="WITH_HRGA">With HRGA</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false)
                  setCreateFormData({
                    lockerId: '',
                    label: '',
                    physicalKeyNumber: '',
                    status: 'AVAILABLE',
                  })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {saving ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete key #{deletingKey?.keyNumber} for locker {deletingKey?.locker?.lockerNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
