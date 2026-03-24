import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle, ScanBarcode } from "lucide-react"
import ItemSearch from "@/components/ItemSearch"
import BarcodeScannerWrapper from "./BarcodeScannerWrapper"

export const dynamic = "force-dynamic"

export default function AddFoodPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          <PlusCircle className="w-8 h-8" />
          Hinzufügen
        </h1>
        <p className="text-muted-foreground mt-1">Lebensmittel zum Vorrat hinzufügen.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle>Suchen & Hinzufügen</CardTitle>
            <CardDescription>Suche nach einem Lebensmittel, um es dem Vorrat hinzuzufügen.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemSearch />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-primary" />
              Barcode Scanner
            </CardTitle>
            <CardDescription>Scanne die EAN auf der Verpackung. Unbekannte Produkte werden via OpenFoodFacts gesucht.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarcodeScannerWrapper />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
