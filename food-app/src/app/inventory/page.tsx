import { getInventory } from "@/app/actions/inventory"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Refrigerator, Plus, Database } from "lucide-react"
import Link from "next/link"
import InventoryCard from "@/components/InventoryCard"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const inventory = await getInventory()

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <Refrigerator className="w-8 h-8" />
            Mein Vorrat
          </h1>
          <p className="text-muted-foreground mt-1">Hier siehst du, was aktuell im Kühlschrank oder der Vorratskammer ist.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/backup">
            <Button variant="outline" size="icon" className="shrink-0" title="Backup & Restore">
              <Database className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/add">
            <Button className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </Link>
        </div>
      </div>

      {inventory.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Refrigerator className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">Dein Vorrat ist leer!</p>
            <p className="text-sm text-muted-foreground mt-1">Füge Lebensmittel hinzu, um Rezepte vorgeschlagen zu bekommen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((inv) => (
            <InventoryCard
              key={inv.id}
              id={inv.id}
              itemName={inv.item.name}
              itemUnit={inv.item.unit}
              itemCategory={inv.item.category || undefined}
              quantity={inv.quantity}
            />
          ))}
        </div>
      )}
    </div>
  )
}
