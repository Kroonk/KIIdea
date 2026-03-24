"use client"

import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Loader2 } from "lucide-react"

export default function BarcodeScanner({ onScan }: { onScan: (barcode: string) => void }) {
  const [scanning, setScanning] = useState(true)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Only initialize once on mount
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear()
            setScanning(false)
            onScan(decodedText)
          }
        },
        (error) => {
          // ignore scan errors
        }
      )
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScan])

  return (
    <div className="w-full flex flex-col bg-card rounded-lg overflow-hidden border">
      {scanning ? (
        <div id="barcode-reader" className="w-full min-h-[300px]"></div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/30">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Verarbeite Barcode...</p>
        </div>
      )}
    </div>
  )
}
