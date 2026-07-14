import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useBusiness } from '../../lib/businessContext'
import GalleryGrid from '../../components/public/GalleryGrid.jsx'

export default function Gallery() {
  const { business } = useBusiness()
  const [images, setImages] = useState([])

  useEffect(() => {
    if (!business) return
    supabase
      .from('gallery_images')
      .select('*')
      .eq('business_id', business.id)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => setImages(data || []))
  }, [business])

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="brush-underline font-display text-3xl font-medium text-ink">Gallery</h1>
      <div className="mt-12">
        {images.length === 0 ? (
          <p className="text-sm text-ink/50">No photos uploaded yet.</p>
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>
    </section>
  )
}
