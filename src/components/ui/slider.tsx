"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, disabled = false, className, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const sliderRef = React.useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return
      setIsDragging(true)
      updateValue(e)
    }

    const updateValue = React.useCallback((e: MouseEvent | React.MouseEvent) => {
      if (!sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newValue = min + percentage * (max - min)
      const steppedValue = Math.round(newValue / step) * step
      const clampedValue = Math.max(min, Math.min(max, steppedValue))

      onValueChange([clampedValue])
    }, [min, max, step, onValueChange])

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isDragging || disabled) return
      updateValue(e)
    }, [isDragging, disabled, updateValue])

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false)
    }, [])

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const percentage = ((value[0] - min) / (max - min)) * 100

    return (
      <div
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <div
          ref={sliderRef}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:bg-accent"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
