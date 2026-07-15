import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'
import ImageUploader from '../../components/admin/ImageUploader.jsx'

const emptyForm = { id: null, name: '', description: '', price: '', image_url: null, is_active: true }

export default function PackagesAdmin() {
  const { appUser } = useAuth()
  const [packages, setPackages] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('created_at', { ascending: false })
    if (error) {
      setErrorMessage(`Couldn't load packages: ${error.message}`)
      return
    }
    setPackages(data || [])
  }

  useEffect(() => {
    if (appUser?.business_id) load()
  }, [appUser])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    const payload = {
      business_id: appUser.business_id,
      name: form.name,
      description: form.description,
      price: form.price === '' ? null : Number(form.price),
      image_url: form.image_url,
      is_active: form.is_active,
    }

    const { error } = form.id
      ? await supabase.from('packages').update(payload).eq('id', form.id)
      : await supabase.from('packages').insert(payload)

    setSaving(false)

    if (error) {
      setErrorMessage(`Couldn't save: ${error.message}`)
      return
    }

    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) {
      setErrorMessage(`Couldn't delete: ${error.message}`)
      return
    }
    load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Packages</h1>

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
      )}

      <form onSubmit={handleSave} className="mt-8 grid gap-4 rounded-2xl border border-ink/10 bg-white p-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/70">Name</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/70">Description</span>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Price (USD)</span>
          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          <span className="text-sm text-ink/70">Published on site</span>
        </label>

        <div className="sm:col-span-2">
          <ImageUploader
            imageUrl={form.image_url}
            onUploaded={(url) => setForm({ ...form, image_url: url })}
            label="Package image"
          />
        </div>

        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" disabled={saving} className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60">
            {saving ? 'Saving…' : form.id ? 'Update package' : 'Add package'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-medium text-ink/60">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-2xl border border-ink/10 bg-white p-5">
            {pkg.image_url && (
              <img src={pkg.image_url} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
            )}
            <p className="font-medium text-ink">{pkg.name}</p>
            <p className="text-sm text-ink/50">{pkg.is_active ? 'Published' : 'Hidden'}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setForm(pkg)} className="text-sm font-medium text-brand hover:underline">
                Edit
              </button>
              <button onClick={() => handleDelete(pkg.id)} className="text-sm font-medium text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
