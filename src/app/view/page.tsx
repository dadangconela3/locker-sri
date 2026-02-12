'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QRScanner } from '@/components/qr-scanner'
import { LockerWithDetails } from '@/types'
import { Search, QrCode, Loader2, User, Calendar, Key, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ViewLockerPage() {
  const [lockerNumber, setLockerNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [locker, setLocker] = useState<LockerWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const handleSearch = async (searchNumber?: string) => {
    const query = searchNumber || lockerNumber.trim()
    if (!query) {
      setError('Masukkan nomor locker')
      return
    }

    setLoading(true)
    setError(null)
    setLocker(null)

    try {
      // Search for locker by exact lockerNumber
      const res = await fetch(`/api/lockers/search?lockerNumber=${encodeURIComponent(query)}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError(`Locker "${query}" tidak ditemukan`)
          return
        }
        throw new Error('Failed to fetch locker')
      }

      const lockerDetails = await res.json()
      setLocker(lockerDetails)
    } catch (err) {
      console.error('Error fetching locker:', err)
      setError('Gagal memuat data locker. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = (result: string) => {
    // Extract locker number from QR code
    // Support formats: "L/M01/001" or JSON: {"type":"locker","number":"L/M01/001"}
    let number = result
    
    try {
      const parsed = JSON.parse(result)
      if (parsed.type === 'locker' && parsed.number) {
        number = parsed.number
      }
    } catch {
      // Not JSON, use as-is
    }

    setLockerNumber(number)
    // Auto-search with the scanned number directly
    handleSearch(number)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const statusConfig = {
    AVAILABLE: { label: 'Available', color: 'bg-white border border-gray-300 text-gray-700' },
    FILLED: { label: 'In Use', color: 'bg-blue-500 text-white' },
    OVERDUE: { label: 'Overdue', color: 'bg-red-500 text-white' },
    MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-400 text-white' },
    UNIDENTIFIED: { label: 'Unidentified', color: 'bg-gray-400 text-white' },
  }

  const currentContract = locker?.currentContract
  const isPermanent = currentContract && !currentContract.endDate

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            View Locker Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Scan QR code or enter locker number manually
          </p>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter locker number (e.g., L/M01/001)"
                    value={lockerNumber}
                    onChange={(e) => setLockerNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-lg"
                  />
                </div>
                <Button
                  onClick={() => setShowScanner(true)}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <QrCode className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locker Details */}
        {locker && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{locker.lockerNumber}</CardTitle>
                <Badge className={statusConfig[locker.status].color}>
                  {statusConfig[locker.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Info */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Room</p>
                <p className="text-lg font-medium">{locker.roomId}</p>
              </div>

              {/* Contract Info */}
              {currentContract ? (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold">Current User</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Employee</p>
                      <p className="font-medium">{currentContract.employee.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        NIK: {currentContract.employee.nik}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                      <p className="font-medium">{currentContract.employee.department}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Contract Period
                    </p>
                    <p className="font-medium">
                      {format(new Date(currentContract.startDate), 'dd MMM yyyy')} - {' '}
                      {isPermanent ? 'Permanent' : format(new Date(currentContract.endDate!), 'dd MMM yyyy')}
                    </p>
                    {isPermanent && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700">
                        Permanent Employee
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-gray-500 dark:text-gray-400">No active contract</p>
                </div>
              )}

              {/* Key Info */}
              {locker.keys && locker.keys.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Key className="w-5 h-5" />
                    <h3 className="font-semibold">Keys</h3>
                  </div>
                  <div className="space-y-2">
                    {locker.keys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Key #{key.physicalKeyNumber}</p>
                          {key.holder && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Held by: {key.holder.name}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {key.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  )
}
