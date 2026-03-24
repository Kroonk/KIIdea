"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  name?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, ...props }, ref) => {
    const generatedName = React.useId()
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name: name || generatedName }}>
        <div className={cn("grid gap-2", className)} {...props} ref={ref} />
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")

    const isChecked = context.value === value

    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="radio"
          name={context.name}
          value={value}
          checked={isChecked}
          onChange={() => context.onValueChange(value)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
            className
          )}
        >
          {isChecked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
