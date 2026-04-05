export type ClientStatus =
  | 'active research'
  | 'prep for next call'
  | 'waiting on client'
  | 'blocked'
  | 'prototyping'
  | 'follow-up needed'
  | 'low priority'
  | 'complete'
  | 'on hold'

export type Priority = 'high' | 'medium' | 'low'

export type TaskStatus = 'not started' | 'in progress' | 'waiting' | 'done'

export type TaskType =
  | 'research'
  | 'outreach'
  | 'prep'
  | 'follow-up'
  | 'compliance'
  | 'sourcing'
  | 'design'
  | 'deck'
  | 'legal'
  | 'product'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member'
  created_at: string
}

export interface Client {
  id: string
  name: string
  company: string | null
  summary: string | null
  status: ClientStatus
  priority: Priority
  owner: string | null
  assigned_to: string | null
  next_call_date: string | null
  last_touch_date: string | null
  blocker: string | null
  category: string | null
  notes: string | null
  rollover_amount: number | null
  linkedin_url: string | null
  linkedin_activity: string | null
  birthday: string | null
  interests: string | null
  current_company: string | null
  engagement_manager: string | null
  compliance_manager: string | null
  entrepreneur: string | null
  contact_info: string | null
  created_at: string
  updated_at: string
  // populated when fetching client detail
  tasks?: Task[]
  meetings?: Meeting[]
}

export interface Task {
  id: string
  client_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  priority: Priority
  task_type: TaskType | null
  next_step: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // joined for task list views
  client?: Pick<Client, 'id' | 'name' | 'company'>
}

export interface Meeting {
  id: string
  client_id: string
  meeting_date: string
  summary: string | null
  decisions: string | null
  follow_ups: string | null
  next_meeting_date: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  client_id: string
  event_type: ActivityEventType
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export type ActivityEventType =
  | 'client_created'
  | 'task_added'
  | 'task_completed'
  | 'meeting_added'
  | 'next_call_updated'
  | 'blocker_updated'
  | 'status_updated'
  | 'priority_updated'
  | 'notes_updated'

// Form shapes (omit DB-managed fields)
export type ClientFormData = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tasks' | 'meetings'>

export type TaskFormData = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'client'>

export type MeetingFormData = Omit<Meeting, 'id' | 'created_at' | 'updated_at'>
