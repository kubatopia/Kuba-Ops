import type { ClientStatus, Priority, TaskStatus, TaskType } from './types'

export const CLIENT_STATUSES: ClientStatus[] = [
  'active research',
  'prep for next call',
  'waiting on client',
  'blocked',
  'prototyping',
  'follow-up needed',
  'low priority',
  'complete',
  'on hold',
]

export const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export const TASK_STATUSES: TaskStatus[] = ['not started', 'in progress', 'waiting', 'done']

export const TASK_TYPES: TaskType[] = [
  'research',
  'outreach',
  'prep',
  'follow-up',
  'compliance',
  'sourcing',
  'design',
  'deck',
  'legal',
  'product',
]

export const CATEGORIES: string[] = [
  'B2B SaaS',
  'Food & Beverage',
  'Professional Services',
  'Aerospace',
  'Legal & Finance',
  'E-commerce',
  'Healthcare',
  'Real Estate',
  'Consumer',
  'Other',
]

// Days without contact before a client is considered stale
export const STALE_THRESHOLD_DAYS = 14

// Days ahead to surface upcoming calls on dashboard
export const UPCOMING_CALL_DAYS = 7
