import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'

export default function Dashboard() {
  const { appUser } = useAuth()
  const [stats, setStats] = useState({ packages: 0, gallery: 0, posts: 0, newLeads: 0 })
  const [recentLeads, setRecentLeads] = useState([])

  useEffect(() => {
    if (!appUser?.business_id) return
    const businessId = appUser.business_id

    async function load() {
      const [{ count: packages }, { count: gallery }, { count: posts }, { count: newLeads }, { data: leads }] =
        await Promise.all([
          supabase.from('packages').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
          supabase.from('gallery_images').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
          supabase
            .from('blog_posts')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('is_published', true),
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('status', 'new'),
          supabase
            .from('leads')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      setStats({ packages: packages || 0, gallery: gallery || 0, posts: posts || 0, newLeads: newLeads || 0 })
      setRecentLeads(leads || [])
    }

    load()
  }, [appUser])

  const cards = [
    { label: 'Total packages', value: stats.packages, to: '/admin/packages' },
    { label: 'Gallery photos', value: stats.gallery, to: '/admin/gallery' },
    { label: 'Published posts', value: stats.posts, to: '/admin/blog' },
    { label: 'New leads', value: stats.newLeads, to: '/admin/leads' },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="font-display text-3xl font-medium text-ink">{card.value}</p>
            <p className="mt-1 text-sm text-ink/50">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium text-ink">Recent leads</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {recentLeads.length === 0 ? (
            <p className="p-6 text-sm text-ink/50">No leads yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-ink/50">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Event</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-6 py-3">{lead.name}</td>
                    <td className="px-6 py-3">{lead.event_type || '—'}</td>
                    <td className="px-6 py-3 capitalize">{lead.status}</td>
                    <td className="px-6 py-3 text-ink/50">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
