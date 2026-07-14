// Supabase Edge Function: create-business
//
// Super-admin-only. Creates a new `businesses` row, invites the first
// business_admin user via Supabase Auth (email invite), and links them
// together in the `users` table. Uses the service role key, so this must
// never be callable without verifying the caller is a super_admin first.
//
// Deploy:  supabase functions deploy create-business
// Secrets: this function needs SUPABASE_SERVICE_ROLE_KEY, which Supabase
//          provides automatically to Edge Functions — do not expose it
//          to the browser anywhere else.

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

    // Client scoped to the caller's JWT, purely to verify who's calling.
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser()
    if (userError || !user) return json({ error: 'Not authenticated' }, 401)

    const { data: callerAppUser } = await callerClient
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (callerAppUser?.role !== 'super_admin') {
      return json({ error: 'Only super admins can create businesses' }, 403)
    }

    const { name, slug, contact_email, contact_phone, address, theme_color, admin_email } =
      await req.json()

    if (!name || !slug || !admin_email) {
      return json({ error: 'name, slug, and admin_email are required' }, 400)
    }

    // Admin client with the service role — bypasses RLS, so every write
    // below is deliberate and scoped to exactly what this flow needs.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .insert({ name, slug, contact_email, contact_phone, address, theme_color })
      .select()
      .single()

    if (businessError) {
      return json({ error: 'Failed to create business', details: businessError.message }, 400)
    }

    // Invite the first business_admin by email — they'll receive a magic
    // link to set their password and land on /admin.
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      admin_email,
      { redirectTo: `${Deno.env.get('PUBLIC_ADMIN_URL') ?? ''}/admin/accept-invite` }
    )

    if (inviteError || !invited?.user) {
      // Roll back the business row so the tenant list stays consistent.
      await admin.from('businesses').delete().eq('id', business.id)
      return json({ error: 'Failed to invite admin user', details: inviteError?.message }, 400)
    }

    const { error: linkError } = await admin.from('users').insert({
      auth_id: invited.user.id,
      business_id: business.id,
      role: 'business_admin',
      email: admin_email,
    })

    if (linkError) {
      // Both the business row and the invited auth user are now orphaned
      // relative to each other — clean up both so a retry starts fresh
      // instead of leaving a half-created tenant and a dangling invite.
      await admin.from('businesses').delete().eq('id', business.id)
      await admin.auth.admin.deleteUser(invited.user.id)
      return json(
        { error: 'Failed to finish setting up the business — please try again.', details: linkError.message },
        500
      )
    }

    return json({ business, invited_admin_email: admin_email })
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
