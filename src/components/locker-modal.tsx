'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Calendar, 
  Key, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Settings
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { LockerWithDetails, Contract, KeyLog, LockerStatus } from '@/types'
import { getRemainingDays, formatRemainingDays, getStatusColor } from '@/lib/contract-utils'
import { ContractForm } from './contract-form'
import { KeyLogForm } from './key-log-form'

interface LockerModalProps {
  locker: LockerWithDetails | null
  open: boolean
  onClose: () => void
  onRefresh: () => void
}

const statusConfig = {
  AVAILABLE: { label: 'Available', color: 'bg-white border border-gray-300', icon: CheckCircle },
  FILLED: { label: 'In Use', color: 'bg-blue-500', icon: User },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500', icon: AlertTriangle },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-400', icon: XCircle },
  UNIDENTIFIED: { label: 'Unidentified', color: 'bg-gray-400', icon: XCircle },
}

export function LockerModal({ locker, open, onClose, onRefresh }: LockerModalProps) {
  const [showContractForm, setShowContractForm] = useState(false)
  const [showKeyLogForm, setShowKeyLogForm] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<LockerStatus>('AVAILABLE')
  const [changingStatus, setChangingStatus] = useState(false)
  
  if (!locker) return null
  
  const status = statusConfig[locker.status]
  const StatusIcon = status.icon
  const currentContract = locker.currentContract
  const remainingDays = currentContract && currentContract.endDate ? getRemainingDays(new Date(currentContract.endDate)) : null
  
  // Get latest key log
  const latestKeyLog = locker.keyLogs?.[0]
  const hasKey = latestKeyLog?.action === 'TAKEN'
  
  const handleContractSuccess = () => {
    setShowContractForm(false)
    onRefresh()
  }
  
  const handleKeyLogSuccess = () => {
    setShowKeyLogForm(false)
    onRefresh()
  }
  
  const handleStatusChange = async () => {
    setChangingStatus(true)
    try {
      const res = await fetch(`/api/lockers/${locker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update status')
      }
      
      setShowStatusDialog(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to update locker status:', error)
      const message = error instanceof Error ? error.message : 'Failed to update locker status'
      alert(`Failed to update locker status: ${message}\n\nNote: If you're trying to set UNIDENTIFIED status, make sure to run 'npx prisma db push' first.`)
    } finally {
      setChangingStatus(false)
    }
  }
  
  const openStatusDialog = () => {
    setNewStatus(locker.status)
    setShowStatusDialog(true)
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.color}`}>
                <StatusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">{locker.lockerNumber}</span>
                <Badge variant="outline" className="ml-3">
                  {status.label}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openStatusDialog}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Change Status
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Current Assignment */}
            {currentContract ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Assignment
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Employee</p>
                    <p className="font-medium">{currentContract.employee.name}</p>
                    <p className="text-gray-400">{currentContract.employee.nik}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium">{currentContract.employee.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contract Period</p>
                    <p className="font-medium">
                      {format(new Date(currentContract.startDate), 'dd MMM yyyy')} - {currentContract.endDate ? format(new Date(currentContract.endDate), 'dd MMM yyyy') : 'Permanent'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge className={remainingDays !== null ? getStatusColor(remainingDays) : 'bg-emerald-100 text-emerald-700'}>
                      {remainingDays !== null ? formatRemainingDays(remainingDays) : 'Permanent'}
                    </Badge>
                  </div>
                </div>
                
                {/* Key Status */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span className="text-sm">Key Status:</span>
                    <Badge variant={hasKey ? 'destructive' : 'default'}>
                      {hasKey ? 'Taken by Employee' : 'In Storage'}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowKeyLogForm(true)}
                  >
                    {hasKey ? 'Return Key' : 'Take Key'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                <p className="text-gray-500 mb-4">This locker is not assigned</p>
                <Button onClick={() => setShowContractForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Employee
                </Button>
              </div>
            )}
            
            {/* Actions */}
            {currentContract && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowContractForm(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Extend Contract
                </Button>
              </div>
            )}
            
            {/* Tabs for History */}
            <Tabs defaultValue="contracts" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="contracts" className="flex-1">
                  <History className="w-4 h-4 mr-2" />
                  Contract History
                </TabsTrigger>
                <TabsTrigger value="keylogs" className="flex-1">
                  <Key className="w-4 h-4 mr-2" />
                  Key Logs
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="contracts" className="mt-4">
                <ContractHistory contracts={locker.contracts || []} />
              </TabsContent>
              
              <TabsContent value="keylogs" className="mt-4">
                <KeyLogHistory keyLogs={locker.keyLogs || []} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        
        {/* Contract Form Dialog */}
        {showContractForm && (
          <ContractForm 
            lockerId={locker.id}
            lockerNumber={locker.lockerNumber}
            currentContractSeq={locker.contracts?.length || 0}
            currentEmployee={currentContract?.employee}
            open={showContractForm}
            onClose={() => setShowContractForm(false)}
            onSuccess={handleContractSuccess}
          />
        )}
        
        {/* Key Log Form Dialog */}
        {showKeyLogForm && currentContract && (
          <KeyLogForm
            lockerId={locker.id}
            employeeId={currentContract.employeeId}
            currentAction={hasKey ? 'RETURNED' : 'TAKEN'}
            open={showKeyLogForm}
            onClose={() => setShowKeyLogForm(false)}
            onSuccess={handleKeyLogSuccess}
          />
        )}
        
        {/* Status Change Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Locker Status</AlertDialogTitle>
              <AlertDialogDescription>
                Update the status for locker {locker.lockerNumber}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as LockerStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="FILLED">Filled</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="UNIDENTIFIED">Unidentified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={changingStatus}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusChange} disabled={changingStatus}>
                {changingStatus ? 'Updating...' : 'Update Status'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

function ContractHistory({ contracts }: { contracts: Contract[] }) {
  if (!contracts.length) {
    return <p className="text-center text-gray-500 py-4">No contract history</p>
  }
  
  return (
    <div className="space-y-3">
      {contracts.map((contract) => {
        const remaining = contract.endDate ? getRemainingDays(new Date(contract.endDate)) : null
        return (
          <div 
            key={contract.id} 
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium">Contract #{contract.contractSeq}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(contract.startDate), 'dd MMM yyyy')} - {contract.endDate ? format(new Date(contract.endDate), 'dd MMM yyyy') : 'Permanent'}
              </p>
              {contract.employee && (
                <p className="text-sm text-gray-400">{contract.employee.name}</p>
              )}
            </div>
            <Badge className={remaining !== null ? getStatusColor(remaining) : 'bg-emerald-100 text-emerald-700'}>
              {contract.isActive ? (remaining !== null ? formatRemainingDays(remaining) : 'Permanent') : 'Ended'}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

function KeyLogHistory({ keyLogs }: { keyLogs: KeyLog[] }) {
  if (!keyLogs.length) {
    return <p className="text-center text-gray-500 py-4">No key log entries</p>
  }
  
  return (
    <div className="space-y-3">
      {keyLogs.map((log) => (
        <div 
          key={log.id} 
          className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${log.action === 'TAKEN' ? 'bg-red-100' : 'bg-green-100'}`}>
              <Key className={`w-4 h-4 ${log.action === 'TAKEN' ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="font-medium">Key {log.action.toLowerCase()}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm')}
              </p>
              {log.employee && (
                <p className="text-sm text-gray-400">{log.employee.name}</p>
              )}
            </div>
          </div>
          <Badge variant="outline">{log.method}</Badge>
        </div>
      ))}
    </div>
  )
}
