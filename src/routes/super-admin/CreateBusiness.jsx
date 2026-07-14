import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const initialForm = {
  name: '',
  slug: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  theme_color: '#B5502F',
  admin_email: '',
}

export default function CreateBusiness() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | submitting | error
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setStatus('error')
      setError(data.error || 'Something went wrong')
      return
    }

    navigate('/super-admin', { replace: true })
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-medium">Add a new business</h1>
      <p className="mt-1 text-sm text-paper/50">
        Creates the tenant record and emails an invite to its first business admin.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <Field label="Business name">
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Slug (used in VITE_BUSINESS_SLUG for that client's deployment)">
          <input required value={form.slug} onChange={(e) => update('slug', e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Contact email">
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Contact phone">
          <input value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Address">
          <input value={form.address} onChange={(e) => update('address', e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Theme color">
          <input
            type="color"
            value={form.theme_color}
            onChange={(e) => update('theme_color', e.target.value)}
            className="h-10 w-20 rounded-lg border border-paper/15 bg-transparent"
          />
        </Field>
        <Field label="First business admin's email (they'll get an invite link)">
          <input
            required
            type="email"
            value={form.admin_email}
            onChange={(e) => update('admin_email', e.target.value)}
            className={fieldClass}
          />
        </Field>

        {status === 'error' && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="mt-2 w-fit rounded-full bg-brand-light px-6 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {status === 'submitting' ? 'Creating…' : 'Create business'}
        </button>
      </form>
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
