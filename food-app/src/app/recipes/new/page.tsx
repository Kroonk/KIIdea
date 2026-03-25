"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Link as LinkIcon, Download } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { scrapeRecipeUrl } from "@/app/actions/scrape"

export default function NewRecipePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setLoading(true)
    const toastId = toast.loading("Rezept wird importiert...", { description: "Dies kann einen Moment dauern." })

    try {
      const res = await scrapeRecipeUrl(url)
      if (res.success && res.recipeId) {
        toast.success("Rezept erfolgreich importiert!", { id: toastId })
        router.push(`/recipes/${res.recipeId}`)
      } else {
        toast.error(res.message || "Fehler beim Importieren.", { id: toastId })
        setLoading(false)
      }
    } catch(err) {
      toast.error("Fehler aufgetreten.", { id: toastId })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-12">
      <Link href="/recipes" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zur Übersicht
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
          Neues Rezept
        </h1>
        <p className="text-muted-foreground mt-1">Füge ein neues Gericht zu deiner Sammlung hinzu.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Rezept per URL importieren
            </CardTitle>
            <CardDescription>
              Füge den Link (z.B. von Chefkoch) hier ein. Wir extrahieren die Zutaten automatisch für dich.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlImport} className="flex gap-2">
              <Input 
                placeholder="https://..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-background"
                required
                type="url"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Importieren
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oder manuell anlegen</CardTitle>
            <CardDescription>Trage die Details deines Rezepts selbst ein.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Titel</label>
                <Input placeholder="z.B. Spaghetti Bolognese" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Bild (URL)</label>
                <Input placeholder="https://..." type="url" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Beschreibung (Kurz)</label>
                <Input placeholder="Super schnell und lecker..." />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Zubereitung / Schritte</label>
                <Textarea placeholder="1. Zwiebeln anbraten..." className="min-h-[150px]" />
              </div>
              
              <div className="mt-4 border-t pt-4">
                <Button className="w-full" type="button" onClick={() => toast.info("Manuelles Speichern kommt bald!", { description: "Aktuell nur URL-Import verfügbar." })}>
                  Rezept speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
