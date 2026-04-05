'use client'

import Link from 'next/link'
import { AlertCircle, Clock } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, isStaleClient, isBlockedClient, isCallOverdue, openTaskCount, cn } from '@/lib/utils'
import type { Client, Task } from '@/lib/types'

interface ClientTableProps {
  clients: Client[]
  tasks: Task[]
}

export function ClientTable({ clients, tasks }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients found"
        description="Try adjusting your filters, or add your first client."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Next Call</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Touch</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tasks</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Blocker</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {clients.map((client) => {
            const stale = isStaleClient(client)
            const blocked = isBlockedClient(client)
            const callOverdue = isCallOverdue(client)
            const openTasks = openTaskCount(tasks, client.id)

            return (
              <tr
                key={client.id}
                className="hover:bg-gray-50/70 transition-colors group"
              >
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="block">
                    <div className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                      {client.company || client.name}
                    </div>
                    {client.company && (
                      <div className="text-xs text-gray-400">{client.name}</div>
                    )}
                    {client.summary && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{client.summary}</div>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={client.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={client.priority} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm', callOverdue ? 'text-red-600 font-medium' : 'text-gray-700')}>
                    {formatDate(client.next_call_date)}
                  </span>
                  {callOverdue && <span className="ml-1 text-xs text-red-500">(overdue)</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm', stale ? 'text-amber-600 font-medium' : 'text-gray-700')}>
                    {formatDate(client.last_touch_date)}
                  </span>
                  {stale && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-amber-500" />
                      <span className="text-xs text-amber-500">stale</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-sm font-medium',
                    openTasks > 0 ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {openTasks > 0 ? openTasks : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {blocked ? (
                    <div className="flex items-start gap-1">
                      <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-red-600 line-clamp-2 max-w-[160px]">
                        {client.blocker || 'Status: blocked'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
