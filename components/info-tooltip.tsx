"use client"

import { Info } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface InfoTooltipProps {
  description: string
  itemName: string
  price: number
}

export function InfoTooltip({ description, itemName, price }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const displayDescription = description || "No description available yet. Add one in the admin panel."

  return (
    <>
      {/* Desktop: Hover Tooltip */}
      <div className="hidden md:inline-block">
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
      </div>

      {/* Mobile: Click to open modal */}
      <div className="inline-block md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-2 inline-flex items-center active:opacity-70 transition-opacity"
        >
          <Info className="h-4 w-4 text-primary/70" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 gap-0">
          <DialogHeader className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 p-6 rounded-t-3xl">
            <DialogTitle className="text-white text-2xl font-bold">{itemName}</DialogTitle>
            <p className="text-white/90 text-xl font-bold mt-2">${price}</p>
          </DialogHeader>
          <div className="p-6">
            <p className="text-foreground/80 leading-relaxed">{displayDescription}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
