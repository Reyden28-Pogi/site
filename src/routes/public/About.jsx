import { motion } from 'framer-motion'
import { useBusiness } from '../../lib/businessContext'

export default function About() {
  const { business } = useBusiness()

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="brush-underline font-display text-3xl font-medium text-ink"
      >
        About {business?.name}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mt-8 space-y-4 text-ink/70"
      >
        <p className="whitespace-pre-line">
          {business?.about_text ||
            `${business?.name || 'This business'} hasn't added an About section yet.`}
        </p>
        {business?.address && (
          <p>
            <strong className="text-ink">Based in:</strong> {business.address}
          </p>
        )}
        {business?.contact_email && (
          <p>
            <strong className="text-ink">Email:</strong> {business.contact_email}
          </p>
        )}
        {business?.contact_phone && (
          <p>
            <strong className="text-ink">Phone:</strong> {business.contact_phone}
          </p>
        )}
      </motion.div>
    </section>
  )
}
