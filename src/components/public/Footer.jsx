import { useBusiness } from '../../lib/businessContext'

export default function Footer() {
  const { business } = useBusiness()

  return (
    <footer className="border-t border-secondary/20 bg-ink text-paper/80">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              {business?.logo_url && (
                <img
                  src={business.logo_url}
                  alt=""
                  className="h-8 w-8 rounded-full bg-paper object-cover"
                />
              )}
              <p className="font-display text-lg text-brand-light">{business?.name || 'Your Business'}</p>
            </div>
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
        <div className="mt-10 h-px w-full bg-tertiary/30" />
      </div>
    </footer>
  )
}