// Supabase Edge Function: send-lead-notification
//
// Intended to be called ONLY by a Postgres Database Webhook on
// `insert into leads` (Supabase Dashboard -> Database -> Webhooks).
//
// This function has to run with --no-verify-jwt because DB webhooks don't
// send a user JWT — but that means Supabase's platform-level auth check is
// off, so this code must verify the caller itself. Without that, anyone who
// finds this function's URL could POST an arbitrary `record` object and use
// our Resend account as an open relay to email any business's contact
// address with attacker-authored content, and use the sent/skipped
// response to enumerate valid business_ids. We close that with a shared
// secret set as a custom header on the webhook config.
//
// Deploy:  supabase functions deploy send-lead-notification --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... NOTIFICATION_FROM_EMAIL=... LEAD_WEBHOOK_SECRET=...
//
// Then create the webhook: table "leads", event "INSERT", type "HTTP Request",
// with a custom header `x-webhook-secret: <same value as LEAD_WEBHOOK_SECRET>`,
// pointing at this function's URL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

Deno.serve(async (req) => {
  try {
    const providedSecret = req.headers.get('x-webhook-secret')
    const expectedSecret = Deno.env.get('LEAD_WEBHOOK_SECRET')

    if (!expectedSecret || providedSecret !== expectedSecret) {
      // Deliberately generic — don't reveal whether the secret was missing
      // vs wrong, or anything about what this endpoint does.
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const payload = await req.json()
    const lead = payload.record // Supabase webhook payload shape: { type, table, record, ... }

    if (!lead) {
      return new Response(JSON.stringify({ error: 'No record in payload' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role: webhook is server-to-server, not user-scoped
    )

    const { data: business } = await supabase
      .from('businesses')
      .select('name, contact_email')
      .eq('id', lead.business_id)
      .single()

    if (!business?.contact_email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No contact_email on file' }))
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL')!

    const emailBody = `
      <h2>New quote request — ${business.name}</h2>
      <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(lead.phone ?? '—')}</p>
      <p><strong>Event type:</strong> ${escapeHtml(lead.event_type ?? '—')}</p>
      <p><strong>Event date:</strong> ${escapeHtml(lead.event_date ?? '—')}</p>
      <p><strong>Guest count:</strong> ${escapeHtml(String(lead.guest_count ?? '—'))}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(lead.message ?? '—')}</p>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: business.contact_email,
        subject: `New quote request from ${lead.name}`,
        html: emailBody,
      }),
    })

    if (!emailRes.ok) {
      const details = await emailRes.text()
      return new Response(JSON.stringify({ error: 'Email send failed', details }), { status: 502 })
    }

    return new Response(JSON.stringify({ sent: true }))
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
