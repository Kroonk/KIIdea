"use client"

import { useState } from "react"
import { exportData, importData, type BackupData } from "../actions/backup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, Database } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')

  const handleExport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const data = await exportData()

      // JSON als Download anbieten
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `foodlabs-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({
        type: 'success',
        text: `Backup erfolgreich erstellt! (${data.items.length} Artikel, ${data.inventory.length} Vorräte, ${data.recipes.length} Rezepte)`
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Erstellen des Backups: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)

    try {
      const text = await file.text()
      const data: BackupData = JSON.parse(text)

      const result = await importData(data, importMode)

      setMessage({
        type: 'success',
        text: `Import erfolgreich! (${result.stats.items} Artikel, ${result.stats.inventory} Vorräte, ${result.stats.recipes} Rezepte)`
      })

      // Seite neu laden nach erfolgreichem Import
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Importieren: ' + (error instanceof Error ? error.message : 'Ungültige Datei')
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Backup & Restore</h1>
          <p className="text-muted-foreground">Sichere deine Daten oder stelle sie wieder her</p>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Daten exportieren
          </CardTitle>
          <CardDescription>
            Erstelle ein Backup aller Artikel, Vorräte und Rezepte als JSON-Datei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Backup wird erstellt...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Backup jetzt erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Daten importieren
          </CardTitle>
          <CardDescription>
            Stelle ein Backup aus einer JSON-Datei wieder her
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={importMode} onValueChange={(v: string) => setImportMode(v as 'merge' | 'replace')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge" className="font-normal cursor-pointer">
                <span className="font-medium">Zusammenführen</span> - Bestehende Daten behalten und neue hinzufügen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace" />
              <Label htmlFor="replace" className="font-normal cursor-pointer">
                <span className="font-medium text-destructive">Ersetzen</span> - Alle bestehenden Daten löschen (⚠️ Vorsicht!)
              </Label>
            </div>
          </RadioGroup>

          <div>
            <input
              type="file"
              id="backup-file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              className="hidden"
            />
            <Label
              htmlFor="backup-file"
              className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-base font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Import läuft...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Backup-Datei auswählen
                </>
              )}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Hinweise */}
      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-base">Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Erstelle regelmäßig Backups vor Updates</li>
            <li>Backup-Dateien enthalten alle Daten im JSON-Format</li>
            <li>Im <strong>Merge-Modus</strong> werden bestehende Einträge mit gleicher ID aktualisiert</li>
            <li>Im <strong>Replace-Modus</strong> werden ALLE Daten gelöscht und durch das Backup ersetzt</li>
            <li>Nach einem erfolgreichen Import wird die Seite automatisch neu geladen</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
