import { useEffect, useRef } from 'react'

export default function Turnstile({ onVerify, onExpire, onError }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      onVerify?.('dev-bypass-token')
      return
    }

    let isMounted = true

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return

      try {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) onVerify?.(token)
          },
          'expired-callback': () => {
            if (isMounted) onExpire?.()
          },
          'error-callback': () => {
            if (isMounted) onError?.()
          },
          theme: 'light',
        })
      } catch (err) {
        console.error('Turnstile render error:', err)
      }
    }

    const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      existingScript.addEventListener('load', renderWidget)
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
      }
    }
  }, [siteKey])

  if (!siteKey) return null

  return (
    <div className="flex justify-center my-2 min-h-[65px] overflow-hidden">
      <div ref={containerRef} />
    </div>
  )
}

