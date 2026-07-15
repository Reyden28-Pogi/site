import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Full-size image viewer with prev/next navigation and Escape-to-close.
 * `images`: array of { image_url, caption? }. `index`: currently shown
 * item, or null to hide the lightbox entirely.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  const open = index !== null && index !== undefined

  useEffect(() => {
    if (!open) return

    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, index, images.length, onClose, onNavigate])

  if (!open) return null
  const current = images[index]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 sm:p-8"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-2xl text-paper hover:bg-paper/20"
        >
          ×
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate((index - 1 + images.length) % images.length)
              }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 text-xl text-paper hover:bg-paper/20 sm:left-4"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate((index + 1) % images.length)
              }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 text-xl text-paper hover:bg-paper/20 sm:right-4"
            >
              ›
            </button>
          </>
        )}

        <motion.div
          key={current.image_url}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="max-h-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={current.image_url}
            alt={current.caption || 'Gallery photo'}
            className="max-h-[85vh] w-full rounded-lg object-contain"
          />
          {current.caption && (
            <p className="mt-3 text-center text-sm text-paper/70">{current.caption}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
