import { motion } from 'framer-motion'

export default function GalleryGrid({ images, onSelect }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {images.map((img, i) => (
        <motion.figure
          key={img.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
          className="mb-4 break-inside-avoid overflow-hidden rounded-xl bg-on-surface/5"
        >
          <button onClick={() => onSelect(i)} className="block w-full">
            <img
              src={img.image_url}
              alt={img.caption || 'Gallery photo'}
              loading="lazy"
              className="w-full cursor-zoom-in object-cover transition-transform duration-500 hover:scale-105"
            />
          </button>
          {img.caption && (
            <figcaption className="p-2 text-xs text-on-surface/50">{img.caption}</figcaption>
          )}
        </motion.figure>
      ))}
    </div>
  )
}
