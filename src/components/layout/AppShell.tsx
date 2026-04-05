'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { KubaDiamond } from './KubaLogo'
import { supabase } from '@/lib/supabase'

function getInitials(email: string) {
  const parts = email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null)
    })
  }, [])

  if (pathname === '/login') return <>{children}</>

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = email ? getInitials(email) : '?'
  const displayName = email ? email.split('@')[0] : ''

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 shrink-0 bg-white border-b border-gray-100 flex items-center justify-end gap-3 px-6 relative">
          <div className="absolute left-1/2 -translate-x-1/2">
            <KubaDiamond size={28} />
          </div>
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <span className="text-sm text-gray-700 font-medium">{displayName}</span>
          </div>

          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
