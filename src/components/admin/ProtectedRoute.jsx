import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

/**
 * Gates a route tree behind Supabase Auth + an app-level role check.
 * The two roles are kept strictly separate: super_admin cannot access
 * `/admin` (business_admin routes), and business_admin cannot access
 * `/super-admin` — per the platform's design, a super_admin manages
 * tenants only and never edits an individual business's own content.
 */
export default function ProtectedRoute({ role, children }) {
  const { session, appUser, loading, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone">
        Loading…
      </div>
    )
  }

  const loginPath = role === 'super_admin' ? '/super-admin/login' : '/admin/login'

  if (!session) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  const authorized = role === 'super_admin' ? isSuperAdmin : appUser?.role === role

  if (!authorized) {
    return <Navigate to={loginPath} replace />
  }

  return children
}