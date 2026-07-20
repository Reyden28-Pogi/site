// Supabase Edge Function: get-business
//
// Public, unauthenticated. Resolves exactly one business by slug, using the
// service role (bypasses RLS) so we can return the fields the public site
// needs without granting anon any direct SELECT on the `businesses` table.
//
// This deliberately returns only ONE row for a slug you already know (the
// slug baked into that deployment's VITE_BUSINESS_SLUG) — never a listing —
// so it can't be used to enumerate or scrape the full client directory the
// way a bare `anon` SELECT policy could.
//
// Deploy: supabase functions deploy get-business --no-verify-jwt
// (No secrets needed beyond the SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// Supabase injects automatically.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    // A legitimate site only needs to resolve its own slug once per load,
    // cached client-side for the session — so a generous-but-real cap here
    // mainly slows down slug-guessing/enumeration attempts, not real usage.
    const allowed = await checkRateLimit(`get-business:${clientIp(req)}`, 60, 60)
    if (!allowed) {
      return json({ error: 'Too many requests' }, 429)
    }

    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
      return json({ error: 'Missing "slug" query parameter' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await admin
      .from('businesses')
      .select(
        'id, name, slug, contact_email, contact_phone, address, theme_color, secondary_color, tertiary_color, heading_font, body_font, about_text, logo_url, dark_mode, social_links'
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return json({ error: 'No active business found for this slug' }, 404)
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
