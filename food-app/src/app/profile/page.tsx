import { requireAuth } from "@/app/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, KeyRound } from "lucide-react"
import ChangePasswordForm from "./ChangePasswordForm"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const user = await requireAuth()

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
          <User className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
          Profil
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Deine Kontoeinstellungen verwalten.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Kontoinformationen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Benutzername</span>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rolle</span>
              <span className="text-sm font-medium">{user.role === "admin" ? "Administrator" : "Benutzer"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>Gib dein aktuelles Passwort ein und wähle ein neues.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
