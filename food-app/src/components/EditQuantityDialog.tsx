"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit3 } from "lucide-react"

interface EditQuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemUnit?: string
  currentQuantity: number
  onConfirm: (quantity: number) => Promise<void>
}

export default function EditQuantityDialog({
  open,
  onOpenChange,
  itemName,
  itemUnit = "Stück",
  currentQuantity,
  onConfirm
}: EditQuantityDialogProps) {
  const [quantity, setQuantity] = useState(currentQuantity.toString())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuantity(currentQuantity.toString())
  }, [currentQuantity, open])

  const handleConfirm = async () => {
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      alert("Bitte eine gültige Menge eingeben!")
      return
    }

    setLoading(true)
    try {
      await onConfirm(qty)
      onOpenChange(false)
    } catch (e) {
      console.error("Fehler beim Aktualisieren:", e)
      alert("Fehler beim Aktualisieren. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Menge bearbeiten
          </DialogTitle>
          <DialogDescription>
            Aktualisiere die Menge im Vorrat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm font-medium">
              Artikel
            </Label>
            <Input
              id="itemName"
              value={itemName}
              disabled
              className="font-medium bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Neue Menge ({itemUnit})
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="z.B. 500"
              autoFocus
              disabled={loading}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Aktuell: {currentQuantity} {itemUnit}
            </p>
          </div>

          {/* Schnellauswahl-Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity("1")}
              disabled={loading}
            >
              1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity("2")}
              disabled={loading}
            >
              2
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity("5")}
              disabled={loading}
            >
              5
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity("10")}
              disabled={loading}
            >
              10
            </Button>
            {itemUnit.toLowerCase().includes("gramm") && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity("500")}
                  disabled={loading}
                >
                  500g
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity("1000")}
                  disabled={loading}
                >
                  1kg
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird aktualisiert...
              </>
            ) : (
              "Speichern"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
