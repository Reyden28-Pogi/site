import { motion } from 'framer-motion'

export default function PackageCard({ pkg, onSelect, index = 0 }) {
  return (
    <motion.button
      onClick={() => onSelect(pkg)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-on-surface/10 bg-surface-card text-left shadow-sm transition-all hover:border-secondary/40 hover:shadow-lg"
    >
      <div className="h-1.5 w-full bg-tertiary" />
      <div className="aspect-[4/3] overflow-hidden bg-ink/5">
        {pkg.image_url && (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h3 className="font-display text-lg font-medium text-on-surface">{pkg.name}</h3>
        <p className="line-clamp-2 text-sm text-on-surface/60">{pkg.description}</p>
        {pkg.price != null && (
          <p className="mt-auto pt-2 font-display text-xl text-brand">
            ${Number(pkg.price).toLocaleString()}
          </p>
        )}
      </div>
    </motion.button>
  )
}
