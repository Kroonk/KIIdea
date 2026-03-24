"use client"

import { useState } from "react"
import BarcodeScanner from "@/components/BarcodeScanner"
import { handleBarcodeScan } from "@/app/actions/inventory"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BarcodeScannerWrapper() {
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | null}>({ text: '', type: null })

  const onScan = async (barcode: string) => {
    setScanning(true)
    setMessage({ text: `Suche EAN ${barcode}...`, type: null })
    try {
      const res = await handleBarcodeScan(barcode)
      if (res.success) {
        setMessage({ text: `Hinzugefügt: ${res.itemName}`, type: 'success' })
      } else {
        setMessage({ text: res.message || 'Nicht gefunden.', type: 'error' })
      }
    } catch (e) {
      setMessage({ text: 'Interner Fehler beim Scannen.', type: 'error' })
    } finally {
      setScanning(false)
    }
  }

  if (message.type) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border rounded-lg gap-4">
        {message.type === 'success' ? <CheckCircle className="w-12 h-12 text-primary" /> : <XCircle className="w-12 h-12 text-destructive" />}
        <p className="text-center font-medium">{message.text}</p>
        <Button onClick={() => setMessage({ text: '', type: null })} variant="outline">Erneut scannen</Button>
      </div>
    )
  }

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border rounded-lg gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-medium animate-pulse">{message.text}</p>
      </div>
    )
  }

  return (
    <div>
      <BarcodeScanner onScan={onScan} />
    </div>
  )
}
