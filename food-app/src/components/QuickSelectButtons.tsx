"use client"

import { Button } from "@/components/ui/button"

interface QuickSelectButtonsProps {
  unit: string
  onSelect: (quantity: number) => void
  disabled?: boolean
}

export default function QuickSelectButtons({ unit, onSelect, disabled }: QuickSelectButtonsProps) {
  const isGramm = unit.toLowerCase().includes("gramm")

  return (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 5, 10].map((qty) => (
        <Button
          key={qty}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(qty)}
          disabled={disabled}
        >
          {qty}
        </Button>
      ))}
      {isGramm && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => onSelect(500)} disabled={disabled}>
            500g
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onSelect(1000)} disabled={disabled}>
            1kg
          </Button>
        </>
      )}
    </div>
  )
}
