import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'
import ImageUploader from '../../components/admin/ImageUploader.jsx'

// Curated color trios — picking one sets primary/secondary/tertiary
// together so they're guaranteed to look coordinated. Individual color
// pickers below still let an owner override any single one.
const PALETTES = [
  { name: 'Terracotta & Sage', primary: '#B5502F', secondary: '#6B8F71', tertiary: '#E8B04B' },
  { name: 'Deep Navy & Blush', primary: '#1F3A5F', secondary: '#C97B8B', tertiary: '#D8C9A3' },
  { name: 'Wine & Gold', primary: '#7A2E4D', secondary: '#C08A28', tertiary: '#4A5C7A' },
  { name: 'Charcoal & Rose', primary: '#333333', secondary: '#C97B8B', tertiary: '#8FAE94' },
  { name: 'Slate & Coral', primary: '#4A5C7A', secondary: '#E07856', tertiary: '#C9A227' },
  { name: 'Forest & Clay', primary: '#2F4A3D', secondary: '#B5502F', tertiary: '#D9B36C' },
  { name: 'Emerald & Gold', primary: '#1B3A2B', secondary: '#C9A227', tertiary: '#E8DCC0' },
]

// Curated font pairings — kept curated rather than freeform so every
// choice is guaranteed to actually render well together and load
// correctly (typing an arbitrary Google Font name risks typos and
// mismatched pairings). See README section 8 for the reasoning.
const FONT_PAIRS = [
  { name: 'Classic Elegant', heading: 'Fraunces', body: 'Inter' },
  { name: 'Modern Minimal', heading: 'Poppins', body: 'Inter' },
  { name: 'Editorial Serif', heading: 'Playfair Display', body: 'Source Sans 3' },
  { name: 'Friendly Rounded', heading: 'Quicksand', body: 'Nunito Sans' },
  { name: 'Bold Contemporary', heading: 'Space Grotesk', body: 'Inter' },
  { name: 'Luxury Serif', heading: 'Cormorant Garamond', body: 'Lato' },
]

