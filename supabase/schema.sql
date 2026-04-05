-- ============================================================
-- Venture CRM Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  company         TEXT,
  summary         TEXT,
  status          TEXT NOT NULL DEFAULT 'active research',
  priority        TEXT NOT NULL DEFAULT 'medium',
  owner           TEXT,
  next_call_date  DATE,
  last_touch_date DATE,
  blocker         TEXT,
  category        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clients_status_check CHECK (status IN (
    'active research', 'prep for next call', 'waiting on client',
    'blocked', 'prototyping', 'follow-up needed',
    'low priority', 'complete', 'on hold'
  )),
  CONSTRAINT clients_priority_check CHECK (priority IN ('high', 'medium', 'low'))
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'not started',
  priority     TEXT NOT NULL DEFAULT 'medium',
  task_type    TEXT,
  next_step    TEXT,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_status_check CHECK (status IN ('not started', 'in progress', 'waiting', 'done')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('high', 'medium', 'low'))
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE TABLE meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meeting_date      DATE NOT NULL,
  summary           TEXT,
  decisions         TEXT,
  follow_ups        TEXT,
  next_meeting_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ACTIVITIES (timeline events)
-- ============================================================
CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_clients_status         ON clients(status);
CREATE INDEX idx_clients_priority       ON clients(priority);
CREATE INDEX idx_clients_next_call      ON clients(next_call_date);
CREATE INDEX idx_clients_last_touch     ON clients(last_touch_date);
CREATE INDEX idx_clients_updated        ON clients(updated_at DESC);

CREATE INDEX idx_tasks_client_id        ON tasks(client_id);
CREATE INDEX idx_tasks_status           ON tasks(status);
CREATE INDEX idx_tasks_due_date         ON tasks(due_date);
CREATE INDEX idx_tasks_updated          ON tasks(updated_at DESC);

CREATE INDEX idx_meetings_client_id     ON meetings(client_id);
CREATE INDEX idx_meetings_date          ON meetings(meeting_date DESC);

CREATE INDEX idx_activities_client_id   ON activities(client_id);
CREATE INDEX idx_activities_created     ON activities(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- Single-user MVP: any authenticated session can access all rows.
-- To extend for multi-user: add user_id UUID column to each table,
-- default to auth.uid(), and change USING(true) → USING(user_id = auth.uid())
-- ============================================================
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_clients"    ON clients    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_tasks"      ON tasks      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_meetings"   ON meetings   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_activities" ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
