import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

/**
 * Calls the `check_rate_limit` Postgres function (see
 * supabase/migrations/0003_rate_limiting.sql) via the service role.
 * Returns true if the request is allowed, false if the caller has exceeded
 * `limit` requests within `windowSeconds` for the given `key`.
 *
 * Fails OPEN (returns true) if the rate-limit check itself errors, so a
 * database hiccup degrades to "no rate limiting" rather than "service
 * down" — availability over strictness for this particular safety net.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) return true
    return data !== false
  } catch {
    return true
  }
}

/** Best-effort client IP extraction for use as a rate-limit key. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('cf-connecting-ip') || 'unknown'
}
