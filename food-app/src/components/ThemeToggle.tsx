"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  const themes = [
    { value: "light", label: "Hell", icon: Sun },
    { value: "dark", label: "Dunkel", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Theme wechseln</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Theme auswählen</DialogTitle>
          <DialogDescription>
            Wähle dein bevorzugtes Farbschema aus.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-4">
          {themes.map((t) => {
            const Icon = t.icon
            const isActive = theme === t.value
            return (
              <Button
                key={t.value}
                variant={isActive ? "default" : "outline"}
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  setTheme(t.value)
                  setOpen(false)
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-base">{t.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
