"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InfoTooltipProps {
  description: string
}

export function InfoTooltip({ description }: InfoTooltipProps) {
  const displayDescription = description || "No description available yet. Add one in the admin panel."

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="ml-2 inline-flex items-center hover:opacity-70 transition-opacity">
            <Info className="h-4 w-4 text-primary/70" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-primary text-white border-0 shadow-lg rounded-xl p-3">
          <p className="text-sm leading-relaxed">{displayDescription}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
