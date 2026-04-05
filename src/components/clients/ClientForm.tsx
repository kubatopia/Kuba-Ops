'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { CLIENT_STATUSES, PRIORITIES, CATEGORIES } from '@/lib/constants'
import { useProfiles } from '@/hooks/useProfiles'
import type { Client, ClientFormData } from '@/lib/types'

interface ClientFormProps {
  initial?: Partial<Client>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
}

export function ClientForm({ initial, onSubmit, onCancel }: ClientFormProps) {
  const { profiles } = useProfiles()
  const [form, setForm] = useState<ClientFormData>({
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    summary: initial?.summary ?? '',
    status: initial?.status ?? 'active research',
    priority: initial?.priority ?? 'medium',
    owner: initial?.owner ?? '',
    assigned_to: initial?.assigned_to ?? null,
    next_call_date: initial?.next_call_date ?? '',
    last_touch_date: initial?.last_touch_date ?? '',
    blocker: initial?.blocker ?? '',
    category: initial?.category ?? '',
    notes: initial?.notes ?? '',
    current_company: initial?.current_company ?? null,
    rollover_amount: initial?.rollover_amount ?? null,
    linkedin_url: initial?.linkedin_url ?? null,
    linkedin_activity: initial?.linkedin_activity ?? null,
    birthday: initial?.birthday ?? null,
    interests: initial?.interests ?? null,
    engagement_manager: initial?.engagement_manager ?? null,
    compliance_manager: initial?.compliance_manager ?? null,
    entrepreneur: initial?.entrepreneur ?? null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof ClientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Client name is required'); return }
    try {
      setLoading(true)
      setError(null)
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Contact name *" value={form.name} onChange={set('name')} placeholder="Alex Chen" />
        <Input label="Company / Project" value={form.company ?? ''} onChange={set('company')} placeholder="Deducto" />
      </div>

      <Textarea
        label="Business summary"
        value={form.summary ?? ''}
        onChange={set('summary')}
        rows={2}
        placeholder="One or two sentences on what they're building and where they are."
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={CLIENT_STATUSES.map((s) => ({ value: s, label: s }))}
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
          label="Category"
          value={form.category ?? ''}
          onChange={set('category')}
          placeholder="Select category"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label="Assign to"
          value={form.assigned_to ?? ''}
          onChange={set('assigned_to')}
          placeholder="Unassigned"
          options={profiles.map((p) => ({
            value: p.id,
            label: p.full_name || p.email.split('@')[0],
          }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Next call date" type="date" value={form.next_call_date ?? ''} onChange={set('next_call_date')} />
        <Input label="Last touch date" type="date" value={form.last_touch_date ?? ''} onChange={set('last_touch_date')} />
      </div>

      <Input
        label="Blocker"
        value={form.blocker ?? ''}
        onChange={set('blocker')}
        placeholder="What's in the way? Leave empty if none."
      />

      <Textarea
        label="Notes"
        value={form.notes ?? ''}
        onChange={set('notes')}
        rows={3}
        placeholder="Context, decisions, background, links..."
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save changes' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}
