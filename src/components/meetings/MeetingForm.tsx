'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { todayInputValue } from '@/lib/utils'
import type { Meeting, MeetingFormData } from '@/lib/types'

interface MeetingFormProps {
  clientId: string
  initial?: Partial<Meeting>
  onSubmit: (data: MeetingFormData) => Promise<void>
  onCancel: () => void
}

export function MeetingForm({ clientId, initial, onSubmit, onCancel }: MeetingFormProps) {
  const [form, setForm] = useState<MeetingFormData>({
    client_id: clientId,
    meeting_date: initial?.meeting_date ?? todayInputValue(),
    summary: initial?.summary ?? '',
    decisions: initial?.decisions ?? '',
    follow_ups: initial?.follow_ups ?? '',
    next_meeting_date: initial?.next_meeting_date ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof MeetingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.meeting_date) { setError('Meeting date is required'); return }
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

      <div className="grid grid-cols-2 gap-4">
        <Input label="Meeting date *" type="date" value={form.meeting_date} onChange={set('meeting_date')} />
        <Input label="Next meeting date" type="date" value={form.next_meeting_date ?? ''} onChange={set('next_meeting_date')} />
      </div>

      <Textarea
        label="Summary"
        value={form.summary ?? ''}
        onChange={set('summary')}
        rows={3}
        placeholder="What happened? Key discussion points, where things stand."
      />

      <Textarea
        label="Decisions made"
        value={form.decisions ?? ''}
        onChange={set('decisions')}
        rows={2}
        placeholder="What was agreed on? Any direction changes?"
      />

      <Textarea
        label="Follow-ups"
        value={form.follow_ups ?? ''}
        onChange={set('follow_ups')}
        rows={2}
        placeholder="Action items to track. Use Tasks for formal tracking, this is a quick log."
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save changes' : 'Log update'}
        </Button>
      </div>
    </form>
  )
}
