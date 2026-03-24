import { getInventory } from "@/app/actions/inventory"
import { Card, CardContent } from "@/components/ui/card"
import { Refrigerator } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const inventory = await getInventory()

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          <Refrigerator className="w-8 h-8" />
          Mein Vorrat
        </h1>
        <p className="text-muted-foreground mt-1">Hier siehst du, was aktuell im Kühlschrank oder der Vorratskammer ist.</p>
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
            <Card key={inv.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{inv.item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {inv.item.category || "Allgemein"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{inv.quantity}</span>
                  <span className="text-sm text-muted-foreground ml-1">{inv.item.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
