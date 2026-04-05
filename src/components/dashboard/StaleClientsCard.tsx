import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelative, cn } from '@/lib/utils'
import type { Client } from '@/lib/types'

export function StaleClientsCard({ clients }: { clients: Client[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stale clients</CardTitle>
        <span className="text-xs text-gray-400">no touch in 14+ days</span>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {clients.length === 0 ? (
          <EmptyState icon={Clock} title="All clients touched recently" className="py-8" />
        ) : (
          <ul className="divide-y divide-gray-50">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.company || c.name}</p>
                    <p className="text-xs text-gray-400">{c.status}</p>
                  </div>
                  <span className="text-xs text-amber-600 font-medium ml-3 shrink-0">
                    {c.last_touch_date ? formatRelative(c.last_touch_date) : 'Never touched'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
