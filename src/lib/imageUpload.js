import { supabase } from './supabaseClient'

/**
 * Uploads a File via the `upload-image` Edge Function, which stores it in
 * Supabase Storage under the caller's own business_id folder and returns a
 * ready-to-use public URL. Store that URL directly on the record
 * (packages.image_url, gallery_images.image_url, blog_posts.cover_image_url)
 * — there's no separate "build the URL" step needed elsewhere in the app.
 */
export async function uploadImage(file) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('You must be logged in to upload images.')

  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Image upload failed')
  return data.image_url
}
