'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { TASK_STATUSES, TASK_TYPES, PRIORITIES } from '@/lib/constants'
import type { Task, TaskFormData } from '@/lib/types'

interface TaskFormProps {
  clientId: string
  initial?: Partial<Task>
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ clientId, initial, onSubmit, onCancel }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    client_id: clientId,
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    due_date: initial?.due_date ?? '',
    status: initial?.status ?? 'not started',
    priority: initial?.priority ?? 'medium',
    task_type: initial?.task_type ?? null,
    next_step: initial?.next_step ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof TaskFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value || (key === 'task_type' ? null : e.target.value) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required'); return }
    try {
      setLoading(true)
      setError(null)
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Input
        label="Task title *"
        value={form.title}
        onChange={set('title')}
        placeholder="What needs to happen?"
      />

      <Textarea
        label="Description"
        value={form.description ?? ''}
        onChange={set('description')}
        rows={2}
        placeholder="Context, scope, requirements..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          value={form.task_type ?? ''}
          onChange={set('task_type')}
          placeholder="Select type"
          options={TASK_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={set('priority')}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Input label="Due date" type="date" value={form.due_date ?? ''} onChange={set('due_date')} />
      </div>

      <Input
        label="Next step"
        value={form.next_step ?? ''}
        onChange={set('next_step')}
        placeholder="Concrete first action to make progress on this task"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save changes' : 'Add task'}
        </Button>
      </div>
    </form>
  )
}
