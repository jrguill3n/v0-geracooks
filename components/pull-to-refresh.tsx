"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"

export function PullToRefresh() {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)

  const threshold = 80 // Distance to pull before refresh triggers

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when scrolled to the top
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return

      const touchY = e.touches[0].clientY
      const distance = touchY - touchStartY.current

      // Only allow pulling down
      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance, threshold + 50))
        // Prevent default scroll behavior during pull
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return

      isPulling.current = false

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        // Trigger refresh
        router.refresh()
        // Keep the spinner visible for at least 1 second
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
        }, 1000)
      } else {
        setPullDistance(0)
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [pullDistance, router])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform duration-200"
      style={{
        transform: `translateY(${isRefreshing ? 60 : Math.min(pullDistance - 40, 0)}px)`,
      }}
    >
      <div
        className="bg-primary/90 backdrop-blur-sm rounded-full p-3 shadow-lg transition-opacity duration-200"
        style={{
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <svg
          className="w-6 h-6 text-white transition-transform duration-200"
          style={{
            transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isRefreshing ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="animate-spin origin-center"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          )}
        </svg>
      </div>
      {pullDistance >= threshold && !isRefreshing && (
        <div className="absolute top-20 text-sm font-semibold text-primary">Release to refresh</div>
      )}
    </div>
  )
}
