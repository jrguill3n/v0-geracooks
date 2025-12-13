"use client"
import { cn } from "@/lib/utils"

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function SegmentedControl({ value, onValueChange, options, className }: SegmentedControlProps) {
  return (
    <div className={cn("inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1", className)} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
            value === option.value ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
