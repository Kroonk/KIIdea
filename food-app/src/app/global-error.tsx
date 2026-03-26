"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error]", error)
  }, [error])

  return (
    <html lang="de">
      <body style={{ fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, background: "#fafaf9", color: "#1c1917", textAlign: "center", padding: "1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Etwas ist schiefgelaufen</h1>
        <p style={{ color: "#78716c", marginBottom: "1.5rem", maxWidth: "400px" }}>
          {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
          {error.digest && <><br /><code style={{ fontSize: "0.75rem" }}>Digest: {error.digest}</code></>}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={reset} style={{ padding: "0.5rem 1.25rem", background: "#e86c3a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
            Erneut versuchen
          </button>
          <button onClick={() => window.location.href = "/"} style={{ padding: "0.5rem 1.25rem", background: "#fff", border: "1px solid #d6d3d1", borderRadius: "6px", cursor: "pointer" }}>
            Startseite
          </button>
        </div>
      </body>
    </html>
  )
}
