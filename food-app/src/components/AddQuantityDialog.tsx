"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Package } from "lucide-react"
import { toast } from "sonner"
import QuickSelectButtons from "@/components/QuickSelectButtons"

interface AddQuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemUnit?: string
  suggestedQuantity?: number
  onConfirm: (quantity: number) => Promise<void>
}

export default function AddQuantityDialog({
  open,
  onOpenChange,
  itemName,
  itemUnit = "Stück",
  suggestedQuantity = 1,
  onConfirm
}: AddQuantityDialogProps) {
  const [quantity, setQuantity] = useState(suggestedQuantity.toString())
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Bitte eine gültige Menge eingeben!")
      return
    }

    setLoading(true)
    try {
      await onConfirm(qty)
      onOpenChange(false)
      setQuantity(suggestedQuantity.toString())
    } catch (e) {
      console.error("Fehler beim Hinzufügen:", e)
      toast.error("Fehler beim Hinzufügen", { description: "Bitte erneut versuchen." })
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
            <Package className="w-5 h-5 text-primary" />
            Menge angeben
          </DialogTitle>
          <DialogDescription>
            Wie viel möchtest du zum Vorrat hinzufügen?
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
              Menge ({itemUnit})
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
              Beispiele: 1 (Stück), 500 (Gramm), 1000 (ml)
            </p>
          </div>

          {/* Schnellauswahl-Buttons */}
          <QuickSelectButtons
            unit={itemUnit}
            onSelect={(qty) => setQuantity(qty.toString())}
            disabled={loading}
          />
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
                Wird hinzugefügt...
              </>
            ) : (
              "Hinzufügen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
