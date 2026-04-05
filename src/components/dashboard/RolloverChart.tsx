'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Metric } from '@/hooks/useMetrics'

interface RolloverChartProps {
  metrics: Metric[]
}

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function RolloverChart({ metrics }: RolloverChartProps) {
  const data = metrics
    .filter((m) => m.total_rollover_volume != null)
    .map((m) => ({
      date: fmtDate(m.date),
      amount: m.total_rollover_volume ?? 0,
      mrr: m.mrr ?? 0,
      arr: m.arr ?? 0,
    }))

  const latest = data[data.length - 1]
  const total = latest?.amount ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Rollover Volume</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">ARR</p>
          <p className="text-lg font-semibold text-brand-600">{fmt(latest?.arr ?? 0)}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-8">No metrics data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rolloverGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmt} width={56} />
            <Tooltip
              formatter={(value: any, name: any) => [fmt(value as number), name === 'amount' ? 'Rollover Volume' : String(name).toUpperCase()]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Area type="monotone" dataKey="amount" stroke="#00D4AA" strokeWidth={2} fill="url(#rolloverGradient)" dot={{ r: 3, fill: '#00D4AA', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
