"use client"

import { useState } from "react"
import { login } from "@/app/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ChefHat } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError("")
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ChefHat className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Foodlabs</CardTitle>
          <CardDescription>Melde dich an, um fortzufahren.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">Benutzername</label>
              <Input id="username" name="username" required autoFocus autoComplete="username" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">Passwort</label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Anmelden
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Noch kein Konto?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
