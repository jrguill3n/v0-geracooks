const CACHE_NAME = "gera-cooks-admin-v1"

// Install service worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  self.skipWaiting()
})

// Activate service worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")
  event.waitUntil(clients.claim())
})

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

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked")
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url || "/admin"))
})
