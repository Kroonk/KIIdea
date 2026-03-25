import { requireAdmin, getUsers } from "@/app/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import UserManagement from "./UserManagement"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  await requireAdmin()
  const users = await getUsers()

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            Administration
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Benutzer verwalten und Systemeinstellungen.</p>
        </div>
        <Link href="/backup">
          <Button variant="outline" size="sm">Backup & Restore</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Benutzer ({users.length})
          </CardTitle>
          <CardDescription>Verwalte Benutzerkonten und Rollen.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
