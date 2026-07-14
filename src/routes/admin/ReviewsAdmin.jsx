import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'

export default function ReviewsAdmin() {
  const { appUser } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!appUser?.business_id) {
      setLoading(false)
      return
    }
    supabase
      .from('reviews')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [appUser])

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Reviews</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/50">
        These are submitted directly by visitors to your site. This is a
        view-only list — reviews can't be edited or deleted from here, the
        same way you can't edit or delete a Google review. If something
        here looks abusive or fake, contact your super admin to have it
        reviewed.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-ink/50">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-8 text-sm text-ink/50">No reviews yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-ink/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{review.client_name}</p>
                <span className="text-brand">
                  {'★'.repeat(review.rating)}
                  <span className="text-ink/15">{'★'.repeat(5 - review.rating)}</span>
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-ink/70">{review.comment}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-ink/40">
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                {!review.is_visible && (
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 font-medium">
                    Hidden by super admin
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
