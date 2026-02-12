'use client'

import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Contract } from '@/types'
import { getRemainingDays, formatRemainingDays } from '@/lib/contract-utils'

interface OverdueListProps {
  contracts: (Contract & { 
    employee: { name: string; nik: string; department: string }
    locker: { lockerNumber: string; roomId: string }
  })[]
  onLockerClick?: (lockerId: string) => void
}

export function OverdueList({ contracts, onLockerClick }: OverdueListProps) {
  if (!contracts.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No overdue contracts</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Overdue Returns ({contracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Locker</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              if (!contract.endDate) return null
              const days = getRemainingDays(new Date(contract.endDate))
              return (
                <TableRow 
                  key={contract.id} 
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onLockerClick?.(contract.lockerId)}
                >
                  <TableCell className="font-medium">
                    {contract.locker.lockerNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.employee.name}</p>
                      <p className="text-sm text-gray-500">{contract.employee.nik}</p>
                    </div>
                  </TableCell>
                  <TableCell>{contract.employee.department}</TableCell>
                  <TableCell>
                    {format(new Date(contract.endDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {formatRemainingDays(days)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
