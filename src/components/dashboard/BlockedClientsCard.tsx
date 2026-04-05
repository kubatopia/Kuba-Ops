import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Client } from '@/lib/types'

export function BlockedClientsCard({ clients }: { clients: Client[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked clients</CardTitle>
        {clients.length > 0 && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {clients.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-0 py-0">
        {clients.length === 0 ? (
          <EmptyState icon={AlertCircle} title="Nothing blocked" className="py-8" />
        ) : (
          <ul className="divide-y divide-gray-50">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.company || c.name}</p>
                    <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
                      {c.blocker || 'Status: blocked'}
                    </p>
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
