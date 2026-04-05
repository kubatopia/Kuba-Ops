import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { TaskTypeBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateShort } from '@/lib/utils'
import type { Task } from '@/lib/types'

export function OverdueTasksCard({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue tasks</CardTitle>
        {tasks.length > 0 && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-0 py-0">
        {tasks.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No overdue tasks" className="py-8" />
        ) : (
          <ul className="divide-y divide-gray-50">
            {tasks.slice(0, 8).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/clients/${t.client_id}`}
                  className="flex items-start justify-between px-5 py-3 hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">
                      {t.client?.company || t.client?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.task_type && <TaskTypeBadge type={t.task_type} />}
                    <span className="text-xs font-medium text-red-600">
                      {formatDateShort(t.due_date)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {tasks.length > 8 && (
              <li className="px-5 py-2">
                <Link href="/tasks?view=overdue" className="text-xs text-brand-600 hover:text-brand-800">
                  +{tasks.length - 8} more overdue →
                </Link>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
