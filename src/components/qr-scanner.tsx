'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Camera, SwitchCamera } from 'lucide-react'

interface QRScannerProps {
  open: boolean
  onClose: () => void
  onScan: (result: string) => void
}

export function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const mountedRef = useRef(false)

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState()
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
    setScanning(false)
  }

  const startScanner = async (cameraId?: string) => {
    // Dynamic import to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode')
    
    try {
      setError(null)
      
      // Stop existing scanner first
      await stopScanner()

      // Wait a bit for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!scannerRef.current || !mountedRef.current) return

      // Get available cameras
      const devices = await Html5Qrcode.getCameras()
      
      if (devices.length === 0) {
        setError('Tidak ada kamera yang ditemukan. Pastikan perangkat memiliki kamera.')
        return
      }

      setCameras(devices)

      // Create scanner instance
      const qrCodeScanner = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = qrCodeScanner

      // Choose camera: prefer back camera on mobile
      const selectedCameraId = cameraId || devices[currentCameraIndex]?.id || devices[0].id

      setScanning(true)

      await qrCodeScanner.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText)
          stopScanner()
          onClose()
        },
        () => {
          // QR code not found in frame - this is normal, ignore
        }
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      
      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
        setError('Akses kamera ditolak. Silakan izinkan akses kamera di browser settings.')
      } else if (errorMessage.includes('NotFound') || errorMessage.includes('DevicesNotFound')) {
        setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.')
      } else if (errorMessage.includes('NotReadable') || errorMessage.includes('TrackStartError')) {
        setError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.')
      } else {
        setError(`Gagal membuka kamera: ${errorMessage}`)
      }
      setScanning(false)
    }
  }

  const switchCamera = async () => {
    if (cameras.length <= 1) return
    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)
    await startScanner(cameras[nextIndex].id)
  }

  useEffect(() => {
    mountedRef.current = true

    if (open) {
      // Delay to let the dialog render first
      const timer = setTimeout(() => {
        startScanner()
      }, 500)
      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    } else {
      stopScanner()
    }

    return () => {
      mountedRef.current = false
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  const handleRetry = () => {
    startScanner()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
              <Button onClick={handleRetry} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <div id="qr-reader" ref={scannerRef} className="w-full" />
                
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center space-y-2">
                      <Camera className="w-10 h-10 text-gray-400 mx-auto animate-pulse" />
                      <p className="text-sm text-gray-400">Membuka kamera...</p>
                    </div>
                  </div>
                )}
              </div>

              {cameras.length > 1 && (
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  className="w-full"
                  size="sm"
                >
                  <SwitchCamera className="w-4 h-4 mr-2" />
                  Ganti Kamera ({cameras[currentCameraIndex]?.label || `Camera ${currentCameraIndex + 1}`})
                </Button>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>

          {scanning && (
            <p className="text-xs text-center text-gray-500">
              Arahkan kamera ke QR Code locker
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
