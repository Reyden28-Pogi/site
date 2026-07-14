import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBusiness } from '../../lib/businessContext'
import TurnstileWidget from '../../components/public/TurnstileWidget.jsx'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  event_type: '',
  event_date: '',
  guest_count: '',
  message: '',
}

export default function Contact() {
  const { business } = useBusiness()
  const [form, setForm] = useState(initialForm)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!business) return

    if (!turnstileToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      setStatus('error')
      setErrorMessage('Please complete the captcha before submitting.')
      return
    }

    setStatus('submitting')
    setErrorMessage(null)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-lead`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turnstile_token: turnstileToken,
            business_id: business.id,
            ...form,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong sending your request.')
        return
      }

      setStatus('success')
      setForm(initialForm)
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong sending your request.')
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="brush-underline font-display text-3xl font-medium text-ink">
        Request a quote
      </h1>
      <p className="mt-4 text-ink/60">
        Tell us a bit about your event and {business?.name || 'we'}'ll be in touch soon.
      </p>

      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-xl border border-brand/30 bg-brand/5 p-6 text-brand-dark"
        >
          Thanks — your request has been sent. We'll follow up by email shortly.
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Event type">
              <input
                value={form.event_type}
                onChange={(e) => update('event_type', e.target.value)}
                placeholder="Wedding, corporate, birthday…"
                className="input"
              />
            </Field>
            <Field label="Event date">
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => update('event_date', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Guest count">
              <input
                type="number"
                min="0"
                value={form.guest_count}
                onChange={(e) => update('guest_count', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Message">
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              className="input"
            />
          </Field>

          <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

          {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 w-fit rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper transition-transform hover:scale-105 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/70">{label}</span>
      {children}
    </label>
  )
}
