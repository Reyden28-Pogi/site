import { useEffect, useRef } from 'react'

/**
 * Thin wrapper around Cloudflare Turnstile's script-tag widget (loaded in
 * index.html). Calls onVerify(token) once the visitor completes the
 * challenge, and onExpire() if the token expires before the form submits.
 */
export default function TurnstileWidget({ onVerify, onExpire }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) return

    let cancelled = false

    function render() {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
      })
    }

    if (window.turnstile) {
      render()
    } else {
      // Script tag is `async defer` in index.html — poll briefly until it's ready.
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          render()
        }
      }, 100)
      return () => clearInterval(interval)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) {
    return (
      <p className="text-xs text-ink/40">
        Captcha not configured — set VITE_TURNSTILE_SITE_KEY to enable spam protection.
      </p>
    )
  }

  return <div ref={containerRef} />
}
