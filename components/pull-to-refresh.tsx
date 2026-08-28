"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"

const THRESHOLD = 80 // Distance (px) the indicator must travel before refresh triggers
const MAX_PULL = 120 // Maximum visual travel of the indicator

export function PullToRefresh() {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refs hold the live gesture state so the touch listeners can stay attached
  // once for the component's lifetime instead of re-subscribing every frame.
  const startY = useRef(0)
  const startX = useRef(0)
  const isPulling = useRef(false)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  const setPull = useCallback((distance: number) => {
    pullRef.current = distance
    setPullDistance(distance)
  }, [])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only arm the gesture when the page is scrolled to the very top.
      if (window.scrollY > 0 || refreshingRef.current) return
      startY.current = e.touches[0].clientY
      startX.current = e.touches[0].clientX
      isPulling.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return

      const dy = e.touches[0].clientY - startY.current
      const dx = e.touches[0].clientX - startX.current

      // Cancel if the gesture is mostly horizontal (carousel/swipe) or upward.
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        isPulling.current = false
        if (pullRef.current !== 0) setPull(0)
        return
      }

      if (window.scrollY > 0) {
        isPulling.current = false
        if (pullRef.current !== 0) setPull(0)
        return
      }

      // Rubber-band resistance: the further you pull, the slower it moves.
      const resisted = MAX_PULL * (1 - Math.exp(-dy / MAX_PULL))
      setPull(resisted)

      // Prevent the browser's native overscroll/refresh once we've committed.
      if (dy > 6 && e.cancelable) e.preventDefault()
    }

    const handleTouchEnd = () => {
      if (!isPulling.current) return
      isPulling.current = false

      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true
        setIsRefreshing(true)
        setPull(THRESHOLD)

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10)
        }

        router.refresh()

        // router.refresh() resolves before the server components finish
        // streaming, so hold the spinner briefly for a stable feel.
        window.setTimeout(() => {
          refreshingRef.current = false
          setIsRefreshing(false)
          setPull(0)
        }, 700)
      } else {
        setPull(0)
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [router, setPull])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const rotation = isRefreshing ? 0 : progress * 270
  const shouldShow = pullDistance > 4 || isRefreshing
  const armed = progress >= 1

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-start pointer-events-none"
      style={{
        transform: `translateY(${isRefreshing ? 64 : pullDistance * 0.7}px)`,
        transition: isPulling.current ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      aria-hidden={!shouldShow}
    >
      <div
        className="bg-primary rounded-full p-3.5 shadow-2xl"
        style={{
          opacity: shouldShow ? Math.max(progress, isRefreshing ? 1 : 0.25) : 0,
          transform: `scale(${shouldShow ? Math.min(0.6 + progress * 0.4, 1) : 0.5})`,
          transition: isPulling.current
            ? "opacity 0.12s ease, transform 0.12s ease"
            : "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <svg
          className="w-6 h-6 text-white"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isRefreshing || isPulling.current ? "none" : "transform 0.2s ease-out",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            className={isRefreshing ? "animate-spin origin-center" : ""}
          />
        </svg>
      </div>

      {armed && !isRefreshing && (
        <div className="mt-2.5 px-3.5 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full text-xs font-semibold text-primary">
          Release to refresh
        </div>
      )}
    </div>
  )
}
