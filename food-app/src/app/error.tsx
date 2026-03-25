"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Etwas ist schiefgelaufen</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Erneut versuchen</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Zur Startseite
        </Button>
      </div>
    </div>
  )
}
