"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteUser, toggleUserRole } from "@/app/actions/auth"
import { Shield, ShieldOff, Trash2, Loader2 } from "lucide-react"

interface User {
  id: string
  username: string
  role: string
  createdAt: Date
}

export default function UserManagement({ users }: { users: User[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleToggleRole = async (userId: string) => {
    setLoading(userId)
    setError("")
    const result = await toggleUserRole(userId)
    if (result?.error) setError(result.error)
    setLoading(null)
  }

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Benutzer "${username}" wirklich löschen? Alle Daten werden entfernt.`)) return
    setLoading(userId)
    setError("")
    const result = await deleteUser(userId)
    if (result?.error) setError(result.error)
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
      )}
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Administrator" : "Benutzer"} · seit {new Date(user.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleRole(user.id)}
              disabled={loading === user.id}
              title={user.role === "admin" ? "Zum Benutzer machen" : "Zum Admin machen"}
            >
              {loading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : user.role === "admin" ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(user.id, user.username)}
              disabled={loading === user.id}
              className="text-destructive hover:text-destructive"
              title="Benutzer löschen"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
