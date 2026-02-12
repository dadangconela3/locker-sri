'use client'

import { useEffect, useRef } from 'react'
import TomSelect from 'tom-select'
import 'tom-select/dist/css/tom-select.css'

interface TomSelectOption {
  value: string
  text: string
  [key: string]: any
}

interface TomSelectProps {
  options: TomSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchField?: string[]
  valueField?: string
  labelField?: string
  render?: {
    option?: (data: any, escape: (str: string) => string) => string
    item?: (data: any, escape: (str: string) => string) => string
  }
  disabled?: boolean
  className?: string
}

export function TomSelectWrapper({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchField = ['text'],
  valueField = 'value',
  labelField = 'text',
  render,
  disabled = false,
  className = ''
}: TomSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const tomSelectRef = useRef<TomSelect | null>(null)

  useEffect(() => {
    if (!selectRef.current) return

    // Initialize TomSelect
    tomSelectRef.current = new TomSelect(selectRef.current, {
      options,
      valueField,
      labelField,
      searchField,
      placeholder,
      render,
      onChange: (selectedValue: string) => {
        onChange(selectedValue)
      },
      ...(disabled && { disabled: true })
    })

    // Set initial value
    if (value) {
      tomSelectRef.current.setValue(value, true)
    }

    // Cleanup
    return () => {
      if (tomSelectRef.current) {
        tomSelectRef.current.destroy()
        tomSelectRef.current = null
      }
    }
  }, []) // Only run on mount

  // Update options when they change
  useEffect(() => {
    if (tomSelectRef.current) {
      tomSelectRef.current.clearOptions()
      tomSelectRef.current.addOptions(options)
      if (value) {
        tomSelectRef.current.setValue(value, true)
      }
    }
  }, [options])

  // Update value when it changes externally
  useEffect(() => {
    if (tomSelectRef.current && value !== undefined) {
      tomSelectRef.current.setValue(value, true)
    }
  }, [value])

  // Update disabled state
  useEffect(() => {
    if (tomSelectRef.current) {
      if (disabled) {
        tomSelectRef.current.disable()
      } else {
        tomSelectRef.current.enable()
      }
    }
  }, [disabled])

  return (
    <select
      ref={selectRef}
      className={className}
      defaultValue={value}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option[valueField]} value={option[valueField]}>
          {option[labelField]}
        </option>
      ))}
    </select>
  )
}

// Employee-specific TomSelect component
interface EmployeeSelectProps {
  employees: Array<{
    id: string
    nik: string
    name: string
    department: string
  }>
  value?: string
  onChange: (employeeId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EmployeeSelect({
  employees,
  value,
  onChange,
  placeholder = 'Select employee...',
  disabled = false,
  className = ''
}: EmployeeSelectProps) {
  const options = employees.map(emp => ({
    value: emp.id,
    text: `${emp.nik} - ${emp.name}`,
    nik: emp.nik,
    name: emp.name,
    department: emp.department
  }))

  return (
    <TomSelectWrapper
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchField={['text', 'nik', 'name', 'department']}
      disabled={disabled}
      className={className}
      render={{
        option: (data, escape) => {
          return `
            <div class="py-2">
              <div class="font-medium text-gray-900">${escape(data.nik)} - ${escape(data.name)}</div>
              <div class="text-sm text-gray-500">${escape(data.department)}</div>
            </div>
          `
        },
        item: (data, escape) => {
          return `<div>${escape(data.nik)} - ${escape(data.name)}</div>`
        }
      }}
    />
  )
}

// Locker-specific TomSelect component
interface LockerSelectProps {
  lockers: Array<{
    id: string
    lockerNumber: string
    roomId: string
    status: string
  }>
  value?: string
  onChange: (lockerId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LockerSelect({
  lockers,
  value,
  onChange,
  placeholder = 'Select locker...',
  disabled = false,
  className = ''
}: LockerSelectProps) {
  const options = lockers.map(locker => ({
    value: locker.id,
    text: locker.lockerNumber,
    lockerNumber: locker.lockerNumber,
    roomId: locker.roomId,
    status: locker.status
  }))

  return (
    <TomSelectWrapper
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchField={['text', 'lockerNumber', 'roomId']}
      disabled={disabled}
      className={className}
      render={{
        option: (data, escape) => {
          const statusColors: Record<string, string> = {
            AVAILABLE: 'bg-gray-100 text-gray-700',
            FILLED: 'bg-blue-100 text-blue-700',
            OVERDUE: 'bg-red-100 text-red-700',
            MAINTENANCE: 'bg-amber-100 text-amber-700',
            UNIDENTIFIED: 'bg-gray-200 text-gray-600',
          }
          const statusColor = statusColors[data.status] || 'bg-gray-100 text-gray-700'
          return `
            <div class="py-2 flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900">${escape(data.lockerNumber)}</div>
                <div class="text-sm text-gray-500">Room: ${escape(data.roomId)}</div>
              </div>
              <span class="px-2 py-1 text-xs rounded ${statusColor}">${escape(data.status)}</span>
            </div>
          `
        },
        item: (data, escape) => {
          return `<div>${escape(data.lockerNumber)}</div>`
        }
      }}
    />
  )
}
