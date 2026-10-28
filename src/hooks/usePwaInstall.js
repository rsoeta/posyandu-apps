import { useState, useEffect } from 'react'

let globalDeferredPrompt = null

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(standalone)
      return standalone
    }

    const inStandalone = checkStandalone()

    if (globalDeferredPrompt && !inStandalone) {
      setCanInstall(true)
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      globalDeferredPrompt = e
      if (!inStandalone) {
        setCanInstall(true)
      }
    }

    const handleAppInstalled = () => {
      globalDeferredPrompt = null
      setCanInstall(false)
      setIsStandalone(true)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async () => {
    if (!globalDeferredPrompt) return false
    globalDeferredPrompt.prompt()
    const { outcome } = await globalDeferredPrompt.userChoice
    globalDeferredPrompt = null
    setCanInstall(false)
    return outcome === 'accepted'
  }

  return { canInstall, isStandalone, isOffline, installApp }
}

