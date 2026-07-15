/** Verifies a Cloudflare Turnstile token server-side. Returns true if the
 * captcha check passed. Shared by submit-lead and submit-review, which
 * previously each had their own copy of this exact fetch call. */
export async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: Deno.env.get('TURNSTILE_SECRET_KEY')!,
      response: token,
      remoteip: remoteIp,
    }),
  })
  const verifyData = await verifyRes.json()
  return verifyData.success === true
}
