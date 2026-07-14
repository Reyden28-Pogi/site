import { useState } from 'react'
import { uploadImage } from '../../lib/imageUpload'

/**
 * Renders a current preview (if imageUrl is set) plus a file input.
 * Calls onUploaded(publicUrl) once the upload completes, so the parent can
 * store the URL directly on its record.
 */
export default function ImageUploader({ imageUrl, onUploaded, label = 'Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      onUploaded(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink/70">{label}</span>
      {imageUrl && <img src={imageUrl} alt="" className="mb-2 h-24 w-24 rounded-lg object-cover" />}
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={uploading}
        className="block text-sm text-ink/60 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
      />
      {uploading && <p className="mt-1 text-xs text-ink/40">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
