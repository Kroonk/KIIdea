"use client"

import { useState, useEffect } from "react"
import { searchItems, addToInventory } from "@/app/actions/inventory"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Loader2 } from "lucide-react"

export default function ItemSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setItems([])
      return
    }
    
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      const res = await searchItems(query)
      setItems(res)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = async (itemId: string, itemName: string) => {
    setAddingId(itemId)
    try {
      await addToInventory(itemId, 1) // default quantity = 1
      setOpen(false)
      setQuery("")
      // In einer echten App würde man hier toast() von sonner/react-hot-toast nutzen
      // Der Kürze halber für das MVP erstmal ein Alert/Log. Wir fügen gleich einen Toast ein.
      console.log(`1x ${itemName} hinzugefügt!`)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error asChild type mismatch with local Shadcn Button */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-14 text-base border-primary/20 bg-primary/5 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          Was möchtest du hinzufügen? ...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Lebensmittel suchen (z.B. Mehl)..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && <div className="p-4 text-center text-sm text-muted-foreground flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
            {!loading && items.length === 0 && query.length >= 2 && (
              <CommandEmpty>Kein Lebensmittel gefunden.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.id, item.name)}
                    disabled={addingId !== null}
                    className="flex justify-between items-center py-3 cursor-pointer"
                  >
                    <span>
                      <span className="font-medium text-base">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs border rounded px-1.5 py-0.5">{item.category}</span>
                    </span>
                    {addingId === item.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
