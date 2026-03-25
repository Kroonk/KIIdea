"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Refrigerator, BookOpen, PlusCircle, Shield, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { logout } from "@/app/actions/auth"
import { Button } from "./ui/button"

const navItems = [
  { href: "/", label: "Start", icon: Home },
  { href: "/inventory", label: "Vorrat", icon: Refrigerator },
  { href: "/add", label: "Hinzufügen", icon: PlusCircle },
  { href: "/recipes", label: "Rezepte", icon: BookOpen },
]

export default function Navigation({ username, isAdmin }: { username?: string; isAdmin?: boolean }) {
  const pathname = usePathname()

  // Don't show nav on login/register pages
  if (pathname === "/login" || pathname === "/register") return null

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary tracking-tight">Foodlabs</span>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-1 ml-4 pl-4 border-l">
            {username && (
              <span className="text-sm text-muted-foreground mr-2">{username}</span>
            )}
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" title="Abmelden">
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  )
}
