"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary text-primary-foreground" : "bg-background",
          className
        )}
        {...props}
      >
        {checked && (
          <Check className="h-3 w-3" />
        )}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
