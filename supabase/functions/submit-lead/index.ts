// Supabase Edge Function: submit-lead
//
// Public, unauthenticated — this is what the Contact page calls instead of
// inserting into `leads` directly with the anon key. Direct anon inserts
// had no captcha and no rate limit, so anyone could spam a business's
// leads table (and, via the DB webhook, its inbox) as fast as they could
// fire requests. This function requires a valid Cloudflare Turnstile
// token and rate-limits by IP before writing anything, using the service
// role (the `leads` table's RLS no longer has an anon-insert policy at
// all — see 0003_rate_limiting.sql — so this is the only way in).
//
// Deploy:  supabase functions deploy submit-lead --no-verify-jwt
// Secrets: supabase secrets set TURNSTILE_SECRET_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'
import { verifyTurnstile } from '../_shared/turnstile.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const ip = clientIp(req)

    // Two independent throttles: a tight one for this exact form (real
    // visitors submit a quote request once, not repeatedly) and a looser
    // one shared with other public endpoints from the same IP.
    const allowed = await checkRateLimit(`submit-lead:${ip}`, 5, 600) // 5 per 10 minutes
    if (!allowed) {
      return json({ error: 'Too many requests — please try again later.' }, 429)
    }

    const body = await req.json()
    const { turnstile_token, business_id, name, email, phone, event_type, event_date, guest_count, message } = body

    if (!turnstile_token) {
      return json({ error: 'Missing captcha token' }, 400)
    }
    if (!business_id || !name || !email) {
      return json({ error: 'business_id, name, and email are required' }, 400)
    }

    // Verify the Turnstile token server-side. This is the step that
    // actually stops scripted/bot submissions — the widget alone is only
    // as good as this check.
    const verified = await verifyTurnstile(turnstile_token, ip)
    if (!verified) {
      return json({ error: 'Captcha verification failed' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Confirm the target business actually exists and is active before
    // writing anything — mirrors the check the old RLS policy did.
    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('is_active', true)
      .single()

    if (!business) {
      return json({ error: 'Unknown business' }, 400)
    }

    const { error: insertError } = await admin.from('leads').insert({
      business_id,
      name,
      email,
      phone: phone || null,
      event_type: event_type || null,
      event_date: event_date || null,
      guest_count: guest_count ? Number(guest_count) : null,
      message: message || null,
    })

    if (insertError) {
      return json({ error: 'Failed to save your request' }, 500)
    }

    return json({ success: true })
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
