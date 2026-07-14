import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * `backgroundImages`: array of image URLs. If more than one is provided,
 * the hero background crossfades between them on a timer. A single-item
 * (or empty) array just renders statically, same as before.
 */
export default function Hero({
  headline,
  subheadline,
  ctaLabel = 'Get a quote',
  ctaTo = '/contact',
  backgroundImages = [],
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (backgroundImages.length < 2) return
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % backgroundImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [backgroundImages.length])

  const currentImage = backgroundImages[activeIndex]

  return (
    <section ref={ref} className="relative flex min-h-[85vh] items-end overflow-hidden bg-ink">
      <motion.div style={{ y }} className="absolute inset-0">
        <AnimatePresence mode="sync">
          {currentImage && (
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ backgroundImage: `url(${currentImage})` }}
              className="absolute inset-0 bg-cover bg-center"
            />
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-32">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-sm font-medium uppercase tracking-[0.2em] text-paper backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {subheadline}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-2xl font-display text-4xl font-medium leading-[1.1] text-paper [text-shadow:0_2px_16px_rgba(0,0,0,0.35)] sm:text-6xl"
        >
          {headline}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-8"
        >
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper transition-transform hover:scale-105"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

