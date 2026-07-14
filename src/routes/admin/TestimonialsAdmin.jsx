import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'

const emptyForm = { id: null, client_name: '', quote: '', rating: 5, is_visible: true }

export default function TestimonialsAdmin() {
  const { appUser } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => {
    if (appUser?.business_id) load()
  }, [appUser])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      business_id: appUser.business_id,
      client_name: form.client_name,
      quote: form.quote,
      rating: Number(form.rating),
      is_visible: form.is_visible,
    }

    if (form.id) {
      await supabase.from('testimonials').update(payload).eq('id', form.id)
    } else {
      await supabase.from('testimonials').insert(payload)
    }

    setSaving(false)
    setForm(emptyForm)
    load()
  }

  async function toggleVisible(item) {
    await supabase.from('testimonials').update({ is_visible: !item.is_visible }).eq('id', item.id)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this testimonial?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Testimonials</h1>

      <form onSubmit={handleSave} className="mt-8 grid gap-4 rounded-2xl border border-ink/10 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Client name</span>
          <input
            required
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Quote</span>
          <textarea
            required
            rows={3}
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            className="input"
          />
        </label>
        <label className="block w-32">
          <span className="mb-1 block text-sm font-medium text-ink/70">Rating</span>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="input">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_visible}
            onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
          />
          <span className="text-sm text-ink/70">Visible on site</span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {saving ? 'Saving…' : form.id ? 'Update' : 'Add testimonial'}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-medium text-ink/60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-ink/10 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-ink">{item.client_name}</p>
                <p className="mt-1 text-sm text-ink/60">“{item.quote}”</p>
                <p className="mt-1 text-xs text-ink/40">{'★'.repeat(item.rating)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => toggleVisible(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    item.is_visible ? 'bg-brand/10 text-brand' : 'bg-ink/5 text-ink/50'
                  }`}
                >
                  {item.is_visible ? 'Visible' : 'Hidden'}
                </button>
                <button onClick={() => setForm(item)} className="text-sm font-medium text-brand hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-sm font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
