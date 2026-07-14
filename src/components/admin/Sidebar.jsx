import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/packages', label: 'Packages' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/blog', label: 'Blog' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function Sidebar({ onSignOut }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-6 py-5">
        <p className="font-display text-lg font-medium">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-brand/10 text-brand' : 'text-ink/60 hover:bg-ink/5'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink/10 p-4">
        <button
          onClick={onSignOut}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/50 hover:bg-ink/5"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
