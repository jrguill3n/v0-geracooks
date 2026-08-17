const CACHE_NAME = "gera-cooks-admin-v1"

// Install service worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  self.skipWaiting()
})

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating /service-worker.js...")
  event.waitUntil(
    (async () => {
      await clients.claim()
      console.log("[Service Worker] Activated and claimed clients", { scriptURL: self.location.href })
    })(),
  )
})

// Update the app icon badge to reflect how many notifications haven't been seen yet
async function updateAppBadge() {
  if (!("setAppBadge" in self.navigator)) return

  try {
    const notifications = await self.registration.getNotifications()
    if (notifications.length > 0) {
      await self.navigator.setAppBadge(notifications.length)
    } else {
      await self.navigator.clearAppBadge()
    }
  } catch (error) {
    console.error("[Service Worker] Error updating app badge:", error)
  }
}

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event)

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: "New Order", body: event.data.text() }
    }
  }

  const title = data.title || "New Order"
  const options = {
    body: data.body || "",
    icon: "/gera-logo.png",
    badge: "/gera-logo.png",
    vibrate: [200, 100, 200],
    tag: "new-order",
    requireInteraction: true,
    data: {
      url: data.url || "/admin",
    },
  }

  event.waitUntil(
    (async () => {
      // Uniquely tag every notification so previous unseen ones stack up
      // instead of replacing each other, which keeps the badge count accurate.
      await self.registration.showNotification(title, { ...options, tag: `${options.tag}-${Date.now()}` })
      await updateAppBadge()
    })(),
  )
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked")
  event.notification.close()

  event.waitUntil(
    (async () => {
      await updateAppBadge()
      await clients.openWindow(event.notification.data.url || "/admin")
    })(),
  )
})

// Handle notifications dismissed without being clicked (swiped away, etc.)
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification dismissed")
  event.waitUntil(updateAppBadge())
})
