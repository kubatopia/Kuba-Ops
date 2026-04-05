'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KubaLogo } from './KubaLogo'

const NAV = [
  { href: '/',        label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/clients', label: 'Clients',       icon: Users },
  { href: '/metrics', label: 'Metrics',       icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-white border-r border-gray-200">
      {/* Wordmark */}
      <div className="px-4 py-4 border-b border-gray-100">
        <KubaLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon  }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
