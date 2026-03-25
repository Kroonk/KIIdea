"use client"

import { useState } from "react"
import { Menu, User, KeyRound, Shield, Database, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ThemeToggle } from "./ThemeToggle"
import { logout } from "@/app/actions/auth"

export default function UserMenu({ username, isAdmin }: { username?: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error asChild type mismatch with local Shadcn Button */}
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Menü" aria-label="Menü öffnen">
          <Menu className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-52 p-0 overflow-hidden">
        {/* User Info Header */}
        <div className="px-3 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{username}</span>
          {isAdmin && (
            <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full ml-auto shrink-0">
              Admin
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="py-1">
          <Link
            href="/profile"
            onClick={close}
            className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            Profil & Passwort
          </Link>

          {isAdmin && (
            <>
              <Link
                href="/admin"
                onClick={close}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
                Administration
              </Link>
              <Link
                href="/backup"
                onClick={close}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Database className="w-4 h-4 text-muted-foreground" />
                Backup & Restore
              </Link>
            </>
          )}
        </div>

        {/* Theme & Logout */}
        <div className="border-t py-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">Erscheinungsbild</span>
          </div>

          <form action={logout} className="px-1 mt-0.5">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
