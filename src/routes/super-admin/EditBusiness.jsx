import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function EditBusiness() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    supabase
      .from('businesses')
      .select('id, name, slug, contact_email, contact_phone, address, is_active')
      .eq('id', businessId)
      .single()
      .then(({ data }) => {
        setForm(data)
        setLoading(false)
      })
  }, [businessId])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
        slug: form.slug,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        address: form.address,
      })
      .eq('id', businessId)

    setSaving(false)
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('success')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)

    const { error } = await supabase.from('businesses').delete().eq('id', businessId)

    setDeleting(false)
    if (error) {
      setDeleteError(error.message)
    } else {
      navigate('/super-admin', { replace: true })
    }
  }

  if (loading) return <p className="text-paper/50">Loading…</p>
  if (!form) return <p className="text-red-400">Business not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-medium">Edit business</h1>
      <p className="mt-1 text-sm text-paper/50">
        Tenant-management fields only. Logo, brand colors, fonts, and About
        text are that business's own admin's job — edit those by signing
        in as their business_admin, not here.
      </p>

      <form onSubmit={handleSave} className="mt-8 grid gap-4">
        <Field label="Business name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Slug">
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-amber-400">
            Changing this breaks that tenant's site until you also update
            VITE_BUSINESS_SLUG in their Vercel project's environment
            variables.
          </p>
        </Field>
        <Field label="Contact email">
          <input
            type="email"
            value={form.contact_email || ''}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Contact phone">
          <input
            value={form.contact_phone || ''}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Address">
          <input
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={fieldClass}
          />
        </Field>

        {status === 'error' && <p className="text-sm text-red-400">{errorMessage}</p>}
        {status === 'success' && <p className="text-sm text-brand-light">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-full bg-brand-light px-6 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-12 rounded-xl border border-red-900/50 bg-red-950/20 p-6">
        <h2 className="font-display text-lg text-red-400">Danger zone</h2>
        <p className="mt-2 text-sm text-paper/60">
          Deleting a business permanently removes it and everything
          attached to it — packages, gallery photos, blog posts,
          testimonials, reviews, and leads. This cannot be undone. Their
          business_admin's login account isn't deleted, but it'll no
          longer be linked to any business.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm text-paper/60">
            Type <strong>{form.name}</strong> to confirm
          </span>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className={fieldClass}
          />
        </label>
        {deleteError && <p className="mt-2 text-sm text-red-400">{deleteError}</p>}
        <button
          type="button"
          disabled={deleteConfirmText !== form.name || deleting}
          onClick={handleDelete}
          className="mt-4 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Permanently delete this business'}
        </button>
      </div>
    </div>
  )
}

const fieldClass =
  'w-full rounded-lg border border-paper/15 bg-transparent px-4 py-2.5 text-sm text-paper outline-none focus:border-brand-light'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-paper/70">{label}</span>
      {children}
    </label>
  )
}