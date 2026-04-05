'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Client, Profile } from '@/lib/types'

interface SplitPieChartsProps {
  clients: Client[]
  profiles?: Profile[]
}

const COLORS = ['#00D4AA', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#ec4899']

function buildSlices(clients: Client[], field: keyof Client) {
  const counts: Record<string, number> = {}
  for (const c of clients) {
    const label = (c[field] as string | null) || 'Unassigned'
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function PieSection({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [
              `${value} (${Math.round((value as number / total) * 100)}%)`,
              name,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-1 space-y-1 px-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-gray-600 truncate">{d.name}</span>
            </div>
            <span className="text-xs font-medium text-gray-900 shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SplitPieCharts({ clients, profiles }: SplitPieChartsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Companies</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{clients.length}</p>
        </div>
      </div>
      <div className="flex gap-6 divide-x divide-gray-100">
        <PieSection title="Engagement Manager" data={buildSlices(clients, 'engagement_manager')} />
        <div className="pl-6 flex-1 min-w-0">
          <PieSection title="Entrepreneur" data={buildSlices(clients, 'entrepreneur')} />
        </div>
        <div className="pl-6 flex-1 min-w-0">
          <PieSection title="Compliance" data={buildSlices(clients, 'compliance_manager')} />
        </div>
      </div>
    </div>
  )
}
