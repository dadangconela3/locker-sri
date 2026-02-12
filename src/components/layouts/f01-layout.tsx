'use client'

import { cn } from '@/lib/utils'
import { Locker } from '@/types'

interface F01LayoutProps {
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
// F01 LAYOUT CONFIGURATION - 94 Lockers
// Mixed layout: Perimeter columns + Central blocks
// ================================================================================

// Top Row (27-48): 11 columns, odd on top, even on bottom
const TOP_ROW = {
  upper: [27, 29, 31, 33, 35, 37, 39, 41, 43, 45],
  lower: [28, 30, 32, 34, 36, 38, 40, 42, 44, 46]
}

// Left Column (1-26): Sequential pairs descending (26 at top, 1 at bottom)
const LEFT_COLUMN = [
  [25, 26], [23, 24], [21, 22], [19, 20], [17, 18], [15, 16], [13, 14],
  [11, 12], [9, 10], [7, 8], [5, 6], [3, 4], [1, 2]
]

// Right Column (49-58): Sequential pairs ascending
const RIGHT_COLUMN = [
  [47,78],[49, 50], [51, 52], [53, 54], [55, 56], [57, 58]
]

// Middle Section (59-94): Horizontal pairs arranged in rows
const MIDDLE_SECTION = {
  row1: { upper: [[75, 76], [77, 78]], lower: [[73, 74], [79, 80]] },
  row2: { upper: [[71, 72], [81, 82]], lower: [[69, 70], [83, 84]] },
  row3: { upper: [[67, 68], [85, 86]], lower: [[65, 66], [87, 88]] },
  row4: { upper: [[63, 64], [89, 90]], lower: [[61, 62], [91, 92]] },
  row5: { upper: [[59, 60], [93, 94]] }
}

function LockerButton({ 
  locker, 
  num, 
  onClick,
  size = 'normal'
}: { 
  locker: Locker | undefined
  num: number
  onClick: (locker: Locker) => void
  size?: 'small' | 'normal'
}) {
  const sizeClasses = size === 'small' 
    ? 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[10px] sm:text-xs'
    : 'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 text-xs sm:text-sm'
  
  if (!locker) {
    return (
      <div className={cn(sizeClasses, 'bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500')}>
        {num}
      </div>
    )
  }
  
  return (
    <button
      onClick={() => onClick(locker)}
      className={cn(
        sizeClasses,
        'rounded border-2 text-white font-medium',
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

function HorizontalRow({
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
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2 sm:p-3">
      <p className="text-[10px] sm:text-xs text-gray-500 text-center font-medium mb-2">{label}</p>
      <div className="flex flex-col gap-0.5 items-center overflow-x-auto">
        <div className="flex gap-0.5 sm:gap-1">
          {row.upper.map(num => (
            <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
          ))}
        </div>
        <div className="flex gap-0.5 sm:gap-1">
          {row.lower.map(num => (
            <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
          ))}
        </div>
      </div>
    </div>
  )
}

function VerticalColumn({
  pairs,
  lockerMap,
  onLockerClick,
  label
}: {
  pairs: number[][]
  lockerMap: Map<number, Locker>
  onLockerClick: (locker: Locker) => void
  label: string
}) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2">
      <p className="text-[10px] text-gray-500 text-center font-medium mb-1">{label}</p>
      <div className="flex flex-col gap-0.5">
        {pairs.map((pair, i) => (
          <div key={i} className="flex gap-0.5">
            {pair.map(num => (
              <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiddleSectionRow({
  row,
  lockerMap,
  onLockerClick,
  hasLowerRow = true
}: {
  row: { upper: number[][], lower?: number[][] }
  lockerMap: Map<number, Locker>
  onLockerClick: (locker: Locker) => void
  hasLowerRow?: boolean
}) {
  return (
    <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-2">
      <div className="flex flex-col gap-0.5 items-center">
        {/* Upper row */}
        <div className="flex gap-2">
          {row.upper.map((pair, i) => (
            <div key={i} className="flex gap-0.5">
              {pair.map(num => (
                <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
              ))}
            </div>
          ))}
        </div>
        {/* Lower row */}
        {hasLowerRow && row.lower && (
          <div className="flex gap-2">
            {row.lower.map((pair, i) => (
              <div key={i} className="flex gap-0.5">
                {pair.map(num => (
                  <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Corridor() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      <span className="px-2 text-[9px] text-gray-400 uppercase tracking-wider">corridor</span>
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}

export function F01Layout({ lockers, onLockerClick }: F01LayoutProps) {
  // Create a map for quick lookup by locker number
  const lockerMap = new Map<number, Locker>()
  lockers.forEach(locker => {
    const num = parseInt(locker.lockerNumber.split('/')[2])
    lockerMap.set(num, locker)
  })
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[450px] p-2 sm:p-4 space-y-2">
        
        {/* Top Row (27-48) */}
        <HorizontalRow 
          row={TOP_ROW} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Top Row (27-46)"
        />
        
        <Corridor />
        
        {/* Main body: Left Column + Middle Section + Right Column */}
        <div className="flex gap-2">
          
          {/* Left Column (1-26) */}
          <VerticalColumn
            pairs={LEFT_COLUMN}
            lockerMap={lockerMap}
            onLockerClick={onLockerClick}
            label="Left (1-26)"
          />
          
          {/* Middle Section (59-94) */}
          <div className="flex-1 flex justify-center gap-2">
            {/* Left pairs column */}
            <VerticalColumn
              pairs={[
                [75, 76],
                [73, 74],
                [71, 72],
                [69, 70],
                [67, 68],
                [65, 66],
                [63, 64],
                [61, 62],
                [59, 60]
              ]}
              lockerMap={lockerMap}
              onLockerClick={onLockerClick}
              label="Middle Left"
            />
            {/* Right pairs column */}
            <VerticalColumn
              pairs={[
                [77, 78],
                [79, 80],
                [81, 82],
                [83, 84],
                [85, 86],
                [87, 88],
                [89, 90],
                [91, 92],
                [93, 94]
              ]}
              lockerMap={lockerMap}
              onLockerClick={onLockerClick}
              label="Middle Right"
            />
          </div>
          
          {/* Right Column (49-58) */}
          <VerticalColumn
            pairs={RIGHT_COLUMN}
            lockerMap={lockerMap}
            onLockerClick={onLockerClick}
            label="Right (47-58)"
          />
          
        </div>
        
      </div>
    </div>
  )
}
