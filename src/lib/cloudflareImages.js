import { supabase } from './supabaseClient'

/**
 * Uploads a File to Cloudflare Images via the `upload-image` Supabase Edge
 * Function (keeps the Cloudflare API token server-side only).
 * Returns { cloudflare_image_id, variants }.
 */
export async function uploadImage(file) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('You must be logged in to upload images.')

  const form = new FormData()
  form.append('file', file)

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Image upload failed')
  return data
}

/**
 * Builds a Cloudflare Images delivery URL for a given image id + variant.
 * Configure variant names ("thumbnail", "public", etc.) in the Cloudflare
 * dashboard under Images > Variants, and set
 * VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH in your .env (this is a public,
 * non-secret identifier — safe for the browser bundle).
 */
export function cfImageUrl(imageId, variant = 'public') {
  const accountHash = import.meta.env.VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH
  if (!imageId) return null
  if (!accountHash) {
    // Fallback placeholder so the UI doesn't break in local/demo setups
    // before Cloudflare Images delivery is configured.
    return `https://placehold.co/800x600?text=${encodeURIComponent(imageId)}`
  }
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`
}
