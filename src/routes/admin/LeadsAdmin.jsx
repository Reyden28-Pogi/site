import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'

const STATUSES = ['new', 'contacted', 'closed']

export default function LeadsAdmin() {
  const { appUser } = useAuth()
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('created_at', { ascending: false })
    setLeads(data || [])
  }

  useEffect(() => {
    if (appUser?.business_id) load()
  }, [appUser])

  async function updateStatus(id, status) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    await supabase.from('leads').update({ status }).eq('id', id)
  }

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        lead.name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.event_type?.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [leads, search, statusFilter])

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Leads</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, event type…"
          className="input max-w-xs"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/50">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Event</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Guests</th>
              <th className="px-6 py-3 font-medium">Message</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-ink/5 align-top last:border-0">
                <td className="px-6 py-3 font-medium">{lead.name}</td>
                <td className="px-6 py-3 text-ink/60">
                  <p>{lead.email}</p>
                  {lead.phone && <p>{lead.phone}</p>}
                </td>
                <td className="px-6 py-3 text-ink/60">{lead.event_type || '—'}</td>
                <td className="px-6 py-3 text-ink/60">{lead.event_date || '—'}</td>
                <td className="px-6 py-3 text-ink/60">{lead.guest_count ?? '—'}</td>
                <td className="max-w-xs px-6 py-3 text-ink/60">{lead.message || '—'}</td>
                <td className="px-6 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="input py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-ink/40">
                  No leads match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
