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
  const [notificationError, setNotificationError] = useState<string | null>(null)

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

    // Clear the app icon badge once the admin actually sees the app. Without
    // this, notifications marked "seen" in the banner never clear the badge.
    const clearAppBadge = async () => {
      if (!("serviceWorker" in navigator)) return

      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (!registration) return

        // Dismiss any lingering notifications so they no longer count as unseen
        const notifications = await registration.getNotifications()
        notifications.forEach((notification) => notification.close())

        if ("clearAppBadge" in navigator) {
          await (navigator as any).clearAppBadge()
        }
      } catch (error) {
        console.error("[PWA] Error clearing app badge:", error)
      }
    }

    if (document.visibilityState === "visible") {
      clearAppBadge()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearAppBadge()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", clearAppBadge)

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
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", clearAppBadge)
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
    setNotificationError(null)
    const fail = (stage: string, message: string) => {
      console.error(`[PWA] ${stage}: ${message}`)
      setNotificationError(message)
      alert(message)
    }

    if (!("Notification" in window)) {
      fail("Notification API", "Notifications are not supported in this browser")
      return
    }

    if (!("serviceWorker" in navigator)) {
      fail("Service worker", "Service workers are not supported")
      return
    }

    try {
      console.log("[PWA] Requesting notification permission", { permission: Notification.permission })
      const permission = await Notification.requestPermission()
      console.log("[PWA] Notification permission result", { permission })

      if (permission !== "granted") {
        fail("Permission", "Notification permission was not granted")
        return
      }

      const registration = await navigator.serviceWorker.ready
      console.log("[PWA] Service worker ready", {
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL,
        controllingScriptURL: navigator.serviceWorker.controller?.scriptURL,
      })

      if (!registration.active?.scriptURL.endsWith("/service-worker.js")) {
        fail("Service worker", "The active service worker is not /service-worker.js")
        return
      }

      if (!("pushManager" in registration) || !registration.pushManager) {
        fail("Push support", "Push notifications are not supported")
        return
      }

      if (!VAPID_PUBLIC_KEY) {
        console.error("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing")
        fail("VAPID key", "VAPID key missing")
        return
      }

      let applicationServerKey: Uint8Array
      try {
        applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        if (applicationServerKey.length !== 65 || applicationServerKey[0] !== 4) {
          throw new Error(`Expected an uncompressed 65-byte public key, received ${applicationServerKey.length} bytes`)
        }
        console.log("[PWA] VAPID public key validated", { byteLength: applicationServerKey.length })
      } catch (error) {
        console.error("[PWA] VAPID key validation failed", error)
        fail("VAPID key", "VAPID key invalid")
        return
      }

      let subscription = await registration.pushManager.getSubscription()
      console.log("[PWA] Existing push subscription inspected", {
        exists: Boolean(subscription),
        endpoint: subscription?.endpoint,
      })

      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })
          console.log("[PWA] PushManager.subscribe succeeded", { endpoint: subscription.endpoint })
        } catch (error) {
          console.error("[PWA] PushManager.subscribe failed", {
            name: error instanceof Error ? error.name : "UnknownError",
            message: error instanceof Error ? error.message : String(error),
          })
          fail("Push subscription", "Push subscription failed")
          return
        }
      } else {
        console.log("[PWA] Reusing existing push subscription")
      }

      const response = await fetch("/api/subscribe-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
      const responseBody = await response.text()
      console.log("[PWA] /api/subscribe-push response", { status: response.status, body: responseBody })

      if (!response.ok) {
        fail("Save subscription", "Failed to save subscription")
        return
      }

      setNotificationsEnabled(true)
      console.log("[PWA] Push subscription successful")
    } catch (error) {
      console.error("[PWA] Error enabling notifications", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
        error,
      })
      fail("Push setup", "Failed to enable notifications")
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
              {notificationError && <p className="mb-3 text-sm font-medium text-destructive">{notificationError}</p>}
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
