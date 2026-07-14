import { useState } from 'react'
import { motion } from 'framer-motion'
import TurnstileWidget from './TurnstileWidget.jsx'

function Stars({ rating, size = 'text-base' }) {
  return (
    <span className={`${size} text-tertiary`} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span className="text-ink/15">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

const initialForm = { client_name: '', rating: 0, comment: '' }

/** businessId is required so the submission form knows what to attach the review to. */
export default function ClientReviews({ businessId, reviews }) {
  const [form, setForm] = useState(initialForm)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState(null)

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.rating) {
      setStatus('error')
      setErrorMessage('Please choose a star rating.')
      return
    }
    if (!turnstileToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      setStatus('error')
      setErrorMessage('Please complete the captcha before submitting.')
      return
    }

    setStatus('submitting')
    setErrorMessage(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstile_token: turnstileToken,
          business_id: businessId,
          ...form,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong submitting your review.')
        return
      }

      setStatus('success')
      setForm(initialForm)
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong submitting your review.')
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <h2 className="brush-underline font-display text-2xl font-medium text-ink">Client reviews</h2>
        {averageRating && (
          <p className="mt-4 text-sm text-ink/60">
            <Stars rating={Math.round(averageRating)} size="text-lg" /> {averageRating} average from{' '}
            {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-10 space-y-6">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              className="rounded-xl border border-ink/10 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{review.client_name}</p>
                <Stars rating={review.rating} />
              </div>
              {review.comment && <p className="mt-2 text-sm text-ink/70">{review.comment}</p>}
              <p className="mt-2 text-xs text-ink/40">{new Date(review.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-ink/10 bg-white p-6">
        <h3 className="font-display text-lg font-medium text-ink">Leave a review</h3>

        {status === 'success' ? (
          <p className="mt-4 text-sm text-brand">Thanks for your review!</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Your name</span>
              <input
                required
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="input"
              />
            </label>

            <div>
              <span className="mb-1 block text-sm font-medium text-ink/70">Your rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    className={`text-2xl leading-none ${n <= form.rating ? 'text-tertiary' : 'text-ink/15'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Comment (optional)</span>
              <textarea
                rows={3}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="input"
              />
            </label>

            <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

            {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-fit rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
