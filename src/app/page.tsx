'use client'

import { useMemo, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RolloverChart } from '@/components/dashboard/RolloverChart'
import { SplitPieCharts } from '@/components/dashboard/SplitPieCharts'
import { PersonalDashboard } from '@/components/dashboard/PersonalDashboard'
import { Modal } from '@/components/ui/Modal'
import { ClientForm } from '@/components/clients/ClientForm'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useClients } from '@/hooks/useClients'
import { useProfiles, useCurrentProfile } from '@/hooks/useProfiles'
import { useMetrics } from '@/hooks/useMetrics'
import { supabase, logActivity } from '@/lib/supabase'
import type { ClientFormData } from '@/lib/types'

export default function DashboardPage() {
  const { clients, loading: clientsLoading, refetch: refetchClients } = useClients()
  const { profile: currentProfile, loading: profileLoading } = useCurrentProfile()
  const { profiles, loading: profilesLoading } = useProfiles()
  const { metrics } = useMetrics()
  const [addClientOpen, setAddClientOpen] = useState(false)

  const activeClients = useMemo(() => clients.filter((c) => c.status !== 'complete' && c.status !== 'on hold'), [clients])

  const isAdmin = currentProfile?.role === 'admin'

  const handleAddClient = async (data: ClientFormData) => {
    const sanitized = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    )
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert(sanitized)
      .select()
      .single()
    if (error) throw error
    await logActivity(newClient.id, 'client_created', `${newClient.company || newClient.name} added`)
    setAddClientOpen(false)
    refetchClients()
  }

  if (clientsLoading || profileLoading || profilesLoading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">

      {/* ── Personal Dashboard(s) ── */}
      {isAdmin ? (
        <div className="space-y-12">
          {profiles.map((p) => (
            <section key={p.id}>
              <PersonalDashboard profile={p} clients={clients} isCurrentUser={p.id === currentProfile?.id} />
              {profiles.indexOf(p) < profiles.length - 1 && (
                <div className="border-t border-dashed border-gray-100 mt-10" />
              )}
            </section>
          ))}
        </div>
      ) : currentProfile ? (
        <section>
          <PersonalDashboard profile={currentProfile} clients={clients} isCurrentUser />
        </section>
      ) : null}

      {/* ── Divider ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Company Overview</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* ── Company Dashboard ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Kuba Ventures</h1>
            <p className="text-sm text-gray-400 mt-0.5">Company overview</p>
          </div>
          <Button onClick={() => setAddClientOpen(true)}>
            <Plus size={15} />
            Add client
          </Button>
        </div>

        <div className="mb-6">
          <StatCard label="Active clients" value={activeClients.length} icon={Users} accent="default" />
        </div>

        <div className="space-y-5">
          <SplitPieCharts clients={clients} profiles={profiles} />
          <RolloverChart metrics={metrics} />
        </div>
      </section>

      <Modal open={addClientOpen} onClose={() => setAddClientOpen(false)} title="Add client" size="lg">
        <ClientForm onSubmit={handleAddClient} onCancel={() => setAddClientOpen(false)} />
      </Modal>
    </div>
  )
}
