import { useBusiness } from '../../lib/businessContext'

export default function Footer() {
  const { business } = useBusiness()

  return (
    <footer className="border-t border-ink/10 bg-ink text-paper/80">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-lg text-paper">{business?.name || 'Your Business'}</p>
            {business?.address && <p className="mt-2 text-sm">{business.address}</p>}
          </div>
          <div className="text-sm">
            {business?.contact_email && <p>{business.contact_email}</p>}
            {business?.contact_phone && <p>{business.contact_phone}</p>}
          </div>
          <div className="text-sm text-paper/50">
            © {new Date().getFullYear()} {business?.name || 'Your Business'}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
