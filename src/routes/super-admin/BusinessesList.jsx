import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function BusinessesList() {
  const [businesses, setBusinesses] = useState([])
  const [statsByBusiness, setStatsByBusiness] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data: bizList } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })

    setBusinesses(bizList || [])

    const stats = {}
    await Promise.all(
      (bizList || []).map(async (biz) => {
        const [{ count: leadsCount }, { count: packagesCount }, { data: lastPackage }] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }).eq('business_id', biz.id),
          supabase.from('packages').select('*', { count: 'exact', head: true }).eq('business_id', biz.id),
          supabase
            .from('packages')
            .select('created_at')
            .eq('business_id', biz.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])
        stats[biz.id] = {
          leads: leadsCount || 0,
          packages: packagesCount || 0,
          lastUpdated: lastPackage?.[0]?.created_at,
        }
      })
    )
    setStatsByBusiness(stats)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleActive(biz) {
    await supabase.from('businesses').update({ is_active: !biz.is_active }).eq('id', biz.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">Businesses</h1>
        <Link
          to="/super-admin/new"
          className="rounded-full bg-brand-light px-5 py-2 text-sm font-semibold text-ink"
        >
          + Add business
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-paper/50">Loading…</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-paper/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper/10 text-paper/50">
              <tr>
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Leads</th>
                <th className="px-6 py-3 font-medium">Packages</th>
                <th className="px-6 py-3 font-medium">Last updated</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => {
                const stats = statsByBusiness[biz.id] || {}
                return (
                  <tr key={biz.id} className="border-b border-paper/5 last:border-0">
                    <td className="px-6 py-3 font-medium">{biz.name}</td>
                    <td className="px-6 py-3 text-paper/50">/{biz.slug}</td>
                    <td className="px-6 py-3 text-paper/70">{stats.leads ?? '—'}</td>
                    <td className="px-6 py-3 text-paper/70">{stats.packages ?? '—'}</td>
                    <td className="px-6 py-3 text-paper/50">
                      {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleActive(biz)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          biz.is_active ? 'bg-brand-light/20 text-brand-light' : 'bg-paper/10 text-paper/50'
                        }`}
                      >
                        {biz.is_active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-paper/40">
                    No businesses yet — add the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
