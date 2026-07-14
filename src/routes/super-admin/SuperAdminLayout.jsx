import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function SuperAdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/super-admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="flex items-center justify-between border-b border-paper/10 px-8 py-5">
        <div className="flex items-center gap-8">
          <p className="font-display text-lg">Control</p>
          <nav className="flex gap-6 text-sm">
            <NavLink
              to="/super-admin"
              end
              className={({ isActive }) => (isActive ? 'text-brand-light' : 'text-paper/60')}
            >
              Businesses
            </NavLink>
            <NavLink
              to="/super-admin/new"
              className={({ isActive }) => (isActive ? 'text-brand-light' : 'text-paper/60')}
            >
              Add business
            </NavLink>
          </nav>
        </div>
        <button onClick={handleSignOut} className="text-sm text-paper/50 hover:text-paper">
          Sign out
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-8 py-10">
        <Outlet />
      </main>
    </div>
  )
}
