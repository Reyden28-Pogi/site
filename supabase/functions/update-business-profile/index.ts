// Supabase Edge Function: update-business-profile
//
// Lets a business_admin edit a deliberately limited set of their OWN
// business's fields: about_text, address, contact_phone, theme_color,
// secondary_color, tertiary_color, heading_font, body_font, logo_url,
// dark_mode, social_links.
//
// Why an Edge Function instead of an RLS UPDATE policy: the `businesses`
// table has no business_admin write policy at all (see
// 0002_hardening.sql), and deliberately so — `name`/`slug`/`is_active`/
// `contact_email` are either routing-critical (changing `slug` would break
// that tenant's own deployed VITE_BUSINESS_SLUG) or intentionally
// super-admin-only (deactivation). Rather than open row-level UPDATE
// access and rely on the frontend UI to "not show" those fields (which a
// business_admin could bypass by calling the table API directly), this
// function is the only write path and it only ever touches the four safe
// columns below.
//
// Deploy: supabase functions deploy update-business-profile

// Curated font pairs offered in the Settings UI (see
// src/routes/admin/SettingsAdmin.jsx FONT_PAIRS). Values are validated
// against this allowlist rather than accepted freeform, since they get
// interpolated into a Google Fonts URL and a CSS custom property on the
// frontend — an allowlist avoids ever needing to sanitize an arbitrary
// string for that context.
const ALLOWED_FONTS = new Set([
  'Fraunces',
  'Inter',
  'Poppins',
  'Playfair Display',
  'Source Sans 3',
  'Quicksand',
  'Nunito Sans',
  'Space Grotesk',
  'Cormorant Garamond',
  'Lato',
])

// Same reasoning as ALLOWED_FONTS: an allowlist of known platform keys
// rather than accepting arbitrary object keys, since this becomes part of
// what's rendered (and linked to) on the public site.
const ALLOWED_SOCIAL_PLATFORMS = new Set(['facebook', 'instagram', 'tiktok', 'twitter', 'youtube'])

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return json({ error: 'Not authenticated' }, 401)

    const { data: appUser } = await supabase
      .from('users')
      .select('role, business_id')
      .eq('auth_id', user.id)
      .single()

    if (!appUser || appUser.role !== 'business_admin' || !appUser.business_id) {
      return json({ error: 'Only business admins can update their business profile' }, 403)
    }

    const body = await req.json()

    // Allowlist: only the fields below, nothing else, regardless of what
    // the request body contains.
    const updates: Record<string, unknown> = {}
    if (typeof body.about_text === 'string') updates.about_text = body.about_text.slice(0, 5000)
    if (typeof body.address === 'string') updates.address = body.address.slice(0, 500)
    if (typeof body.contact_phone === 'string') updates.contact_phone = body.contact_phone.slice(0, 50)
    if (typeof body.theme_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.theme_color)) {
      updates.theme_color = body.theme_color
    }
    if (typeof body.secondary_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.secondary_color)) {
      updates.secondary_color = body.secondary_color
    }
    if (typeof body.tertiary_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.tertiary_color)) {
      updates.tertiary_color = body.tertiary_color
    }
    if (typeof body.heading_font === 'string' && ALLOWED_FONTS.has(body.heading_font)) {
      updates.heading_font = body.heading_font
    }
    if (typeof body.body_font === 'string' && ALLOWED_FONTS.has(body.body_font)) {
      updates.body_font = body.body_font
    }
    if (typeof body.logo_url === 'string' && body.logo_url.length < 2000) {
      updates.logo_url = body.logo_url
    }
    if (typeof body.dark_mode === 'boolean') {
      updates.dark_mode = body.dark_mode
    }
    if (body.social_links && typeof body.social_links === 'object' && !Array.isArray(body.social_links)) {
      const cleaned: Record<string, string> = {}
      for (const [key, value] of Object.entries(body.social_links)) {
        if (
          ALLOWED_SOCIAL_PLATFORMS.has(key) &&
          typeof value === 'string' &&
          value.length > 0 &&
          value.length < 500 &&
          isHttpUrl(value)
        ) {
          cleaned[key] = value
        }
      }
      updates.social_links = cleaned
    }

    if (Object.keys(updates).length === 0) {
      return json({ error: 'No valid fields to update' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await admin
      .from('businesses')
      .update(updates)
      .eq('id', appUser.business_id)
      .select()
      .single()

    if (error) {
      return json({ error: 'Failed to update business profile', details: error.message }, 500)
    }

    return json({ business: data })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
