/**
 * Contract utility functions
 */

/**
 * Calculate remaining days from today to end date
 * @param endDate - Contract end date
 * @returns Number of days remaining (negative if overdue)
 */
export function getRemainingDays(endDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  
  const diffTime = end.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a contract is overdue based on end date
 * @param endDate - Contract end date
 * @returns true if contract has expired
 */
export function isOverdue(endDate: Date): boolean {
  return getRemainingDays(endDate) < 0
}

/**
 * Format remaining days for display
 * @param days - Number of remaining days
 * @returns Formatted string for display
 */
export function formatRemainingDays(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`
  } else if (days === 0) {
    return 'Expires today'
  } else if (days === 1) {
    return '1 day remaining'
  } else {
    return `${days} days remaining`
  }
}

/**
 * Get status color based on remaining days
 * @param days - Number of remaining days
 * @returns Tailwind color class
 */
export function getStatusColor(days: number): string {
  if (days < 0) {
    return 'text-red-600 bg-red-50'
  } else if (days <= 7) {
    return 'text-orange-600 bg-orange-50'
  } else if (days <= 30) {
    return 'text-yellow-600 bg-yellow-50'
  } else {
    return 'text-green-600 bg-green-50'
  }
}
