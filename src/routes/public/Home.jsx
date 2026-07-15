import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useBusiness } from '../../lib/businessContext'
import Hero from '../../components/public/Hero.jsx'
import PackageCard from '../../components/public/PackageCard.jsx'
import TestimonialCarousel from '../../components/public/TestimonialCarousel.jsx'
import ClientReviews from '../../components/public/ClientReviews.jsx'
import StatsCounter from '../../components/public/StatsCounter.jsx'

export default function Home() {
  const navigate = useNavigate()
  const { business } = useBusiness()
  const [packages, setPackages] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [reviews, setReviews] = useState([])
  const [heroImageUrls, setHeroImageUrls] = useState([])
  const [stats, setStats] = useState({ packages: 0, gallery: 0, testimonials: 0, eventsCompleted: 0 })

  useEffect(() => {
    if (!business) return

    supabase
      .from('packages')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(3)
      .then(({ data }) => setPackages(data || []))

    supabase
      .from('testimonials')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_visible', true)
      .then(({ data }) => setTestimonials(data || []))

    supabase
      .from('reviews')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data || []))

    supabase
      .from('gallery_images')
      .select('image_url')
      .eq('business_id', business.id)
      .order('uploaded_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setHeroImageUrls((data || []).map((row) => row.image_url)))

    // Real counts from this business's own data — no invented marketing
    // numbers. A brand-new site will show low/zero counts, which is more
    // honest than a fake "120+ events delivered" that isn't true for them.
    Promise.all([
      supabase.from('packages').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('is_active', true),
      supabase.from('gallery_images').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('testimonials').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('is_visible', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'closed'),
    ]).then(([pkgRes, galleryRes, testimonialRes, leadsRes]) => {
      setStats({
        packages: pkgRes.count || 0,
        gallery: galleryRes.count || 0,
        testimonials: testimonialRes.count || 0,
        eventsCompleted: leadsRes.count || 0,
      })
    })
  }, [business])

  const hasAnyStats = Object.values(stats).some((v) => v > 0)

  return (
    <div>
      <Hero
        headline={`Memorable events, handled with care by ${business?.name || 'us'}.`}
        subheadline="Welcome"
        backgroundImages={heroImageUrls}
      />

      {hasAnyStats && (
        <StatsCounter
          stats={[
            { label: 'Packages offered', value: stats.packages },
            { label: 'Gallery photos', value: stats.gallery },
            { label: 'Client testimonials', value: stats.testimonials },
            { label: 'Events completed', value: stats.eventsCompleted },
          ]}
        />
      )}

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="brush-underline font-display text-3xl font-medium text-on-surface">
            Featured packages
          </h2>
          <Link
            to="/packages"
            className="rounded-full border border-secondary/40 px-4 py-2 text-sm font-medium text-secondary-dark transition-colors hover:bg-secondary/10"
          >
            View all →
          </Link>
        </div>
        {packages.length === 0 ? (
          <p className="text-sm text-on-surface/50">
            No packages published yet — add some from the admin dashboard.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <PackageCard key={pkg.id} pkg={pkg} index={i} onSelect={() => navigate('/packages')} />
            ))}
          </div>
        )}
      </section>

      <TestimonialCarousel testimonials={testimonials} />

      <ClientReviews businessId={business?.id} reviews={reviews} />

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-on-surface/10 bg-secondary/5 py-24"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl font-medium text-on-surface">Ready to plan yours?</h2>
          <p className="mt-3 text-on-surface/60">
            Tell us about your event and we'll follow up with a custom quote.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper transition-transform hover:scale-105"
          >
            Request a quote
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
