import { Outlet } from 'react-router-dom'
import { useBusiness } from '../../lib/businessContext'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function PublicLayout() {
  const { business, loading, error } = useBusiness()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink/60">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div>
          <p className="font-display text-2xl text-ink">Site not configured</p>
          <p className="mt-2 max-w-md text-sm text-ink/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={business?.dark_mode ? 'dark' : ''}>
      <div className="flex min-h-screen flex-col bg-surface text-on-surface">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
