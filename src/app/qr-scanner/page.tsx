'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Camera, 
  Key, 
  User, 
  Box,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getRemainingDays, formatRemainingDays, getStatusColor } from '@/lib/contract-utils'

interface ScanResult {
  employee: {
    id: string
    nik: string
    name: string
    department: string
  }
  locker: {
    id: string
    lockerNumber: string
    roomId: string
    status: string
  }
  contract: {
    id: string
    startDate: string
    endDate: string
    contractSeq: number
  }
  hasKey: boolean
}

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [manualNik, setManualNik] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setScanning(true)
      setError(null)
    } catch (err) {
      setError('Could not access camera. Please use manual entry.')
      console.error('Camera error:', err)
    }
  }
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }
  
  const lookupEmployee = async (nik: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch(`/api/qr-lookup?nik=${encodeURIComponent(nik)}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Employee not found')
        return
      }
      
      setResult(data)
      stopCamera()
    } catch (err) {
      setError('Failed to lookup employee')
      console.error('Lookup error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualNik.trim()) {
      lookupEmployee(manualNik.trim())
    }
  }
  
  const handleKeyAction = async () => {
    if (!result) return
    
    setActionLoading(true)
    try {
      const action = result.hasKey ? 'RETURNED' : 'TAKEN'
      
      const res = await fetch('/api/key-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockerId: result.locker.id,
          employeeId: result.employee.id,
          action,
          method: 'QR',
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to record key action')
      }
      
      // Update result
      setResult(prev => prev ? { ...prev, hasKey: !prev.hasKey } : null)
    } catch (err) {
      setError('Failed to record key action')
      console.error('Key action error:', err)
    } finally {
      setActionLoading(false)
    }
  }
  
  const resetScanner = () => {
    setResult(null)
    setError(null)
    setManualNik('')
  }
  
  const remainingDays = result?.contract 
    ? getRemainingDays(new Date(result.contract.endDate))
    : null
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  QR Scanner
                </h1>
                <p className="text-sm text-gray-500">Scan employee badge or enter NIK</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!result ? (
          <div className="space-y-6">
            {/* Camera Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Camera Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanning ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-4 border-blue-500/50 rounded-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-blue-500 rounded-lg" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      Point camera at QR code on employee badge
                    </p>
                    <Button variant="outline" className="w-full" onClick={stopCamera}>
                      Stop Camera
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    onClick={startCamera}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    placeholder="Enter Employee NIK"
                    value={manualNik}
                    onChange={(e) => setManualNik(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !manualNik.trim()}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Lookup'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="py-4 flex items-center gap-3 text-red-600">
                  <XCircle className="w-5 h-5" />
                  {error}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Info */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="w-5 h-5" />
                  Employee Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-lg">{result.employee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NIK</p>
                    <p className="font-semibold">{result.employee.nik}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-semibold">{result.employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contract</p>
                    {remainingDays !== null ? (
                      <Badge className={getStatusColor(remainingDays)}>
                        {formatRemainingDays(remainingDays)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No contract</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Locker Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Assigned Locker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold">{result.locker.lockerNumber}</p>
                    <p className="text-sm text-gray-500">Room: {result.locker.roomId}</p>
                  </div>
                  <Badge variant={result.locker.status === 'OVERDUE' ? 'destructive' : 'default'}>
                    {result.locker.status}
                  </Badge>
                </div>
                
                {result.contract && (
                  <div className="text-sm text-gray-500">
                    Contract Period: {format(new Date(result.contract.startDate), 'dd MMM yyyy')} - {format(new Date(result.contract.endDate), 'dd MMM yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Key Action */}
            <Card className={result.hasKey ? 'border-red-200' : 'border-green-200'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Key Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {result.hasKey ? 'Key is with Employee' : 'Key is in Storage'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {result.hasKey 
                        ? 'Click to record key return' 
                        : 'Click to record key taken'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${result.hasKey ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Key className={`w-6 h-6 ${result.hasKey ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                </div>
                
                <Button 
                  className={`w-full ${
                    result.hasKey 
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleKeyAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  {result.hasKey ? 'Return Key' : 'Take Key'}
                </Button>
              </CardContent>
            </Card>
            
            {/* Reset */}
            <Button variant="outline" className="w-full" onClick={resetScanner}>
              Scan Another Employee
            </Button>
            
            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="py-4 flex items-center gap-3 text-red-600">
                  <XCircle className="w-5 h-5" />
                  {error}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
