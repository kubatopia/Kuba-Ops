'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))

    Promise.race([supabase.auth.getSession(), timeout])
      .then((result) => {
        if (result && 'data' in result) {
          setUser(result.data.session?.user ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user && pathname !== '/login') {
      router.push('/login')
    }
    if (user && pathname === '/login') {
      router.push('/')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  // On login page, render regardless
  if (pathname === '/login') return <>{children}</>

  // Protected — only render if authenticated
  if (!user) return null

  return <>{children}</>
}
