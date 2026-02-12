'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Key, Loader2 } from 'lucide-react'
import { KeyAction, KeyMethod } from '@/types'

interface KeyLogFormProps {
  lockerId: string
  employeeId: string
  currentAction: KeyAction
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function KeyLogForm({ 
  lockerId, 
  employeeId, 
  currentAction,
  open, 
  onClose, 
  onSuccess 
}: KeyLogFormProps) {
  const [method, setMethod] = useState<KeyMethod>('MANUAL')
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/key-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockerId,
          employeeId,
          action: currentAction,
          method,
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to log key action')
      }
      
      onSuccess()
    } catch (error) {
      console.error('Failed to log key action:', error)
      alert('Failed to log key action. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {currentAction === 'TAKEN' ? 'Record Key Taken' : 'Record Key Returned'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {currentAction === 'TAKEN' 
                ? 'Confirm that the key has been taken by the employee.'
                : 'Confirm that the key has been returned to storage.'}
            </p>
            
            <div className="flex justify-center gap-2">
              <Button
                variant={method === 'MANUAL' ? 'default' : 'outline'}
                onClick={() => setMethod('MANUAL')}
              >
                Manual
              </Button>
              <Button
                variant={method === 'QR' ? 'default' : 'outline'}
                onClick={() => setMethod('QR')}
              >
                QR Scan
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentAction === 'TAKEN' ? '🔑 Taking Key' : '📦 Returning Key'}
            </Badge>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
