import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function SuperAdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
    } else {
      navigate(location.state?.from?.pathname || '/super-admin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-paper/10 bg-ink p-8 shadow-sm">
        <h1 className="font-display text-2xl font-medium text-paper">Super admin</h1>
        <p className="mt-1 text-sm text-paper/50">Tenant management console.</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-paper/70">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-paper/15 bg-transparent px-4 py-2.5 text-sm text-paper outline-none focus:border-brand-light"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-paper/70">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-paper/15 bg-transparent px-4 py-2.5 text-sm text-paper outline-none focus:border-brand-light"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-brand-light py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
