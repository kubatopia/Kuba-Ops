import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateShort, isCallOverdue, cn } from '@/lib/utils'
import type { Client } from '@/lib/types'

export function UpcomingCallsCard({ clients }: { clients: Client[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming calls</CardTitle>
        <span className="text-xs text-gray-400">next 7 days</span>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {clients.length === 0 ? (
          <EmptyState icon={Phone} title="No calls scheduled this week" className="py-8" />
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
                    <p className="text-xs text-gray-400">{c.company ? c.name : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <PriorityBadge priority={c.priority} />
                    <span className={cn(
                      'text-xs font-medium',
                      isCallOverdue(c) ? 'text-red-600' : 'text-gray-700'
                    )}>
                      {formatDateShort(c.next_call_date)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
