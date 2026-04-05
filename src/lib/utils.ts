import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  addDays,
  startOfDay,
} from 'date-fns'
import { STALE_THRESHOLD_DAYS, UPCOMING_CALL_DAYS } from './constants'
import type { Client, Task } from './types'

// ─── Formatting ────────────────────────────────────────────────────────────────

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const parsed = parseISO(date)
  if (!isValid(parsed)) return '—'
  return format(parsed, 'MMM d, yyyy')
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  const parsed = parseISO(date)
  if (!isValid(parsed)) return '—'
  return format(parsed, 'MMM d')
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const parsed = parseISO(date)
  if (!isValid(parsed)) return '—'
  return formatDistanceToNow(parsed, { addSuffix: true })
}

// Returns today as YYYY-MM-DD for <input type="date" /> defaultValue
export function todayInputValue(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Derived client flags ───────────────────────────────────────────────────

export function isStaleClient(client: Client): boolean {
  if (client.status === 'complete' || client.status === 'on hold') return false
  if (!client.last_touch_date) return true
  const lastTouch = parseISO(client.last_touch_date)
  const staleThreshold = addDays(startOfDay(new Date()), -STALE_THRESHOLD_DAYS)
  return isBefore(lastTouch, staleThreshold)
}

export function isUpcomingCall(client: Client): boolean {
  if (!client.next_call_date) return false
  const callDate = parseISO(client.next_call_date)
  const today = startOfDay(new Date())
  const window = addDays(today, UPCOMING_CALL_DAYS)
  return !isBefore(callDate, today) && isBefore(callDate, window)
}

export function isBlockedClient(client: Client): boolean {
  return Boolean(client.blocker) || client.status === 'blocked'
}

export function isCallOverdue(client: Client): boolean {
  if (!client.next_call_date) return false
  const callDate = parseISO(client.next_call_date)
  return isBefore(callDate, startOfDay(new Date()))
}

// ─── Derived task flags ─────────────────────────────────────────────────────

export function isOverdueTask(task: Task): boolean {
  if (task.status === 'done') return false
  if (!task.due_date) return false
  return isBefore(parseISO(task.due_date), startOfDay(new Date()))
}

export function isDueThisWeek(task: Task): boolean {
  if (task.status === 'done') return false
  if (!task.due_date) return false
  const due = parseISO(task.due_date)
  const today = startOfDay(new Date())
  const end = addDays(today, 7)
  return !isBefore(due, today) && isBefore(due, end)
}

// ─── Open task count ────────────────────────────────────────────────────────

export function openTaskCount(tasks: Task[], clientId: string): number {
  return tasks.filter((t) => t.client_id === clientId && t.status !== 'done').length
}

// ─── Class name helper ──────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
