/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Precache all build assets injected by vite-plugin-pwa
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Push notification display handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: { title: string; body: string; url?: string; icon?: string }
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'ActuallyDo', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/pwa-192x192.png',
      data: { url: payload.url ?? '/' },
    }),
  )
})

// Click-to-open routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if one is open
        for (const client of clients) {
          if (new URL(client.url).pathname === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url)
      }),
  )
})
