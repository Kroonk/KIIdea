"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import EditQuantityDialog from "./EditQuantityDialog"
import { updateInventory, removeFromInventory } from "@/app/actions/inventory"

interface InventoryCardProps {
  id: string
  itemName: string
  itemUnit: string
  itemCategory?: string
  quantity: number
}

export default function InventoryCard({
  id,
  itemName,
  itemUnit,
  itemCategory,
  quantity
}: InventoryCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEdit = async (newQuantity: number) => {
    await updateInventory(id, newQuantity)
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
              <p className="text-sm text-muted-foreground">
                {itemCategory || "Allgemein"}
              </p>
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
        onConfirm={handleEdit}
      />
    </>
  )
}
