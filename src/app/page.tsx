'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LockerGrid } from '@/components/locker-grid'
import { LockerModal } from '@/components/locker-modal'
import { StatsCards } from '@/components/stats-cards'
import { OverdueList } from '@/components/overdue-list'
import { Locker, LockerWithDetails, DashboardStats, ROOM_CONFIGS } from '@/types'
import { 
  RefreshCw, 
  QrCode, 
  Box,
  Users,
  Key,
  Upload
} from 'lucide-react'
import Link from 'next/link'

import useSWR from 'swr'

  const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

  export default function Home() {
    // defined locally to avoid re-creation
    const { data: lockers = [], mutate: mutateLockers } = useSWR<Locker[]>('/api/lockers', fetcher, {
      fallbackData: [],
      revalidateOnFocus: false // Don't aggressive revalidate on window focus for lockers
    })
    
    const { data: stats } = useSWR<DashboardStats>('/api/stats', fetcher, {
      fallbackData: {
        total: 0,
        available: 0,
        filled: 0,
        overdue: 0,
        maintenance: 0,
        unidentified: 0,
      }
    })
    
    const { data: overdueContracts = [] } = useSWR<any[]>('/api/contracts?overdueOnly=true', fetcher, {
      fallbackData: []
    })

    const [selectedLocker, setSelectedLocker] = useState<LockerWithDetails | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [activeRoom, setActiveRoom] = useState('M01')
    
    // Derived state for loading - false if we have data (even stale)
    const loading = !lockers.length && !stats
    
    const handleLockerClick = async (locker: Locker) => {
      try {
        const res = await fetch(`/api/lockers/${locker.id}`)
        const data = await res.json()
        setSelectedLocker(data)
        setModalOpen(true)
      } catch (error) {
        console.error('Failed to fetch locker details:', error)
      }
    }
    
    const handleOverdueLockerClick = async (lockerId: string) => {
      try {
        const res = await fetch(`/api/lockers/${lockerId}`)
        const data = await res.json()
        setSelectedLocker(data)
        setModalOpen(true)
      } catch (error) {
        console.error('Failed to fetch locker details:', error)
      }
    }
    
    const handleModalClose = () => {
      setModalOpen(false)
      setSelectedLocker(null)
    }
    
    const handleRefresh = () => {
      mutateLockers() 
      if (selectedLocker) {
        fetch(`/api/lockers/${selectedLocker.id}`)
          .then(res => res.json())
          .then(data => setSelectedLocker(data))
          .catch(console.error)
      }
    }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                  Locker Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Track and manage employee lockers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Link href="/employees">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                  <Users className="w-4 h-4" />
                  <span className="hidden lg:inline ml-2">Employees</span>
                </Button>
              </Link>
              <Link href="/keys">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                  <Key className="w-4 h-4" />
                  <span className="hidden lg:inline ml-2">Keys</span>
                </Button>
              </Link>
              <Link href="/import">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                  <Upload className="w-4 h-4" />
                  <span className="hidden lg:inline ml-2">Import</span>
                </Button>
              </Link>
              <Link href="/view">
                <Button 
                  size="sm" 
                  className="h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">View Locker</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Stats */}
        <StatsCards stats={stats} />
        
        {/* Room Tabs - Mobile Optimized */}
        <Tabs value={activeRoom} onValueChange={setActiveRoom} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              Locker Grid
            </h2>
            <TabsList className="bg-gray-100 dark:bg-gray-800 w-full sm:w-auto grid grid-cols-3 sm:flex">
              {ROOM_CONFIGS.map((room) => (
                <TabsTrigger 
                  key={room.roomId} 
                  value={room.roomId} 
                  className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">{room.name}</span>
                  <span className="sm:hidden">{room.roomId}</span>
                  <span className="ml-1 text-[10px] sm:text-xs opacity-60">({room.count})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {ROOM_CONFIGS.map((room) => (
            <TabsContent key={room.roomId} value={room.roomId}>
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 overflow-hidden">
                <LockerGrid 
                  lockers={lockers}
                  roomId={room.roomId}
                  onLockerClick={handleLockerClick}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Overdue List */}
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Overdue Returns
          </h2>
          <OverdueList 
            contracts={overdueContracts}
            onLockerClick={handleOverdueLockerClick}
          />
        </div>
      </main>
      
      {/* Locker Modal */}
      <LockerModal 
        locker={selectedLocker}
        open={modalOpen}
        onClose={handleModalClose}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
