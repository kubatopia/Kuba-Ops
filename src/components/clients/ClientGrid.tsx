'use client'

import { useState, useEffect } from 'react'
import { Linkedin, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useProfiles } from '@/hooks/useProfiles'
import type { Client } from '@/lib/types'

interface ClientGridProps {
  clients: Client[]
  onUpdate: () => void
}

const AVATAR_COLORS = [
  'bg-brand-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-pink-500',
]

function companyDomain(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|group|holdings|enterprises?|technologies?|technology|solutions?|partners?|ventures?|global|international)\b\.?/g, '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
  return cleaned + '.com'
}

function logoUrl(company: string) {
  const domain = companyDomain(company)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface CardFields {
  name: string
  company: string
  current_company: string
  rollover_amount: string
  linkedin_url: string
  linkedin_activity: string
  notes: string
  birthday: string
  interests: string
  tags: string[]
  contact_email: string
  contact_phone: string
  contact_address1: string
  contact_address2: string
  contact_city: string
  contact_state: string
  contact_zip: string
  engagement_manager: string
  compliance_manager: string
  entrepreneur: string
}

interface DriveFile { id: string; name: string; mimeType: string; webViewLink: string; modifiedTime: string }

function DriveFilesPanel({ clientId, clientName, category, accentClasses }: {
  clientId: string; clientName: string; category: string; accentClasses: string
}) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) { setLoading(false); return }
      fetch(`/api/drive/files?userId=${userId}&clientName=${encodeURIComponent(clientName)}&category=${category}`)
        .then((r) => r.json())
        .then((d) => setFiles(d.files ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [clientId, category])

  return (
    <div className={`rounded-lg border p-4 min-h-[80px] ${accentClasses}`}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Loading files…
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center">No files found in {category}</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <FileText size={13} className="text-gray-400 shrink-0" />
              <a href={f.webViewLink} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-700 hover:text-brand-600 hover:underline flex-1 truncate">
                {f.name}
              </a>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(f.modifiedTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-500">
                <ExternalLink size={11} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ClientGrid({ clients, onUpdate }: ClientGridProps) {
  const { profiles } = useProfiles()
  const [selected, setSelected] = useState<Client | null>(null)
  const [fields, setFields] = useState<CardFields>({
    name: '',
    company: '',
    current_company: '',
    rollover_amount: '',
    linkedin_url: '',
    linkedin_activity: '',
    notes: '',
    birthday: '',
    interests: '',
    tags: [],
    contact_email: '',
    contact_phone: '',
    contact_address1: '',
    contact_address2: '',
    contact_city: '',
    contact_state: '',
    contact_zip: '',
    engagement_manager: '',
    compliance_manager: '',
    entrepreneur: '',
  })
  const [editingLinkedin, setEditingLinkedin] = useState(false)
  const [editingBirthday, setEditingBirthday] = useState(false)
  const [editingRollover, setEditingRollover] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [activeTab, setActiveTab] = useState<'compliance' | 'communication' | 'research' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function openCard(client: Client) {
    setSelected(client)
    setEditingLinkedin(false)
    setEditingBirthday(false)
    setActiveTab(null)
    setSaveError(null)
    setFields({
      name: client.name,
      company: client.company ?? '',
      current_company: client.current_company ?? '',
      rollover_amount: client.rollover_amount != null ? String(client.rollover_amount) : '',
      linkedin_url: client.linkedin_url ?? '',
      linkedin_activity: client.linkedin_activity ?? '',
      notes: client.notes ?? '',
      birthday: client.birthday ?? '',
      interests: client.interests ?? '',
      tags: (client as any).tags ?? [],
      ...(() => {
        try { const c = JSON.parse((client as any).contact_info || '{}'); return { contact_email: c.email ?? '', contact_phone: c.phone ?? '', contact_address1: c.address1 ?? '', contact_address2: c.address2 ?? '', contact_city: c.city ?? '', contact_state: c.state ?? '', contact_zip: c.zip ?? '' } } catch { return { contact_email: '', contact_phone: '', contact_address1: '', contact_address2: '', contact_city: '', contact_state: '', contact_zip: '' } }
      })(),
      engagement_manager: client.engagement_manager ?? '',
      compliance_manager: client.compliance_manager ?? '',
      entrepreneur: client.entrepreneur ?? '',
    })
  }

  function closeCard() {
    setSelected(null)
  }

  function set(key: keyof CardFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  async function deleteClient() {
    if (!selected) return
    if (!confirm(`Delete ${selected.company || selected.name}? This cannot be undone.`)) return
    await supabase.from('clients').delete().eq('id', selected.id)
    onUpdate()
    closeCard()
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('clients').update({
      name: fields.name.trim() || selected.name,
      company: fields.company.trim() || null,
      current_company: fields.current_company.trim() || null,
      rollover_amount: fields.rollover_amount.trim() === '' ? null : Number(fields.rollover_amount),
      linkedin_url: fields.linkedin_url.trim() || null,
      linkedin_activity: fields.linkedin_activity.trim() || null,
      notes: fields.notes.trim() || null,
      birthday: fields.birthday || null,
      interests: fields.interests.trim() || null,
      tags: fields.tags.length > 0 ? fields.tags : null,
      contact_info: (fields.contact_email || fields.contact_phone || fields.contact_address1)
        ? JSON.stringify({ email: fields.contact_email.trim(), phone: fields.contact_phone.trim(), address1: fields.contact_address1.trim(), address2: fields.contact_address2.trim(), city: fields.contact_city.trim(), state: fields.contact_state.trim(), zip: fields.contact_zip.trim() })
        : null,
      engagement_manager: fields.engagement_manager || null,
      compliance_manager: fields.compliance_manager || null,
      entrepreneur: fields.entrepreneur || null,
    }).eq('id', selected.id)
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    onUpdate()
    closeCard()
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients found"
        description="Try adjusting your filters, or add your first client."
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-5 gap-4">
        {clients.map((client) => {
          const initials = getInitials(client.name)
          const color = getColor(client.name)
          return (
            <button
              key={client.id}
              onClick={() => openCard(client)}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 bg-white hover:border-brand-200 hover:shadow-md transition-all text-center group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0 ${color}`}>
                {initials}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
                  {client.company || client.name}
                </div>
                {client.company && (
                  <div className="text-xs text-gray-400 mt-0.5">{client.name}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <Modal open title="" onClose={closeCard} size="lg">
          <div className="space-y-5">
            {/* Header with editable name + company */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl shrink-0 ${getColor(fields.name || selected.name)}`}>
                {getInitials(fields.name || selected.name)}
              </div>
              <div className="flex-1 min-w-0">
                {/* Name — full width */}
                <input
                  type="text"
                  value={fields.name}
                  onChange={set('name')}
                  className="w-full text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-brand-400 focus:outline-none bg-transparent pb-0.5 transition-colors"
                />
                {/* Current Co */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400 shrink-0 w-20">Current Co:</span>
                  {fields.current_company && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl(fields.current_company)}
                      alt=""
                      className="w-5 h-5 rounded object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <input
                    type="text"
                    value={fields.current_company}
                    onChange={set('current_company')}
                    placeholder="Their existing company"
                    className="flex-1 text-sm text-gray-600 border-b border-transparent hover:border-gray-200 focus:border-brand-400 focus:outline-none bg-transparent pb-0.5 transition-colors"
                  />
                </div>
                {/* NewCo */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 shrink-0 w-20">NewCo:</span>
                  <input
                    type="text"
                    value={fields.company}
                    onChange={set('company')}
                    placeholder="New venture name"
                    className="flex-1 text-sm text-gray-700 font-medium border-b border-transparent hover:border-gray-200 focus:border-brand-400 focus:outline-none bg-transparent pb-0.5 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* LinkedIn button — click to edit URL, navigate when set */}
                  <div className="flex items-center gap-1">
                    {editingLinkedin ? (
                      <input
                        type="url"
                        value={fields.linkedin_url}
                        onChange={set('linkedin_url')}
                        onBlur={() => setEditingLinkedin(false)}
                        placeholder="https://linkedin.com/in/..."
                        autoFocus
                        className="rounded-md border border-brand-300 px-2 py-0.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {fields.linkedin_url ? (
                          <a
                            href={fields.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
                          >
                            <Linkedin size={12} />
                            LinkedIn
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingLinkedin(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                          >
                            <Linkedin size={12} />
                            LinkedIn
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingLinkedin(true)}
                          className="text-xs text-gray-300 hover:text-gray-500 transition-colors px-1"
                          title="Edit LinkedIn URL"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Birthday button — click to edit */}
                  {editingBirthday ? (
                    <input
                      type="date"
                      value={fields.birthday}
                      onChange={set('birthday')}
                      onBlur={() => setEditingBirthday(false)}
                      autoFocus
                      className="rounded-md border border-brand-300 px-2 py-0.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingBirthday(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    >
                      {fields.birthday
                        ? new Date(fields.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'No birthday set'}
                    </button>
                  )}

                  {/* Rollover amount — click to edit */}
                  {editingRollover ? (
                    <div className="inline-flex items-center rounded-md border border-brand-300 overflow-hidden">
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border-r border-brand-300">$</span>
                      <input
                        type="text"
                        value={fields.rollover_amount}
                        onChange={set('rollover_amount')}
                        onBlur={() => setEditingRollover(false)}
                        autoFocus
                        placeholder="0"
                        className="px-2 py-0.5 text-xs text-gray-900 focus:outline-none w-28 bg-white"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingRollover(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    >
                      {fields.rollover_amount
                        ? `Rollover: $${Number(fields.rollover_amount).toLocaleString()}`
                        : 'Rollover: —'}
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Doc tabs */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center mb-3">
                {([
                  { key: 'compliance',    label: 'Compliance',    active: 'border-amber-400 text-amber-700 bg-amber-50',       inactive: 'border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50' },
                  { key: 'communication', label: 'Communication', active: 'border-blue-400 text-blue-700 bg-blue-50',          inactive: 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50' },
                  { key: 'research',      label: 'Research',      active: 'border-emerald-400 text-emerald-700 bg-emerald-50', inactive: 'border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50' },
                ] as const).map(({ key, label, active, inactive }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(activeTab === key ? null : key)}
                    className={`flex-1 text-center border-l-2 pl-2 pr-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-r-md transition-colors ${activeTab === key ? active : inactive}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {activeTab && selected && (
                <DriveFilesPanel
                  clientId={selected.id}
                  clientName={selected.company || selected.name}
                  category={activeTab === 'compliance' ? 'Compliance' : activeTab === 'communication' ? 'Communications' : 'Research'}
                  accentClasses={
                    activeTab === 'compliance'    ? 'border-amber-100 bg-amber-50/40' :
                    activeTab === 'communication' ? 'border-blue-100 bg-blue-50/40' :
                                                   'border-emerald-100 bg-emerald-50/40'
                  }
                />
              )}
            </div>

            {/* Contact Information + Tags */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Contact Information</label>
                <div className="space-y-2">
                  <input type="email" value={fields.contact_email} onChange={(e) => setFields((f) => ({ ...f, contact_email: e.target.value }))} placeholder="Email" className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <input type="tel" value={fields.contact_phone} onChange={(e) => setFields((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="Phone" className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <input type="text" value={fields.contact_address1} onChange={(e) => setFields((f) => ({ ...f, contact_address1: e.target.value }))} placeholder="Address Line 1" className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <input type="text" value={fields.contact_address2} onChange={(e) => setFields((f) => ({ ...f, contact_address2: e.target.value }))} placeholder="Address Line 2 (optional)" className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={fields.contact_city} onChange={(e) => setFields((f) => ({ ...f, contact_city: e.target.value }))} placeholder="City" className="col-span-1 text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <input type="text" value={fields.contact_state} onChange={(e) => setFields((f) => ({ ...f, contact_state: e.target.value }))} placeholder="State" className="col-span-1 text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <input type="text" value={fields.contact_zip} onChange={(e) => setFields((f) => ({ ...f, contact_zip: e.target.value }))} placeholder="Zip" className="col-span-1 text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {fields.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-300 text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => setFields((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} className="hover:text-white">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const newTag = tagInput.trim().replace(/,$/, '')
                      if (newTag && !fields.tags.includes(newTag)) {
                        setFields((f) => ({ ...f, tags: [...f.tags, newTag] }))
                      }
                      setTagInput('')
                    }
                  }}
                  placeholder="Type and press Enter…"
                  className="text-xs px-2 py-0.5 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-transparent text-gray-700 placeholder-gray-400 min-w-[140px]"
                />
              </div>
              <div className="space-y-3">
                <Textarea
                  label="Interests"
                  value={fields.interests}
                  onChange={set('interests')}
                  rows={3}
                  placeholder="Hobbies, passions, topics they care about..."
                />
                <Textarea
                  label="Notes"
                  value={fields.notes}
                  onChange={set('notes')}
                  rows={3}
                  placeholder="Context, decisions, background..."
                />
              </div>
              </div>
            </div>

            {/* Role assignments */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-4">
              {([
                { key: 'engagement_manager', label: 'Engagement Manager', options: ['Nick King', 'Brady Weller'] },
                { key: 'compliance_manager', label: 'Compliance Manager', options: ['Lauren Prieur'] },
                { key: 'entrepreneur',       label: 'Entrepreneur',       options: ['Finley Underwood', 'Brady Weller', 'Lauren Prieur', 'Nick King', 'Patrick Sanders', 'Drew Elliot'] },
              ] as const).map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                  <select
                    value={fields[key]}
                    onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">— Unassigned —</option>
                    {options.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              {saveError && (
                <p className="text-xs text-red-600">{saveError}</p>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={deleteClient} className="text-xs text-red-400 hover:text-red-600 mr-2">Delete client</button>
                <Button variant="secondary" onClick={closeCard}>Cancel</Button>
                <Button onClick={save} loading={saving}>Save</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
