'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Plus, CalendarDays, Phone, Clock,
  AlertCircle, Tag, User, FileText, CheckCircle2
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ClientForm } from '@/components/clients/ClientForm'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { MeetingList } from '@/components/meetings/MeetingList'
import { MeetingForm } from '@/components/meetings/MeetingForm'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useClient } from '@/hooks/useClients'
import { useActivities } from '@/hooks/useActivities'
import { supabase, logActivity } from '@/lib/supabase'
import { formatDate, formatRelative } from '@/lib/utils'
import type { ClientFormData, TaskFormData, MeetingFormData, Task } from '@/lib/types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { client, loading, refetch } = useClient(id)
  const { activities, loading: activitiesLoading, refetch: refetchActivities } = useActivities(id)

  const [editOpen, setEditOpen]       = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addMeetingOpen, setAddMeetingOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab]     = useState<'tasks' | 'meetings' | 'activity'>('tasks')

  if (loading) return <LoadingSpinner />
  if (!client) return (
    <div className="p-8 text-center text-gray-500">
      Client not found.{' '}
      <Link href="/clients" className="text-brand-600 hover:underline">Back to clients</Link>
    </div>
  )

  const openTasks     = client.tasks?.filter((t) => t.status !== 'done') ?? []
  const completedTasks = client.tasks?.filter((t) => t.status === 'done') ?? []
  const meetings       = client.meetings ?? []

  // ── Mutations ────────────────────────────────────────────────────────────

  const handleEditClient = async (data: ClientFormData) => {
    const { error } = await supabase.from('clients').update(data).eq('id', id)
    if (error) throw error

    if (data.status !== client.status) {
      await logActivity(id, 'status_updated', `Status → ${data.status}`)
    }
    if (data.priority !== client.priority) {
      await logActivity(id, 'priority_updated', `Priority → ${data.priority}`)
    }
    if (data.blocker !== client.blocker) {
      await logActivity(id, 'blocker_updated', `Blocker updated`)
    }
    if (data.next_call_date !== client.next_call_date) {
      await logActivity(id, 'next_call_updated', `Next call → ${formatDate(data.next_call_date)}`)
    }
    setEditOpen(false)
    refetch()
    refetchActivities()
  }

  const handleAddTask = async (data: TaskFormData) => {
    const { data: task, error } = await supabase.from('tasks').insert(data).select().single()
    if (error) throw error
    await logActivity(id, 'task_added', `Task added: ${task.title}`)
    setAddTaskOpen(false)
    refetch()
    refetchActivities()
  }

  const handleEditTask = async (data: TaskFormData) => {
    if (!editingTask) return
    const { error } = await supabase.from('tasks').update(data).eq('id', editingTask.id)
    if (error) throw error
    setEditingTask(null)
    refetch()
  }

  const handleCompleteTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', task.id)
    if (error) throw error
    await logActivity(id, 'task_completed', `Task done: ${task.title}`)
    refetch()
    refetchActivities()
  }

  const handleAddMeeting = async (data: MeetingFormData) => {
    const { error } = await supabase.from('meetings').insert(data)
    if (error) throw error

    // Also update last_touch_date and next_call_date on client
    const updates: Record<string, string | null> = {
      last_touch_date: data.meeting_date,
    }
    if (data.next_meeting_date) {
      updates.next_call_date = data.next_meeting_date
    }
    await supabase.from('clients').update(updates).eq('id', id)
    await logActivity(id, 'meeting_added', `Update logged for ${formatDate(data.meeting_date)}`)
    setAddMeetingOpen(false)
    refetch()
    refetchActivities()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${client.company || client.name}? This cannot be undone.`)) return
    await supabase.from('clients').delete().eq('id', id)
    router.push('/clients')
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {client.company || client.name}
          </h1>
          {client.company && (
            <p className="text-sm text-gray-500 mt-0.5">{client.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={client.status} />
            <PriorityBadge priority={client.priority} />
            {client.category && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {client.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAddTaskOpen(true)}>
            <Plus size={14} /> Task
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAddMeetingOpen(true)}>
            <CalendarDays size={14} /> Log update
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit2 size={14} /> Edit
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Left: Client info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {client.summary && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{client.summary}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <InfoRow icon={Phone} label="Next call" value={formatDate(client.next_call_date)} />
                <InfoRow icon={Clock} label="Last touch" value={client.last_touch_date
                  ? `${formatDate(client.last_touch_date)} (${formatRelative(client.last_touch_date)})`
                  : '—'}
                />
                {client.owner && <InfoRow icon={User} label="Owner" value={client.owner} />}
                {client.category && <InfoRow icon={Tag} label="Category" value={client.category} />}
              </div>

              {client.blocker && (
                <div className="bg-red-50 border border-red-100 rounded-md p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={13} className="text-red-500" />
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Blocker</span>
                  </div>
                  <p className="text-sm text-red-700">{client.blocker}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <FileText size={14} className="text-gray-300" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Danger zone */}
          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Delete client…
            </button>
          </div>
        </div>

        {/* Right: Tasks, Meetings, Activity */}
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 mb-5">
            {(['tasks', 'meetings', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'tasks' && openTasks.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                    {openTasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'tasks' && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Open tasks</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setAddTaskOpen(true)}>
                    <Plus size={13} /> Add
                  </Button>
                </CardHeader>
                <CardContent className="py-1">
                  <TaskList
                    tasks={openTasks}
                    onComplete={handleCompleteTask}
                    onEdit={(t) => setEditingTask(t)}
                    emptyMessage="No open tasks"
                  />
                </CardContent>
              </Card>

              {completedTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-400">
                      <CheckCircle2 size={14} className="inline mr-1.5" />
                      Completed ({completedTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <TaskList tasks={completedTasks} emptyMessage="" />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'meetings' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button variant="secondary" size="sm" onClick={() => setAddMeetingOpen(true)}>
                  <Plus size={13} /> Log update
                </Button>
              </div>
              <MeetingList meetings={meetings} />
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityFeed activities={activities} loading={activitiesLoading} />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit client" size="lg">
        <ClientForm initial={client} onSubmit={handleEditClient} onCancel={() => setEditOpen(false)} />
      </Modal>

      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Add task">
        <TaskForm clientId={id} onSubmit={handleAddTask} onCancel={() => setAddTaskOpen(false)} />
      </Modal>

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit task">
        {editingTask && (
          <TaskForm
            clientId={id}
            initial={editingTask}
            onSubmit={handleEditTask}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>

      <Modal open={addMeetingOpen} onClose={() => setAddMeetingOpen(false)} title="Log update">
        <MeetingForm clientId={id} onSubmit={handleAddMeeting} onCancel={() => setAddMeetingOpen(false)} />
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-gray-300 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-gray-400">{label}: </span>
        <span className="text-xs text-gray-700">{value}</span>
      </div>
    </div>
  )
}
