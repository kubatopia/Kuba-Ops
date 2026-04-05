'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Phone, AlertTriangle, Clock, AlertCircle, StickyNote } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatusBadge, PriorityBadge, TaskTypeBadge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useClients } from '@/hooks/useClients'
import { useTasks } from '@/hooks/useTasks'
import {
  isUpcomingCall, isStaleClient, isBlockedClient, isOverdueTask,
  formatDate, formatRelative,
} from '@/lib/utils'

export default function WeeklyPage() {
  const { clients, loading: clientsLoading } = useClients()
  const { tasks, loading: tasksLoading } = useTasks()
  const [notes, setNotes] = useState('')

  const upcomingCalls  = useMemo(() => clients.filter(isUpcomingCall), [clients])
  const staleClients   = useMemo(() => clients.filter(isStaleClient), [clients])
  const blockedClients = useMemo(() => clients.filter(isBlockedClient), [clients])
  const overdueTasks   = useMemo(() => tasks.filter(isOverdueTask), [tasks])

  if (clientsLoading || tasksLoading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Weekly Review</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Use this to orient yourself before the week. What needs to move?
        </p>
      </div>

      <div className="space-y-6">
        {/* Upcoming calls */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-blue-500" />
              <CardTitle>Calls this week</CardTitle>
            </div>
            <span className="text-xs text-gray-400">{upcomingCalls.length} scheduled</span>
          </CardHeader>
          <CardContent className="py-0 px-0">
            {upcomingCalls.length === 0 ? (
              <EmptyState title="No calls scheduled" className="py-6" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {upcomingCalls.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">{c.company || c.name}</span>
                        {c.company && <span className="text-xs text-gray-400 ml-2">{c.name}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.status} />
                        <span className="text-sm font-medium text-blue-600">{formatDate(c.next_call_date)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Overdue tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <CardTitle>Overdue tasks</CardTitle>
            </div>
            {overdueTasks.length > 0 && (
              <span className="text-xs font-semibold text-red-600">{overdueTasks.length} overdue</span>
            )}
          </CardHeader>
          <CardContent className="py-0 px-0">
            {overdueTasks.length === 0 ? (
              <EmptyState title="No overdue tasks" className="py-6" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {overdueTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/clients/${t.client_id}`}
                      className="flex items-start justify-between px-5 py-3 hover:bg-gray-50 transition-colors gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.client?.company || t.client?.name}
                          {t.next_step && <> · {t.next_step}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.task_type && <TaskTypeBadge type={t.task_type} />}
                        <PriorityBadge priority={t.priority} />
                        <span className="text-xs font-medium text-red-600">{formatDate(t.due_date)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Stale clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <CardTitle>Clients not touched in 14+ days</CardTitle>
            </div>
            {staleClients.length > 0 && (
              <span className="text-xs font-semibold text-amber-600">{staleClients.length}</span>
            )}
          </CardHeader>
          <CardContent className="py-0 px-0">
            {staleClients.length === 0 ? (
              <EmptyState title="All clients touched recently" className="py-6" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {staleClients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">{c.company || c.name}</span>
                        <StatusBadge status={c.status} className="ml-2" />
                      </div>
                      <span className="text-xs text-amber-600 font-medium">
                        {c.last_touch_date ? formatRelative(c.last_touch_date) : 'Never'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Blocked */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400" />
              <CardTitle>Blocked</CardTitle>
            </div>
            {blockedClients.length > 0 && (
              <span className="text-xs font-semibold text-red-600">{blockedClients.length}</span>
            )}
          </CardHeader>
          <CardContent className="py-0 px-0">
            {blockedClients.length === 0 ? (
              <EmptyState title="Nothing blocked" className="py-6" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {blockedClients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.company || c.name}</p>
                        <p className="text-sm text-red-600 mt-0.5">{c.blocker || 'Status: blocked'}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StickyNote size={15} className="text-gray-400" />
              <CardTitle>Quick notes for this week</CardTitle>
            </div>
            <span className="text-xs text-gray-400">session only, not saved</span>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Priorities, reminders, things on your mind this week..."
              className="w-full text-sm text-gray-700 placeholder-gray-300 resize-y border-0 bg-transparent focus:outline-none leading-relaxed"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
