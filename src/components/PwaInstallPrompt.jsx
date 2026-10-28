import { useState, useEffect } from 'react'
import { DownloadSimple, X, ArrowSquareOut, WifiSlash, ArrowsClockwise } from '@phosphor-icons/react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    // Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
      return isStandaloneMode
    }

    const inStandalone = checkStandalone()

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Handle BeforeInstallPrompt event (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Check if user dismissed previously within last 3 days
      const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at')
      if (dismissedAt) {
        const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
        if (diffDays < 3) return
      }

      if (!inStandalone) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle App Installed event
    const handleAppInstalled = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
      setIsStandalone(true)
      console.log('[PWA] Aplikasi berhasil dipasang')
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // Online / Offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for PWA updates
    const handleUpdate = (e) => {
      if (e.detail?.registration?.waiting) {
        setWaitingWorker(e.detail.registration.waiting)
      }
      setUpdateAvailable(true)
    }
    window.addEventListener('pwa-update-available', handleUpdate)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('pwa-update-available', handleUpdate)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('[PWA] Pengguna menyetujui instalasi PWA')
    } else {
      console.log('[PWA] Pengguna menolak instalasi PWA')
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString())
  }

  const handleReloadUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return (
    <>
      {/* Offline Status Bar */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs md:text-sm font-medium py-1.5 px-4 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm animate-pulse">
          <WifiSlash size={16} weight="bold" />
          <span>Mode Offline: Terputus dari internet. Anda tetap dapat menjelajahi data tersimpan.</span>
        </div>
      )}

      {/* New Version Update Banner */}
      {updateAvailable && (
        <div className="bg-purple text-white text-xs md:text-sm py-2 px-4 flex items-center justify-between gap-3 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <ArrowsClockwise size={18} className="animate-spin" />
            <span>Versi baru Posyandu Ceria tersedia!</span>
          </div>
          <button
            onClick={handleReloadUpdate}
            className="bg-white text-purple text-xs font-bold px-3 py-1 rounded-lg hover:bg-purple-50 transition cursor-pointer"
          >
            Perbarui Sekarang
          </button>
        </div>
      )}

      {/* Install Prompt Banner (Android/Chrome/Edge) */}
      {showPrompt && !isStandalone && deferredPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-white border border-purple-200 shadow-2xl rounded-2xl p-4 transition-all duration-300">
          <div className="flex items-start gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Logo Posyandu Ceria"
              className="w-12 h-12 rounded-xl shadow-sm object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-gray-900 text-sm">
                  Pasang Posyandu Ceria
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                Pasang di HP atau Komputer Anda untuk akses cepat, ringan, dan bisa dibuka saat offline!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple to-pink text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-sm hover:opacity-95 transition cursor-pointer"
                >
                  <DownloadSimple size={15} weight="bold" />
                  Pasang Aplikasi
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-500 hover:text-gray-800 py-2 px-3 font-medium cursor-pointer"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Add to Home Screen Hint (Only show on first visit on iOS Safari if not installed) */}
      {isIOS && !isStandalone && showPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:max-w-md z-40 bg-white border border-purple-200 shadow-2xl rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-192.png" alt="Posyandu Ceria" className="w-10 h-10 rounded-xl" />
              <div>
                <h4 className="font-heading font-bold text-gray-900 text-sm">Pasang di iPhone / iPad</h4>
                <p className="text-xs text-gray-500">Jadikan aplikasi di layar utama</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 p-1 cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-600 mt-2.5 space-y-1 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
            <p className="flex items-center gap-1.5 font-medium text-purple">
              1. Ketuk tombol <ArrowSquareOut size={16} /> (Bagikan / Share) di Safari.
            </p>
            <p className="font-medium text-purple">
              2. Gulir ke bawah lalu pilih <strong>'Tambah ke Layar Utama' (Add to Home Screen)</strong>.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

