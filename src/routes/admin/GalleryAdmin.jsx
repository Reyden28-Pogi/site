import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'
import { uploadImage } from '../../lib/imageUpload'

export default function GalleryAdmin() {
  const { appUser } = useAuth()
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('uploaded_at', { ascending: false })
    setImages(data || [])
  }

  useEffect(() => {
    if (appUser?.business_id) load()
  }, [appUser])

  async function handleBulkUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      try {
        const image_url = await uploadImage(file)
        await supabase.from('gallery_images').insert({
          business_id: appUser.business_id,
          image_url,
          caption: '',
        })
      } catch (err) {
        console.error('Upload failed for', file.name, err)
      }
    }

    setUploading(false)
    e.target.value = ''
    load()
  }

  async function updateCaption(id, caption) {
    setImages((imgs) => imgs.map((img) => (img.id === id ? { ...img, caption } : img)))
  }

  async function saveCaption(id, caption) {
    await supabase.from('gallery_images').update({ caption }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('gallery_images').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Gallery</h1>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
        <span className="mb-1 block text-sm font-medium text-ink/70">Bulk upload photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleBulkUpload}
          className="block text-sm text-ink/60 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
        />
        {uploading && <p className="mt-2 text-xs text-ink/40">Uploading…</p>}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="rounded-xl border border-ink/10 bg-white p-3">
            <img src={img.image_url} alt="" className="h-32 w-full rounded-lg object-cover" />
            <input
              value={img.caption || ''}
              onChange={(e) => updateCaption(img.id, e.target.value)}
              onBlur={(e) => saveCaption(img.id, e.target.value)}
              placeholder="Caption"
              className="input mt-2 text-xs"
            />
            <button onClick={() => handleDelete(img.id)} className="mt-2 text-xs font-medium text-red-600 hover:underline">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
