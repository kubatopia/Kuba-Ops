'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskFilters, type TaskFilterState } from '@/components/tasks/TaskFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useTasks } from '@/hooks/useTasks'
import { supabase, logActivity } from '@/lib/supabase'
import { isOverdueTask, isDueThisWeek } from '@/lib/utils'
import type { Task } from '@/lib/types'

const defaultFilters: TaskFilterState = {
  status: '', priority: '', type: '', view: 'all',
}

export default function TasksPage() {
  const { tasks, loading, refetch } = useTasks()
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters)

  const filtered = useMemo(() => {
    let result = tasks

    // Apply view first
    switch (filters.view) {
      case 'overdue':
        result = result.filter(isOverdueTask)
        break
      case 'this-week':
        result = result.filter((t) => isDueThisWeek(t) && !isOverdueTask(t))
        break
      case 'done':
        result = result.filter((t) => t.status === 'done')
        break
      default: // 'all' — open tasks
        result = result.filter((t) => t.status !== 'done')
    }

    // Then apply additional filters
    if (filters.priority) result = result.filter((t) => t.priority === filters.priority)
    if (filters.type) result = result.filter((t) => t.task_type === filters.type)

    return result
  }, [tasks, filters])

  const handleComplete = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', task.id)
    if (error) throw error
    await logActivity(task.client_id, 'task_completed', `Task done: ${task.title}`)
    refetch()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-4">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <CardContent className="py-1">
            <TaskList
              tasks={filtered}
              showClient
              onComplete={filters.view !== 'done' ? handleComplete : undefined}
              emptyMessage={
                filters.view === 'overdue' ? 'No overdue tasks' :
                filters.view === 'this-week' ? 'No tasks due this week' :
                filters.view === 'done' ? 'No completed tasks' :
                'No open tasks'
              }
            />
          </CardContent>
        )}
      </Card>
    </div>
  )
}
