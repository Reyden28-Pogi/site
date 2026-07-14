import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Wraps Supabase Auth session state and joins it against our `users` table
 * to expose the app-level role ('super_admin' | 'business_admin') and
 * business_id used to drive RLS-scoped queries and route guards.
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(currentSession)
      if (currentSession) await loadAppUser(currentSession.user.id)
      setLoading(false)
    }

    async function loadAppUser(authId) {
      const { data } = await supabase
        .from('users')
        .select('id, role, business_id, email')
        .eq('auth_id', authId)
        .single()
      if (!cancelled) setAppUser(data ?? null)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadAppUser(newSession.user.id)
      } else {
        setAppUser(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return {
    session,
    appUser,
    loading,
    isSuperAdmin: appUser?.role === 'super_admin',
    isBusinessAdmin: appUser?.role === 'business_admin',
    signIn,
    signOut,
  }
}
