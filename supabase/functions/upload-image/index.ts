// Supabase Edge Function: upload-image
//
// Accepts a multipart/form-data POST with a single "file" field from an
// authenticated business_admin, and stores it in the `media` Storage
// bucket under that admin's own business_id folder. Storage RLS (see
// 0004_supabase_storage.sql) independently enforces that folder scoping —
// this function's own checks are defense in depth, not the only gate.
//
// Uses the caller's own JWT (not the service role) for the actual storage
// upload, so Storage RLS applies exactly as it would for any other client
// call — this function is a thin, validated pass-through, not a privilege
// escalation.
//
// Deploy: supabase functions deploy upload-image
// (No extra secrets needed — just SUPABASE_URL / SUPABASE_ANON_KEY, which
// Supabase injects automatically.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BUCKET = 'media'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // 1. Verify the caller is a logged-in business_admin. Super admins
    // intentionally can't upload here — per the platform's design, tenant
    // content (including its images) is the business_admin's own to manage.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Not authenticated' }, 401)
    }

    const { data: appUser } = await supabase
      .from('users')
      .select('role, business_id')
      .eq('auth_id', user.id)
      .single()

    if (!appUser || appUser.role !== 'business_admin' || !appUser.business_id) {
      return json({ error: 'Only business admins can upload images' }, 403)
    }

    // 2. Pull the file out of the incoming form data, and validate it
    // before it goes anywhere near storage.
    const incomingForm = await req.formData()
    const file = incomingForm.get('file')
    if (!(file instanceof File)) {
      return json({ error: 'No file provided under the "file" field' }, 400)
    }

    const MAX_BYTES = 10 * 1024 * 1024 // 10MB — generous for web images, cheap to enforce
    if (file.size > MAX_BYTES) {
      return json({ error: 'File exceeds the 10MB upload limit' }, 400)
    }
    if (!file.type.startsWith('image/')) {
      return json({ error: 'Only image files can be uploaded' }, 400)
    }

    // 3. Upload into the business's own folder in the `media` bucket.
    // Storage RLS requires the first path segment to equal the caller's
    // business_id, so this would be rejected even if the checks above were
    // ever bypassed.
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${appUser.business_id}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      return json({ error: 'Upload failed', details: uploadError.message }, 502)
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return json({ image_url: publicUrlData.publicUrl, path })
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
