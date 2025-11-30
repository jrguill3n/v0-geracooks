"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// VAPID public key - must match server
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

export function PWAInstaller() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration)
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error)
        })
    }

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isStandalone) {
      console.log("[PWA] Running in standalone mode")
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check notification permission
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("[PWA] App installed")
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications")
      return
    }

    if (!("serviceWorker" in navigator)) {
      alert("Service workers not supported")
      return
    }

    try {
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        alert("Notification permission denied")
        return
      }

      setNotificationsEnabled(true)

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check if push is supported
      if (!("pushManager" in registration)) {
        alert("Push notifications not supported")
        return
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Send subscription to server
      const response = await fetch("/api/subscribe-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      console.log("[PWA] Push subscription successful")
    } catch (error) {
      console.error("[PWA] Error enabling notifications:", error)
      alert("Failed to enable notifications. Please try again.")
    }
  }

  return (
    <>
      {showInstallPrompt && (
        <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 shadow-xl border-2 border-primary/20 bg-white z-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1">Install Admin App</h3>
              <p className="text-sm text-foreground/60 mb-3">
                Add GERA COOKS Admin to your home screen for quick access
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstallClick} size="sm" className="flex-1">
                  Install
                </Button>
                <Button onClick={() => setShowInstallPrompt(false)} size="sm" variant="outline">
                  Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!notificationsEnabled && (
        <Card className="mb-4 p-4 border-warning/20 bg-warning/5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1">Enable Push Notifications</h3>
              <p className="text-sm text-foreground/60 mb-3">Get instant alerts even when the app is closed</p>
              <Button onClick={handleEnableNotifications} size="sm" variant="default">
                Enable Notifications
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
