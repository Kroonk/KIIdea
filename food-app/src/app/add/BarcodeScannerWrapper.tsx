"use client"

import { useState } from "react"
import BarcodeScanner from "@/components/BarcodeScanner"
import { handleBarcodeScan, addToInventory } from "@/app/actions/inventory"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import AddQuantityDialog from "@/components/AddQuantityDialog"

export default function BarcodeScannerWrapper() {
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | null}>({ text: '', type: null })

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scannedItem, setScannedItem] = useState<{id: string, name: string, unit: string, suggestedQuantity?: number} | null>(null)

  const onScan = async (barcode: string) => {
    setScanning(true)
    setMessage({ text: `Suche EAN ${barcode}...`, type: null })
    try {
      const res = await handleBarcodeScan(barcode)
      if (res.success && res.item) {
        // Öffne Dialog für Mengeneingabe
        setScannedItem({
          id: res.item.id,
          name: res.item.name,
          unit: res.item.unit || "Stück",
          suggestedQuantity: res.suggestedQuantity || 1
        })
        setDialogOpen(true)
        setMessage({ text: '', type: null })
      } else {
        setMessage({ text: res.message || 'Nicht gefunden.', type: 'error' })
      }
    } catch (e) {
      setMessage({ text: 'Interner Fehler beim Scannen.', type: 'error' })
    } finally {
      setScanning(false)
    }
  }

  const handleConfirmQuantity = async (quantity: number) => {
    if (!scannedItem) return

    try {
      await addToInventory(scannedItem.id, quantity)
      setMessage({ text: `${quantity} ${scannedItem.unit} ${scannedItem.name} hinzugefügt!`, type: 'success' })
      setScannedItem(null)
    } catch (e) {
      setMessage({ text: 'Fehler beim Hinzufügen.', type: 'error' })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setScannedItem(null)
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
    <>
      <div>
        <BarcodeScanner onScan={onScan} />
      </div>

      {scannedItem && (
        <AddQuantityDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          itemName={scannedItem.name}
          itemUnit={scannedItem.unit}
          suggestedQuantity={scannedItem.suggestedQuantity}
          onConfirm={handleConfirmQuantity}
        />
      )}
    </>
  )
}
