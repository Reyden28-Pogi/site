// Supabase Edge Function: submit-review
//
// Public, unauthenticated — lets a real site visitor leave a rating +
// comment for a business. Same anti-abuse pattern as `submit-lead`:
// verifies a Cloudflare Turnstile token and rate-limits by IP before
// writing anything, using the service role (the `reviews` table has no
// anon-insert RLS policy at all — see 0007_reviews.sql — so this function
// is the only way in).
//
// Deploy:  supabase functions deploy submit-review --no-verify-jwt
// Secrets: reuses TURNSTILE_SECRET_KEY, already set for submit-lead.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const ip = clientIp(req)

    const allowed = await checkRateLimit(`submit-review:${ip}`, 3, 1800) // 3 per 30 minutes
    if (!allowed) {
      return json({ error: 'Too many requests — please try again later.' }, 429)
    }

    const body = await req.json()
    const { turnstile_token, business_id, client_name, rating, comment } = body

    if (!turnstile_token) {
      return json({ error: 'Missing captcha token' }, 400)
    }
    if (!business_id || !client_name || !rating) {
      return json({ error: 'business_id, client_name, and rating are required' }, 400)
    }
    const numericRating = Number(rating)
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return json({ error: 'rating must be a whole number from 1 to 5' }, 400)
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: Deno.env.get('TURNSTILE_SECRET_KEY')!,
        response: turnstile_token,
        remoteip: ip,
      }),
    })
    const verifyData = await verifyRes.json()

    if (!verifyData.success) {
      return json({ error: 'Captcha verification failed' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('is_active', true)
      .single()

    if (!business) {
      return json({ error: 'Unknown business' }, 400)
    }

    const { error: insertError } = await admin.from('reviews').insert({
      business_id,
      client_name: String(client_name).slice(0, 200),
      rating: numericRating,
      comment: comment ? String(comment).slice(0, 2000) : null,
    })

    if (insertError) {
      return json({ error: 'Failed to save your review' }, 500)
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
