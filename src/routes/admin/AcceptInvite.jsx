import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

/**
 * Landing page for Supabase Auth invite links. When someone clicks the
 * invite email, Supabase's client library automatically parses the
 * access_token out of the URL hash and establishes a session — but
 * nothing then prompts them to actually set a password. This page is that
 * missing step: check for a session, then let them choose a password via
 * supabase.auth.updateUser(), then send them into /admin.
 */
export default function AcceptInvite() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setCheckingSession(false)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink/60">
        Loading…
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div>
          <p className="font-display text-2xl text-ink">Invite link invalid or expired</p>
          <p className="mt-2 text-sm text-ink/60">
            Ask a super admin to send a new invite from the Super Admin panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-medium text-ink">Set your password</h1>
        <p className="mt-1 text-sm text-ink/50">
          Choose a password to finish setting up your admin account.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Set password & continue'}
        </button>
      </form>
    </div>
  )
}
