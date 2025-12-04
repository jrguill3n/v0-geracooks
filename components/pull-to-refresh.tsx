"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"

export function PullToRefresh() {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const threshold = 100 // Distance to pull before refresh triggers
  const maxPullDistance = 140 // Maximum visual pull distance

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when scrolled to the top
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return

      const touchY = e.touches[0].clientY
      const distance = touchY - touchStartY.current

      // Only allow pulling down with damping effect for smooth feel
      if (distance > 0 && window.scrollY === 0) {
        const dampingFactor = 0.5
        const dampenedDistance = Math.pow(distance, dampingFactor) * 10
        setPullDistance(Math.min(dampenedDistance, maxPullDistance))

        // Prevent default scroll behavior during pull
        if (distance > 5) {
          e.preventDefault()
        }
      } else if (distance < 0) {
        isPulling.current = false
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return

      isPulling.current = false

      if (pullDistance >= threshold) {
        setIsRefreshing(true)

        // Trigger refresh
        await router.refresh()

        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
        }, 800)
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
  }, [pullDistance, router, isRefreshing])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = isRefreshing ? 0 : progress * 180

  const shouldShow = pullDistance > 20 || isRefreshing

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-start pointer-events-none"
      style={{
        transform: `translateY(${isRefreshing ? 70 : pullDistance * 0.6}px)`,
        transition: isPulling.current ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className="bg-primary rounded-full p-4 shadow-2xl"
        style={{
          opacity: shouldShow ? Math.min(progress, 1) : 0,
          transform: `scale(${shouldShow ? Math.min(0.7 + progress * 0.3, 1) : 0.5})`,
          transition: isPulling.current
            ? "opacity 0.15s ease, transform 0.15s ease"
            : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <svg
          className="w-7 h-7 text-white"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isRefreshing ? "none" : "transform 0.2s ease-out",
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

      {pullDistance >= threshold && !isRefreshing && (
        <div
          className="mt-3 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-sm font-semibold text-primary"
          style={{
            opacity: progress >= 1 ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          Release to refresh
        </div>
      )}
    </div>
  )
}
