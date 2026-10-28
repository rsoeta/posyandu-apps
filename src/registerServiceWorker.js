// Helper to register Service Worker and handle updates
export function registerServiceWorker(onUpdateAvailable) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope)

          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (!installingWorker) return

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] Konten baru tersedia; silakan muat ulang.')
                  if (typeof onUpdateAvailable === 'function') {
                    onUpdateAvailable(registration)
                  }
                } else {
                  console.log('[PWA] Konten telah disimpan untuk penggunaan offline.')
                }
              }
            }
          }
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error)
        })
    })
  }
}

