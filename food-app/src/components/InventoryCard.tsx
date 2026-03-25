"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Clock } from "lucide-react"
import { toast } from "sonner"
import EditQuantityDialog from "./EditQuantityDialog"
import { updateInventory, removeFromInventory } from "@/app/actions/inventory"

function ExpiryBadge({ expiresAt }: { expiresAt: Date | null | undefined }) {
  if (!expiresAt) return null

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
        <Clock className="w-3 h-3" /> Abgelaufen
      </span>
    )
  }
  if (daysLeft <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
        <Clock className="w-3 h-3" /> {daysLeft === 0 ? "Heute" : `${daysLeft}d`}
      </span>
    )
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
        <Clock className="w-3 h-3" /> {daysLeft}d
      </span>
    )
  }
  return null
}

interface InventoryCardProps {
  id: string
  itemName: string
  itemUnit: string
  itemCategory?: string
  quantity: number
  expiresAt?: Date | null
}

export default function InventoryCard({
  id,
  itemName,
  itemUnit,
  itemCategory,
  quantity,
  expiresAt
}: InventoryCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEdit = async (newQuantity: number, newUnit?: string, newExpiresAt?: Date | null) => {
    await updateInventory(id, newQuantity, newUnit, newExpiresAt)
    toast.success("Vorrat aktualisiert!")
  }

  const handleDelete = async () => {
    if (confirm(`Möchtest du "${itemName}" wirklich aus dem Vorrat löschen?`)) {
      await removeFromInventory(id)
    }
  }

  return (
    <>
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{itemName}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {itemCategory || "Allgemein"}
                </p>
                <ExpiryBadge expiresAt={expiresAt} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-bold text-primary">{quantity}</span>
              <span className="text-sm text-muted-foreground ml-1">{itemUnit}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Bearbeiten
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Löschen
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditQuantityDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        itemName={itemName}
        itemUnit={itemUnit}
        currentQuantity={quantity}
        currentExpiresAt={expiresAt || null}
        onConfirm={handleEdit}
      />
    </>
  )
}
