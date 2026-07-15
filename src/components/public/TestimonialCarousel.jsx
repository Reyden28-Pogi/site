import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function TestimonialCarousel({ testimonials }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (testimonials.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(id)
  }, [testimonials.length])

  if (!testimonials.length) return null
  const current = testimonials[index]

  return (
    <section className="bg-secondary/5 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="brush-underline font-display text-2xl font-medium text-on-surface">
          What clients say
        </h2>
        <div className="relative mt-10 min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="font-display text-xl italic leading-relaxed text-on-surface/80 sm:text-2xl">
                “{current.quote}”
              </p>
              <footer className="mt-4 text-sm font-medium text-on-surface/50">
                {current.client_name}
                {current.rating ? ` · ${'★'.repeat(current.rating)}` : ''}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        {testimonials.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index ? 'bg-brand' : 'bg-ink/15'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