function loadPreviewFonts() {
  const families = [...new Set(FONT_PAIRS.flatMap((p) => [p.heading, p.body]))]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;600`)
    .join('&')
  const id = 'settings-font-previews'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'youtube', label: 'YouTube' },
]

const emptyForm = {
  about_text: '',
  address: '',
  contact_phone: '',
  theme_color: '#B5502F',
  secondary_color: '#6B8F71',
  tertiary_color: '#E8B04B',
  heading_font: 'Fraunces',
  body_font: 'Inter',
  logo_url: '',
  dark_mode: false,
  social_links: { facebook: '', instagram: '', tiktok: '', twitter: '', youtube: '' },
}

export default function SettingsAdmin() {
  const { appUser, loading: authLoading } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    loadPreviewFonts()
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!appUser?.business_id) {
      setLoading(false)
      return
    }

    supabase
      .from('businesses')
      .select(
        'about_text, address, contact_phone, theme_color, secondary_color, tertiary_color, heading_font, body_font, logo_url, dark_mode, social_links'
      )
      .eq('id', appUser.business_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            about_text: data.about_text || '',
            address: data.address || '',
            contact_phone: data.contact_phone || '',
            theme_color: data.theme_color || emptyForm.theme_color,
            secondary_color: data.secondary_color || emptyForm.secondary_color,
            tertiary_color: data.tertiary_color || emptyForm.tertiary_color,
            heading_font: data.heading_font || emptyForm.heading_font,
            body_font: data.body_font || emptyForm.body_font,
            logo_url: data.logo_url || '',
            dark_mode: data.dark_mode || false,
            social_links: { ...emptyForm.social_links, ...(data.social_links || {}) },
          })
        }
        setLoading(false)
      })
  }, [appUser, authLoading])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-business-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(form),
      }
    )
    const data = await res.json()

    setSaving(false)
    if (!res.ok) {
      setStatus('error')
      setErrorMessage(data.error || 'Something went wrong')
    } else {
      setStatus('success')
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>

  if (!appUser?.business_id) {
    return (
      <div>
        <h1 className="font-display text-2xl font-medium text-ink">Settings</h1>
        <p className="mt-4 max-w-md text-sm text-red-600">
          Your account isn't linked to a business yet, so there's nothing to
          edit here. Ask your super admin to check your account's row in the
          `users` table — it needs a `business_id` set.
        </p>
      </div>
    )
  }

  const activePalette = PALETTES.find(
    (p) =>
      p.primary.toLowerCase() === form.theme_color.toLowerCase() &&
      p.secondary.toLowerCase() === form.secondary_color.toLowerCase() &&
      p.tertiary.toLowerCase() === form.tertiary_color.toLowerCase()
  )

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink/50">
        Edit your logo, brand colors, fonts, and About text. To change your
        business name, slug, or contact email, ask your super admin.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid max-w-2xl gap-8 rounded-2xl border border-ink/10 bg-white p-6">
        <ImageUploader
          imageUrl={form.logo_url}
          onUploaded={(url) => setForm({ ...form, logo_url: url })}
          label="Logo"
        />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">About text (shown on your public About page)</span>
          <textarea
            rows={6}
            value={form.about_text}
            onChange={(e) => setForm({ ...form, about_text: e.target.value })}
            className="input"
            placeholder="Tell visitors about your business…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Address</span>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Phone</span>
          <input
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className="input"
          />
        </label>

        {/* ---------- Colors ---------- */}
        <div>
          <span className="mb-2 block text-sm font-medium text-ink/70">Brand color palette</span>
          <div className="flex flex-wrap gap-3">
            {PALETTES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    theme_color: p.primary,
                    secondary_color: p.secondary,
                    tertiary_color: p.tertiary,
                  })
                }
                title={p.name}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-colors ${
                  activePalette?.name === p.name ? 'bg-ink/5 ring-2 ring-ink/20' : ''
                }`}
              >
                <span className="flex -space-x-2">
                  <span className="h-8 w-8 rounded-full border-2 border-white" style={{ backgroundColor: p.primary }} />
                  <span className="h-8 w-8 rounded-full border-2 border-white" style={{ backgroundColor: p.secondary }} />
                  <span className="h-8 w-8 rounded-full border-2 border-white" style={{ backgroundColor: p.tertiary }} />
                </span>
                <span className="text-[11px] text-ink/50">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">Primary</span>
              <input
                type="color"
                value={form.theme_color}
                onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                className="h-9 w-full rounded-lg border border-ink/15"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">Secondary</span>
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                className="h-9 w-full rounded-lg border border-ink/15"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">Tertiary</span>
              <input
                type="color"
                value={form.tertiary_color}
                onChange={(e) => setForm({ ...form, tertiary_color: e.target.value })}
                className="h-9 w-full rounded-lg border border-ink/15"
              />
            </label>
          </div>
        </div>

        {/* ---------- Fonts ---------- */}
        <div>
          <span className="mb-2 block text-sm font-medium text-ink/70">Font pairing</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {FONT_PAIRS.map((pair) => {
              const active = form.heading_font === pair.heading && form.body_font === pair.body
              return (
                <button
                  key={pair.name}
                  type="button"
                  onClick={() => setForm({ ...form, heading_font: pair.heading, body_font: pair.body })}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active ? 'border-ink/30 bg-ink/5' : 'border-ink/10 hover:bg-ink/5'
                  }`}
                >
                  <p style={{ fontFamily: `'${pair.heading}'` }} className="text-lg">
                    {pair.name}
                  </p>
                  <p style={{ fontFamily: `'${pair.body}'` }} className="text-xs text-ink/50">
                    {pair.heading} + {pair.body}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ---------- Dark mode ---------- */}
        <label className="flex items-center justify-between rounded-xl border border-ink/10 p-4">
          <span>
            <span className="block text-sm font-medium text-ink">Dark mode</span>
            <span className="block text-xs text-ink/50">
              Switches your public site to a dark background with light text.
              Your color palette and fonts still apply on top of it.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.dark_mode}
            onChange={(e) => setForm({ ...form, dark_mode: e.target.checked })}
            className="h-5 w-5 shrink-0"
          />
        </label>

        {/* ---------- Social links ---------- */}
        <div>
          <span className="mb-2 block text-sm font-medium text-ink/70">Social links</span>
          <p className="mb-3 text-xs text-ink/50">
            Shown as icons in your site's footer. Leave any blank to hide that one.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map(({ key, label }) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-medium text-ink/60">{label}</span>
                <input
                  type="url"
                  value={form.social_links[key]}
                  onChange={(e) =>
                    setForm({ ...form, social_links: { ...form.social_links, [key]: e.target.value } })
                  }
                  placeholder={`https://${key}.com/yourbusiness`}
                  className="input"
                />
              </label>
            ))}
          </div>
        </div>

        {status === 'success' && <p className="text-sm text-brand">Saved!</p>}
        {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
