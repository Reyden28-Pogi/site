import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

/**
 * Gates a route tree behind Supabase Auth + an app-level role check.
 * role="business_admin" also accepts super_admin (super admins can view,
 * per the brief, but note the Super Admin panel intentionally does not
 * expose per-business content editing — that stays business_admin's job).
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

  const authorized =
    role === 'super_admin' ? isSuperAdmin : appUser?.role === role || isSuperAdmin

  if (!authorized) {
    return <Navigate to={loginPath} replace />
  }

  return children
}
