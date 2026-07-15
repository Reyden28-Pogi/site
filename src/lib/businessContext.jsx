import { createContext, useContext, useEffect, useState } from 'react'

const BusinessContext = createContext(null)

/**
 * Loads the `businesses` row for VITE_BUSINESS_SLUG once, on app boot, and
 * makes it available to the whole public site. Also injects the
 * business's primary/secondary/tertiary colors and heading/body font
 * pairing as CSS custom properties, so Tailwind's `brand`/`secondary`/
 * `tertiary` colors and `font-display`/`font-body` classes track the
 * current tenant with zero per-client code changes.
 */
export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const slug = import.meta.env.VITE_BUSINESS_SLUG

    if (!slug) {
      setError(
        'VITE_BUSINESS_SLUG is not set. Each public-site deployment needs this env var pointed at a business slug.'
      )
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-business?slug=${encodeURIComponent(slug)}`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } }
      )

      if (cancelled) return

      if (!res.ok) {
        setError(`No active business found for slug "${slug}".`)
        setLoading(false)
        return
      }

      const { business: data } = await res.json()
      setBusiness(data)
      applyTheme(data)
      applyFonts(data)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <BusinessContext.Provider value={{ business, loading, error }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used within a BusinessProvider')
  return ctx
}

/** Derives light/dark shades from each base hex and sets CSS variables
 * (as space-separated RGB channels — see index.css for why). */
function applyTheme(business) {
  const root = document.documentElement
  if (business.theme_color) {
    root.style.setProperty('--brand', hexToChannels(business.theme_color))
    root.style.setProperty('--brand-light', hexToChannels(shade(business.theme_color, 0.25)))
    root.style.setProperty('--brand-dark', hexToChannels(shade(business.theme_color, -0.2)))
  }
  if (business.secondary_color) {
    root.style.setProperty('--secondary', hexToChannels(business.secondary_color))
    root.style.setProperty('--secondary-light', hexToChannels(shade(business.secondary_color, 0.25)))
    root.style.setProperty('--secondary-dark', hexToChannels(shade(business.secondary_color, -0.2)))
  }
  if (business.tertiary_color) {
    root.style.setProperty('--tertiary', hexToChannels(business.tertiary_color))
    root.style.setProperty('--tertiary-light', hexToChannels(shade(business.tertiary_color, 0.25)))
    root.style.setProperty('--tertiary-dark', hexToChannels(shade(business.tertiary_color, -0.2)))
  }
}

/**
 * index.html always loads Fraunces + Inter as a baseline (covers the admin
 * panels, which aren't wrapped in BusinessProvider, and the default font
 * pairing). If a business picked a different pairing, this injects one
 * additional Google Fonts stylesheet for just those families, and points
 * the --font-display/--font-body CSS variables at them.
 */
function applyFonts(business) {
  const headingFont = business.heading_font || 'Fraunces'
  const bodyFont = business.body_font || 'Inter'
  const root = document.documentElement

  root.style.setProperty('--font-display', `'${headingFont}'`)
  root.style.setProperty('--font-body', `'${bodyFont}'`)

  const isDefaultPairing = headingFont === 'Fraunces' && bodyFont === 'Inter'
  if (isDefaultPairing) return // already loaded by index.html

  const families = [...new Set([headingFont, bodyFont])]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  const linkId = 'dynamic-business-fonts'
  let link = document.getElementById(linkId)
  if (!link) {
    link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
}

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  let r = (num >> 16) + Math.round(255 * percent)
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent)
  let b = (num & 0x0000ff) + Math.round(255 * percent)
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/** "#b5502f" -> "181 80 47" — the space-separated channel format Tailwind
 * needs to support opacity modifiers (see index.css / tailwind.config.js). */
function hexToChannels(hex) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return `${r} ${g} ${b}`
}
