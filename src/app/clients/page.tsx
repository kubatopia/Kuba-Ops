'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { ClientGrid } from '@/components/clients/ClientGrid'
import { ClientFilters, type ClientFilterState } from '@/components/clients/ClientFilters'
import { ClientForm } from '@/components/clients/ClientForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useClients } from '@/hooks/useClients'
import { supabase, logActivity } from '@/lib/supabase'
import type { ClientFormData } from '@/lib/types'

const defaultFilters: ClientFilterState = {
  search: '', engagement_manager: '', entrepreneur: '', compliance_manager: '', rollover: '',
}

export default function ClientsPage() {
  const { clients, loading, refetch } = useClients()
  const [filters, setFilters] = useState<ClientFilterState>(defaultFilters)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = filters.search.toLowerCase()
      if (q && !`${c.name} ${c.company ?? ''} ${c.summary ?? ''}`.toLowerCase().includes(q)) return false
      if (filters.engagement_manager && c.engagement_manager !== filters.engagement_manager) return false
      if (filters.entrepreneur && c.entrepreneur !== filters.entrepreneur) return false
      if (filters.compliance_manager && c.compliance_manager !== filters.compliance_manager) return false
      if (filters.rollover) {
        const [min, max] = filters.rollover.split('-').map(Number)
        const r = c.rollover_amount ?? 0
        if (r < min || r > max) return false
      }
return true
    })
  }, [clients, filters])

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
    setAddOpen(false)
    refetch()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clients.length} total{filtered.length !== clients.length ? `, ${filtered.length} shown` : ''}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          Add client
        </Button>
      </div>

      <div className="mb-4">
        <ClientFilters filters={filters} onChange={setFilters} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ClientGrid clients={filtered} onUpdate={refetch} />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add client" size="lg">
        <ClientForm onSubmit={handleAddClient} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
