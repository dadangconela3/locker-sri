/**
 * Type definitions for Locker Management System
 */

export type LockerStatus = 'AVAILABLE' | 'FILLED' | 'OVERDUE' | 'MAINTENANCE' | 'UNIDENTIFIED'
export type KeyStatus = 'AVAILABLE' | 'WITH_EMPLOYEE' | 'WITH_HRGA' | 'LOST'
export type KeyAction = 'TAKEN' | 'RETURNED'
export type KeyMethod = 'QR' | 'MANUAL'

export interface Employee {
  id: string
  nik: string
  name: string
  department: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  contracts?: (Contract & { 
    locker?: Pick<Locker, 'lockerNumber' | 'roomId'> 
  })[]
}

export interface Locker {
  id: string
  lockerNumber: string
  roomId: string
  status: LockerStatus
  createdAt: Date
  updatedAt: Date
}

export interface LockerKey {
  id: string
  lockerId: string
  keyNumber: number
  physicalKeyNumber: string | null
  label: string | null
  status: KeyStatus
  holderId: string | null
  createdAt: Date
  updatedAt: Date
  locker?: Locker
  holder?: Employee | null
}

export interface Contract {
  id: string
  employeeId: string
  lockerId: string
  contractSeq: number
  startDate: Date
  endDate: Date | null
  isActive: boolean
  createdAt: Date
  employee?: Employee
  locker?: Locker
}

export interface KeyLog {
  id: string
  lockerId: string
  lockerKeyId: string | null
  employeeId: string
  action: KeyAction
  method: KeyMethod
  timestamp: Date
  employee?: Employee
  locker?: Locker
  lockerKey?: LockerKey | null
}

export interface LockerWithDetails extends Locker {
  contracts: Contract[]
  keyLogs: KeyLog[]
  keys: LockerKey[]
  currentContract?: Contract & { employee: Employee }
}

export interface RoomConfig {
  roomId: string
  name: string
  count: number
  columns: number
}

export const ROOM_CONFIGS: RoomConfig[] = [
  { roomId: 'M01', name: 'Male 01', count: 218, columns: 20 },
  { roomId: 'M02', name: 'Male 02', count: 42, columns: 7 },
  { roomId: 'F01', name: 'Female 01', count: 94, columns: 10 },
]

export interface DashboardStats {
  total: number
  available: number
  filled: number
  overdue: number
  maintenance: number
  unidentified: number
}

export const KEY_STATUS_LABELS: Record<KeyStatus, string> = {
  AVAILABLE: 'Available',
  WITH_EMPLOYEE: 'With Employee',
  WITH_HRGA: 'With HRGA',
  LOST: 'Lost',
}

export const KEY_STATUS_COLORS: Record<KeyStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  WITH_EMPLOYEE: 'bg-blue-100 text-blue-700',
  WITH_HRGA: 'bg-purple-100 text-purple-700',
  LOST: 'bg-red-100 text-red-700',
}
