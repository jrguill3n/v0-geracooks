"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollHintAreaProps {
  children: React.ReactNode
  className?: string
  label?: string
}

export function ScrollHintArea({ children, className, label = "Scroll for more" }: ScrollHintAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  const updateHint = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [])

  useEffect(() => {
    updateHint()
    const observer = new ResizeObserver(updateHint)
    if (scrollRef.current) observer.observe(scrollRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [updateHint])

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.7, behavior: "smooth" })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={updateHint} className={cn("flex-1 overflow-y-auto", className)}>
        <div ref={contentRef}>{children}</div>
      </div>
      {hasMoreBelow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-white via-white/80 to-transparent pb-1.5">
          <button
            type="button"
            onClick={scrollDown}
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-md"
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
