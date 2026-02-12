'use client'

import { Locker, ROOM_CONFIGS } from '@/types'
import { M01Layout } from './layouts/m01-layout'
import { M02Layout } from './layouts/m02-layout'
import { F01Layout } from './layouts/f01-layout'

interface LockerGridProps {
  lockers: Locker[]
  roomId: string
  onLockerClick: (locker: Locker) => void
}

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Available',
  FILLED: 'In Use',
  OVERDUE: 'Overdue',
  MAINTENANCE: 'Maintenance',
  UNIDENTIFIED: 'Unidentified',
}

export function LockerGrid({ lockers, roomId, onLockerClick }: LockerGridProps) {
  // Filter lockers for this room
  const roomLockers = lockers.filter(l => l.roomId === roomId)
  
  // Stats
  const stats = {
    available: roomLockers.filter(l => l.status === 'AVAILABLE').length,
    filled: roomLockers.filter(l => l.status === 'FILLED').length,
    overdue: roomLockers.filter(l => l.status === 'OVERDUE').length,
    maintenance: roomLockers.filter(l => l.status === 'MAINTENANCE').length,
    unidentified: roomLockers.filter(l => l.status === 'UNIDENTIFIED').length,
  }
  
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-white border border-gray-300" />
          <span className="text-gray-600 dark:text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-300">In Use</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-400" />
          <span className="text-gray-600 dark:text-gray-300">Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">Unidentified</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500" />
          <span className="text-gray-600 dark:text-gray-300">Overdue</span>
        </div>
      </div>
      
      {/* Room-specific Layout */}
      {roomId === 'M01' && (
        <M01Layout lockers={roomLockers} onLockerClick={onLockerClick} />
      )}
      {roomId === 'M02' && (
        <M02Layout lockers={roomLockers} onLockerClick={onLockerClick} />
      )}
      {roomId === 'F01' && (
        <F01Layout lockers={roomLockers} onLockerClick={onLockerClick} />
      )}
      
      {/* Stats */}
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <span className="font-medium">Total: {roomLockers.length}</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-gray-500">Available: {stats.available}</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-blue-600">In Use: {stats.filled}</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-red-600">Overdue: {stats.overdue}</span>
        {stats.unidentified > 0 && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="text-gray-500">Unidentified: {stats.unidentified}</span>
          </>
        )}
      </div>
    </div>
  )
}
