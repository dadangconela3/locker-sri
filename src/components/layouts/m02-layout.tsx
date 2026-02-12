'use client'

import { cn } from '@/lib/utils'
import { Locker } from '@/types'

interface M02LayoutProps {
  lockers: Locker[]
  onLockerClick: (locker: Locker) => void
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700',
  FILLED: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  OVERDUE: 'bg-red-500 hover:bg-red-600 border-red-600 animate-pulse',
  MAINTENANCE: 'bg-amber-400 hover:bg-amber-500 border-amber-500',
  UNIDENTIFIED: 'bg-gray-400 hover:bg-gray-500 border-gray-500',
}

// ================================================================================
// M02 LAYOUT CONFIGURATION - Triple Row with Corridors
// 42 Lockers total: 3 rows × 14 lockers (7 columns × 2 stacks)
// Pattern: Odd numbers on top, even numbers on bottom
// ================================================================================

// Row 1 (29-42): Top section
const M02_ROW1 = {
  upper: [29, 31, 33, 35, 37, 39, 41],
  lower: [30, 32, 34, 36, 38, 40, 42]
}

// Row 2 (15-28): Middle section
const M02_ROW2 = {
  upper: [15, 17, 19, 21, 23, 25, 27],
  lower: [16, 18, 20, 22, 24, 26, 28]
}

// Row 3 (1-14): Bottom section
const M02_ROW3 = {
  upper: [1, 3, 5, 7, 9, 11, 13],
  lower: [2, 4, 6, 8, 10, 12, 14]
}

function LockerButton({ 
  locker, 
  num, 
  onClick 
}: { 
  locker: Locker | undefined
  num: number
  onClick: (locker: Locker) => void 
}) {
  if (!locker) {
    return (
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-300 dark:bg-gray-700 rounded text-xs sm:text-sm flex items-center justify-center text-gray-500">
        {num}
      </div>
    )
  }
  
  return (
    <button
      onClick={() => onClick(locker)}
      className={cn(
        'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded border-2',
        'text-white font-medium text-xs sm:text-sm',
        'transition-all duration-200 transform hover:scale-110 hover:shadow-lg hover:z-10',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
        statusColors[locker.status]
      )}
      title={`${locker.lockerNumber} - ${locker.status}`}
    >
      {num}
    </button>
  )
}

function VerticalRow({
  row,
  lockerMap,
  onLockerClick,
  label
}: {
  row: { upper: number[], lower: number[] }
  lockerMap: Map<number, Locker>
  onLockerClick: (locker: Locker) => void
  label: string
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-gray-500 text-center font-medium mb-3">{label}</p>
      <div className="flex flex-col gap-1 items-center">
        <div className="flex gap-1 sm:gap-2">
          {row.upper.map(num => (
            <LockerButton 
              key={num} 
              num={num} 
              locker={lockerMap.get(num)} 
              onClick={onLockerClick} 
            />
          ))}
        </div>
        <div className="flex gap-1 sm:gap-2">
          {row.lower.map(num => (
            <LockerButton 
              key={num} 
              num={num} 
              locker={lockerMap.get(num)} 
              onClick={onLockerClick} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Corridor() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      <span className="px-3 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Corridor</span>
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}

export function M02Layout({ lockers, onLockerClick }: M02LayoutProps) {
  // Create a map for quick lookup by locker number
  const lockerMap = new Map<number, Locker>()
  lockers.forEach(locker => {
    const num = parseInt(locker.lockerNumber.split('/')[2])
    lockerMap.set(num, locker)
  })
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[350px] p-2 sm:p-4 space-y-3">
        {/* Row 1 (29-42) */}
        <VerticalRow 
          row={M02_ROW1} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Row 1 (29-42)"
        />
        
        <Corridor />
        
        {/* Row 2 (15-28) */}
        <VerticalRow 
          row={M02_ROW2} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Row 2 (15-28)"
        />
        
        <Corridor />
        
        {/* Row 3 (1-14) */}
        <VerticalRow 
          row={M02_ROW3} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Row 3 (1-14)"
        />
      </div>
    </div>
  )
}
