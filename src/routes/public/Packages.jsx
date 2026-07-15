import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useBusiness } from '../../lib/businessContext'
import PackageCard from '../../components/public/PackageCard.jsx'

export default function Packages() {
  const { business } = useBusiness()
  const [packages, setPackages] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!business) return
    supabase
      .from('packages')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => setPackages(data || []))
  }, [business])

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="brush-underline font-display text-3xl font-medium text-on-surface">
        Packages &amp; services
      </h1>

      {packages.length === 0 ? (
        <p className="mt-8 text-sm text-on-surface/50">No packages published yet.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} onSelect={setSelected} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-card p-0 shadow-xl"
            >
              {selected.image_url && (
                <img
                  src={selected.image_url}
                  alt={selected.name}
                  className="h-56 w-full object-cover"
                />
              )}
              <div className="p-8">
                <h2 className="font-display text-2xl font-medium text-on-surface">{selected.name}</h2>
                {selected.price != null && (
                  <p className="mt-2 font-display text-xl text-brand">
                    ${Number(selected.price).toLocaleString()}
                  </p>
                )}
                <p className="mt-4 whitespace-pre-line text-on-surface/70">{selected.description}</p>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-8 rounded-full border border-on-surface/15 px-5 py-2 text-sm font-medium text-on-surface/70 hover:bg-on-surface/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
