"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { deductIngredients } from "@/app/actions/cook"
import { Loader2, Utensils } from "lucide-react"

export default function CookRecipeDialog({ recipe, availableIngredients }: { recipe: any, availableIngredients: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // By default, select all available ingredients to deduct
  const [selectedIds, setSelectedIds] = useState<string[]>(
    availableIngredients.map(ing => ing.id)
  )

  const toggleIngredient = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleCook = async () => {
    setLoading(true)
    const itemsToDeduct = availableIngredients
      .filter(ing => selectedIds.includes(ing.id))
      .map(ing => ({ itemId: ing.itemId, quantity: ing.quantity }))
      
    await deductIngredients(itemsToDeduct)
    
    setLoading(false)
    setOpen(false)
    alert("Guten Appetit! Zutaten wurden vom Vorrat abgezogen.")
  }

  return (
    <>
      <Button className="w-full font-bold" onClick={() => setOpen(true)}>
        <Utensils className="w-4 h-4 mr-2" />
        Kochen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mahlzeit zubereiten</DialogTitle>
          <DialogDescription>
            Welche der folgenden Zutaten für <b>{recipe.title}</b> sollen aus deinem Vorrat abgezogen werden?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4 max-h-[50vh] overflow-y-auto">
          {availableIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Du hast für dieses Rezept leider noch keine passenden Zutaten im digitalen Vorrat.</p>
          ) : (
            availableIngredients.map((ing) => (
              <div key={ing.id} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox 
                  id={`ing-${ing.id}`} 
                  checked={selectedIds.includes(ing.id)}
                  onCheckedChange={() => toggleIngredient(ing.id)}
                />
                <label 
                  htmlFor={`ing-${ing.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                >
                  {ing.item.name}
                  <span className="text-muted-foreground block text-xs mt-1">
                    {ing.quantity} {ing.unit || ing.item.unit}
                  </span>
                </label>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="sm:justify-between flex-row">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleCook} disabled={loading || availableIngredients.length === 0}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Bestätigen & Abziehen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
