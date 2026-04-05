'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Client, ClientFormData } from '@/lib/types'

const ENGAGEMENT_MANAGERS = ['Nick King', 'Brady Weller']
const ENTREPRENEURS = ['Finley Underwood', 'Brady Weller', 'Lauren Prieur', 'Nick King', 'Patrick Sanders', 'Drew Elliot']
const COMPLIANCE = ['Lauren Prieur']

const INPUT = 'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const LABEL = 'block text-xs font-medium text-gray-400 mb-1'

interface ClientFormProps {
  initial?: Partial<Client>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
}

export function ClientForm({ initial, onSubmit, onCancel }: ClientFormProps) {
  const parsedContact = (() => {
    try { return initial?.contact_info ? JSON.parse(initial.contact_info) : {} } catch { return {} }
  })()

  const [form, setForm] = useState<ClientFormData>({
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    current_company: initial?.current_company ?? '',
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
    rollover_amount: initial?.rollover_amount ?? null,
    linkedin_url: initial?.linkedin_url ?? '',
    linkedin_activity: initial?.linkedin_activity ?? null,
    birthday: initial?.birthday ?? '',
    interests: initial?.interests ?? '',
    engagement_manager: initial?.engagement_manager ?? '',
    compliance_manager: initial?.compliance_manager ?? '',
    entrepreneur: initial?.entrepreneur ?? '',
    contact_info: initial?.contact_info ?? null,
  })

  const [contact, setContact] = useState({
    email: parsedContact.email ?? '',
    phone: parsedContact.phone ?? '',
    address1: parsedContact.address1 ?? '',
    address2: parsedContact.address2 ?? '',
    city: parsedContact.city ?? '',
    state: parsedContact.state ?? '',
    zip: parsedContact.zip ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof ClientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const setC = (key: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((c) => ({ ...c, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Contact name is required'); return }
    try {
      setLoading(true)
      setError(null)
      const contactJson = Object.values(contact).some(Boolean) ? JSON.stringify(contact) : null
      await onSubmit({ ...form, contact_info: contactJson })
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-md px-3 py-2">{error}</div>
      )}

      {/* Name + NewCo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Contact name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Dan Wertman" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>NewCo / Project</label>
          <input value={form.company ?? ''} onChange={set('company')} placeholder="Deducto" className={INPUT} />
        </div>
      </div>

      {/* Current Co + LinkedIn */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Current company</label>
          <input value={form.current_company ?? ''} onChange={set('current_company')} placeholder="Mode Mobile" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>LinkedIn URL</label>
          <input value={form.linkedin_url ?? ''} onChange={set('linkedin_url')} placeholder="linkedin.com/in/..." className={INPUT} />
        </div>
      </div>

      {/* Business summary */}
      <div>
        <label className={LABEL}>Business summary</label>
        <textarea value={form.summary ?? ''} onChange={set('summary')} rows={2}
          placeholder="One or two sentences on what they're building and where they are."
          className={INPUT + ' resize-none'} />
      </div>

      {/* Team roles */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Engagement Manager</label>
          <select value={form.engagement_manager ?? ''} onChange={set('engagement_manager')} className={INPUT}>
            <option value="">—</option>
            {ENGAGEMENT_MANAGERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Compliance Manager</label>
          <select value={form.compliance_manager ?? ''} onChange={set('compliance_manager')} className={INPUT}>
            <option value="">—</option>
            {COMPLIANCE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Entrepreneur</label>
          <select value={form.entrepreneur ?? ''} onChange={set('entrepreneur')} className={INPUT}>
            <option value="">—</option>
            {ENTREPRENEURS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Contact info */}
      <div>
        <label className={LABEL}>Contact information</label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={contact.email} onChange={setC('email')} placeholder="Email" className={INPUT} />
            <input value={contact.phone} onChange={setC('phone')} placeholder="Phone" className={INPUT} />
          </div>
          <input value={contact.address1} onChange={setC('address1')} placeholder="Address Line 1" className={INPUT} />
          <input value={contact.address2} onChange={setC('address2')} placeholder="Address Line 2 (optional)" className={INPUT} />
          <div className="grid grid-cols-3 gap-2">
            <input value={contact.city} onChange={setC('city')} placeholder="City" className={INPUT} />
            <input value={contact.state} onChange={setC('state')} placeholder="State" className={INPUT} />
            <input value={contact.zip} onChange={setC('zip')} placeholder="Zip" className={INPUT} />
          </div>
        </div>
      </div>

      {/* Notes + Interests */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Notes</label>
          <textarea value={form.notes ?? ''} onChange={set('notes')} rows={3}
            placeholder="Context, decisions, background..." className={INPUT + ' resize-none'} />
        </div>
        <div>
          <label className={LABEL}>Interests</label>
          <textarea value={form.interests ?? ''} onChange={set('interests')} rows={3}
            placeholder="Hobbies, passions, topics they care about..." className={INPUT + ' resize-none'} />
        </div>
      </div>

      {/* Rollover + Birthday */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Rollover amount</label>
          <input type="number" value={form.rollover_amount ?? ''} onChange={(e) => setForm((f) => ({ ...f, rollover_amount: e.target.value ? Number(e.target.value) : null }))}
            placeholder="0" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Birthday</label>
          <input type="date" value={form.birthday ?? ''} onChange={set('birthday')} className={INPUT} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save changes' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}
