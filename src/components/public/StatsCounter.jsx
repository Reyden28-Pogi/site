import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

function Counter({ value, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value])

  return (
    <span ref={ref} className="font-display text-4xl font-medium text-ink sm:text-5xl">
      {display}
      {suffix}
    </span>
  )
}

/** stats: [{ label, value, suffix? }] */
export default function StatsCounter({ stats }) {
  return (
    <section className="border-y border-ink/10 bg-secondary/5 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center"
          >
            <Counter value={stat.value} suffix={stat.suffix} />
            <p className="mt-1 text-sm text-ink/60">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
