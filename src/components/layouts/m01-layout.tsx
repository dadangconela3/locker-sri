'use client'

import { cn } from '@/lib/utils'
import { Locker } from '@/types'

interface M01LayoutProps {
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
// M01 LAYOUT CONFIGURATION - 218 Lockers
// Mixed layout: Perimeter columns + Central blocks
// ================================================================================

// Top Row (53-80): 14 columns, odd on top, even on bottom
const TOP_ROW = {
  upper: [53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79],
  lower: [54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80]
}

// Left Column (27-52): Sequential pairs descending, [odd even] per row
const LEFT_COLUMN = [
  [51, 52], [49, 50], [47, 48], [45, 46], [43, 44], [41, 42],
  [39, 40], [37, 38], [35, 36], [33, 34], [31, 32], [29, 30], [27, 28]
]

// Right Column (81-98): Even-odd pairs descending, [even odd] per row
const RIGHT_COLUMN = [
  [82, 81], [84, 83], [86, 85], [88, 87], [90, 89], [92, 91],
  [94, 93], [96, 95], [98, 97]
]

// Middle Section Row 1 (193-218): Descending even on top, odd below
const MIDDLE_ROW1 = {
  upper: [218, 216, 214, 212, 210, 208, 206, 204, 202, 200, 198, 194],
  lower: [217, 215, 213, 211, 209, 207, 205, 203, 201, 199, 197, 193]
}

// Middle Section Row 2 (147-196): 4 rows of lockers
const MIDDLE_ROW2 = {
  row1: [172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 196],
  row2: [171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 195],
  row3: [169, 167, 165, 163, 161, 159, 157, 155, 153, 151, 149, 147],
  row4: [170, 168, 166, 164, 162, 160, 158, 156, 154, 152, 150, 148]
}

// Middle Section Row 3 (99-146): 4 rows of lockers
const MIDDLE_ROW3 = {
  row1: [123, 125, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145],
  row2: [124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146],
  row3: [121, 119, 117, 115, 113, 111, 109, 107, 105, 103, 101, 99],
  row4: [122, 120, 118, 116, 114, 112, 110, 108, 106, 104, 102, 100]
}

// Bottom Row (1-26): Descending odd on top, even below
const BOTTOM_ROW = {
  upper: [25, 23, 21, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1],
  lower: [26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
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
    ? 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[10px] sm:text-xs'
    : 'w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 text-[10px] sm:text-xs'
  
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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2 sm:p-3">
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
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2">
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

function FourRowBlock({
  rows,
  lockerMap,
  onLockerClick,
  label
}: {
  rows: { row1: number[], row2: number[], row3: number[], row4: number[] }
  lockerMap: Map<number, Locker>
  onLockerClick: (locker: Locker) => void
  label: string
}) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2 sm:p-3">
      <p className="text-[10px] sm:text-xs text-gray-500 text-center font-medium mb-2">{label}</p>
      <div className="flex flex-col gap-0.5 items-center overflow-x-auto">
        {[rows.row1, rows.row2, rows.row3, rows.row4].map((row, i) => (
          <div key={i} className="flex gap-0.5 sm:gap-1">
            {row.map(num => (
              <LockerButton key={num} num={num} locker={lockerMap.get(num)} onClick={onLockerClick} size="small" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Corridor({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      <span className="px-2 text-[9px] text-gray-400 uppercase tracking-wider">{label || 'corridor'}</span>
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}

export function M01Layout({ lockers, onLockerClick }: M01LayoutProps) {
  // Create a map for quick lookup by locker number
  const lockerMap = new Map<number, Locker>()
  lockers.forEach(locker => {
    const num = parseInt(locker.lockerNumber.split('/')[2])
    lockerMap.set(num, locker)
  })
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] p-2 sm:p-4 space-y-2">
        
        {/* Top Row (53-80) */}
        <HorizontalRow 
          row={TOP_ROW} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Top Row (53-80)"
        />
        
        <Corridor />
        
        {/* Main body: Left Column + Middle Section + Right Column */}
        <div className="flex gap-2">
          
          {/* Left Column (27-52) */}
          <VerticalColumn
            pairs={LEFT_COLUMN}
            lockerMap={lockerMap}
            onLockerClick={onLockerClick}
            label="Left (27-52)"
          />
          
          {/* Middle Section */}
          <div className="flex-1 space-y-2">
            
            {/* Middle Row 1 (193-218) */}
            <HorizontalRow 
              row={MIDDLE_ROW1} 
              lockerMap={lockerMap} 
              onLockerClick={onLockerClick}
              label="Row 1 (193-218)"
            />
            
            <Corridor />
            
            {/* Middle Row 2 (147-196) */}
            <FourRowBlock
              rows={MIDDLE_ROW2}
              lockerMap={lockerMap}
              onLockerClick={onLockerClick}
              label="Row 2 (147-196)"
            />
            
            <Corridor />
            
            {/* Middle Row 3 (99-146) */}
            <FourRowBlock
              rows={MIDDLE_ROW3}
              lockerMap={lockerMap}
              onLockerClick={onLockerClick}
              label="Row 3 (99-146)"
            />
            
          </div>
          
          {/* Right Column (81-98) */}
          <VerticalColumn
            pairs={RIGHT_COLUMN}
            lockerMap={lockerMap}
            onLockerClick={onLockerClick}
            label="Right (81-98)"
          />
          
        </div>
        
        <Corridor />
        
        {/* Bottom Row (1-26) */}
        <HorizontalRow 
          row={BOTTOM_ROW} 
          lockerMap={lockerMap} 
          onLockerClick={onLockerClick}
          label="Bottom Row (1-26)"
        />
        
      </div>
    </div>
  )
}
