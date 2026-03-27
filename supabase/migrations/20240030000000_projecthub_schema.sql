-- PRP-030: ProjectHub schema migration
-- Tables: project_templates, project_template_tasks, projects, project_members,
--         milestones, sprints, tasks, task_assignees, task_dependencies, task_comments

-- ─── PROJECT TEMPLATES ───────────────────────────────────────────────────────

CREATE TABLE project_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  is_built_in  BOOLEAN DEFAULT FALSE,
  trigger_app  TEXT,   -- which app auto-triggers: sales_track, people_hub, request_flow
  trigger_event TEXT,  -- e.g. 'opportunity_won'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TEMPLATE TASKS ──────────────────────────────────────────────────────────

CREATE TABLE project_template_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID REFERENCES project_templates(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  priority         TEXT DEFAULT 'medium',
  role_assignment  TEXT,       -- role key (not person) to assign
  days_from_start  INTEGER DEFAULT 0,
  order_index      INTEGER NOT NULL
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  status            TEXT DEFAULT 'planning',   -- planning, active, on_hold, completed, cancelled
  owner_id          UUID REFERENCES users(id),
  team_id           UUID REFERENCES teams(id),
  client_id         UUID REFERENCES clients(id), -- SalesTrack link
  start_date        DATE,
  end_date          DATE,
  estimated_budget  DECIMAL(14,2),
  currency_id       UUID REFERENCES currencies(id),
  template_id       UUID REFERENCES project_templates(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROJECT MEMBERS ─────────────────────────────────────────────────────────

CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',   -- member, lead, observer
  PRIMARY KEY (project_id, user_id)
);

-- ─── MILESTONES ──────────────────────────────────────────────────────────────

CREATE TABLE milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  due_date     DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- ─── SPRINTS ─────────────────────────────────────────────────────────────────

CREATE TABLE sprints (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  status     TEXT DEFAULT 'planning',  -- planning, active, completed
  goal       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASKS ───────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  sprint_id       UUID REFERENCES sprints(id) ON DELETE SET NULL,
  milestone_id    UUID REFERENCES milestones(id) ON DELETE SET NULL,
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'todo',    -- todo, in_progress, review, done, cancelled
  priority        TEXT DEFAULT 'medium',  -- low, medium, high, urgent
  created_by      UUID REFERENCES users(id),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  -- Cross-app source tracking
  source_app      TEXT,   -- request_flow, sales_track, helpdesk, people_hub
  source_id       UUID,
  source_label    TEXT,
  -- Recurrence
  is_recurring     BOOLEAN DEFAULT FALSE,
  recurrence_rule  TEXT,  -- iCal RRULE
  -- Labels
  labels           TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASK ASSIGNEES ──────────────────────────────────────────────────────────

CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- ─── TASK DEPENDENCIES ───────────────────────────────────────────────────────

CREATE TABLE task_dependencies (
  task_id       UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type          TEXT DEFAULT 'finish_to_start',
  PRIMARY KEY (task_id, depends_on_id)
);

-- ─── TASK COMMENTS ───────────────────────────────────────────────────────────

CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_projects_company       ON projects(company_id);
CREATE INDEX idx_projects_owner         ON projects(owner_id);
CREATE INDEX idx_projects_status        ON projects(status);
CREATE INDEX idx_tasks_company          ON tasks(company_id);
CREATE INDEX idx_tasks_project          ON tasks(project_id);
CREATE INDEX idx_tasks_sprint           ON tasks(sprint_id);
CREATE INDEX idx_tasks_status           ON tasks(status);
CREATE INDEX idx_tasks_due_date         ON tasks(due_date);
CREATE INDEX idx_task_assignees_user    ON task_assignees(user_id);
CREATE INDEX idx_task_comments_task     ON task_comments(task_id);
CREATE INDEX idx_milestones_project     ON milestones(project_id);
CREATE INDEX idx_sprints_project        ON sprints(project_id);
CREATE INDEX idx_project_members_user   ON project_members(user_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE project_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments         ENABLE ROW LEVEL SECURITY;

-- project_templates: company-scoped or built-in (shared across all)
CREATE POLICY "project_templates_read" ON project_templates FOR SELECT
  USING (is_built_in = TRUE OR company_id = get_my_company_id());

CREATE POLICY "project_templates_write" ON project_templates FOR ALL
  USING (company_id = get_my_company_id());

-- project_template_tasks: via template
CREATE POLICY "project_template_tasks_read" ON project_template_tasks FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM project_templates
      WHERE is_built_in = TRUE OR company_id = get_my_company_id()
    )
  );

CREATE POLICY "project_template_tasks_write" ON project_template_tasks FOR ALL
  USING (
    template_id IN (
      SELECT id FROM project_templates WHERE company_id = get_my_company_id()
    )
  );

-- projects: company-scoped
CREATE POLICY "projects_read"   ON projects FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (company_id = get_my_company_id());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (company_id = get_my_company_id());

-- project_members: via project
CREATE POLICY "project_members_read" ON project_members FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

CREATE POLICY "project_members_write" ON project_members FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

-- milestones: via project
CREATE POLICY "milestones_read" ON milestones FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

CREATE POLICY "milestones_write" ON milestones FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

-- sprints: via project
CREATE POLICY "sprints_read" ON sprints FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

CREATE POLICY "sprints_write" ON sprints FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()));

-- tasks: company-scoped directly
CREATE POLICY "tasks_read"   ON tasks FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (company_id = get_my_company_id());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (company_id = get_my_company_id());

-- task_assignees: via task
CREATE POLICY "task_assignees_read" ON task_assignees FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

CREATE POLICY "task_assignees_write" ON task_assignees FOR ALL
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

-- task_dependencies: via task
CREATE POLICY "task_dependencies_read" ON task_dependencies FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

CREATE POLICY "task_dependencies_write" ON task_dependencies FOR ALL
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

-- task_comments: via task
CREATE POLICY "task_comments_read" ON task_comments FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

CREATE POLICY "task_comments_write" ON task_comments FOR ALL
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = get_my_company_id()));

-- ─── SEED: BUILT-IN PROJECT TEMPLATES ────────────────────────────────────────

INSERT INTO project_templates (id, company_id, name, description, is_built_in, trigger_app, trigger_event) VALUES
  ('11000000-0000-0000-0000-000000000001', NULL, 'New Client Onboarding',    'Triggered when a SalesTrack opportunity is won', TRUE, 'sales_track',   'opportunity_won'),
  ('11000000-0000-0000-0000-000000000002', NULL, 'Software Launch',          'Sprints, milestones, and go-live checklist',    TRUE, NULL,            NULL),
  ('11000000-0000-0000-0000-000000000003', NULL, 'Employee Onboarding',      'Triggered when a new hire is created',          TRUE, 'people_hub',    'new_hire'),
  ('11000000-0000-0000-0000-000000000004', NULL, 'Trade Show Event',         'Logistics, materials, and travel requests',     TRUE, NULL,            NULL),
  ('11000000-0000-0000-0000-000000000005', NULL, 'Business Trip Follow-up',  'Triggered when a business trip is approved',    TRUE, 'request_flow',  'trip_approved'),
  ('11000000-0000-0000-0000-000000000006', NULL, 'Recruitment Process',      'Triggered when a new position opens',           TRUE, 'people_hub',    'position_opened');

-- Template tasks for "New Client Onboarding"
INSERT INTO project_template_tasks (template_id, title, priority, role_assignment, days_from_start, order_index) VALUES
  ('11000000-0000-0000-0000-000000000001', 'Send welcome email',           'high',   'sales',   0, 1),
  ('11000000-0000-0000-0000-000000000001', 'Schedule kick-off call',       'high',   'sales',   1, 2),
  ('11000000-0000-0000-0000-000000000001', 'Create client workspace',      'medium', 'ops',     2, 3),
  ('11000000-0000-0000-0000-000000000001', 'Set up access & credentials',  'medium', 'it',      3, 4),
  ('11000000-0000-0000-0000-000000000001', 'Deliver onboarding materials', 'medium', 'sales',   5, 5),
  ('11000000-0000-0000-0000-000000000001', 'First check-in call',          'low',    'sales',  14, 6),
  ('11000000-0000-0000-0000-000000000001', '30-day review',                'low',    'manager', 30, 7);

-- Template tasks for "Software Launch"
INSERT INTO project_template_tasks (template_id, title, priority, role_assignment, days_from_start, order_index) VALUES
  ('11000000-0000-0000-0000-000000000002', 'Define scope & requirements',  'high',   'manager', 0,  1),
  ('11000000-0000-0000-0000-000000000002', 'Design sprint',                'high',   'design',  5,  2),
  ('11000000-0000-0000-0000-000000000002', 'Development sprint 1',         'high',   'dev',     15, 3),
  ('11000000-0000-0000-0000-000000000002', 'Development sprint 2',         'high',   'dev',     29, 4),
  ('11000000-0000-0000-0000-000000000002', 'QA & testing',                 'high',   'qa',      43, 5),
  ('11000000-0000-0000-0000-000000000002', 'Staging deployment',           'high',   'dev',     50, 6),
  ('11000000-0000-0000-0000-000000000002', 'Client UAT sign-off',          'urgent', 'manager', 54, 7),
  ('11000000-0000-0000-0000-000000000002', 'Production launch',            'urgent', 'dev',     57, 8),
  ('11000000-0000-0000-0000-000000000002', 'Post-launch monitoring',       'medium', 'dev',     58, 9);

-- Template tasks for "Employee Onboarding"
INSERT INTO project_template_tasks (template_id, title, priority, role_assignment, days_from_start, order_index) VALUES
  ('11000000-0000-0000-0000-000000000003', 'Prepare workstation',          'high',   'it',      -3, 1),
  ('11000000-0000-0000-0000-000000000003', 'Create accounts & access',     'high',   'it',      -1, 2),
  ('11000000-0000-0000-0000-000000000003', 'First day orientation',        'high',   'hr',       0, 3),
  ('11000000-0000-0000-0000-000000000003', 'Assign buddy/mentor',          'medium', 'manager',  0, 4),
  ('11000000-0000-0000-0000-000000000003', 'Complete required training',   'medium', 'new_hire', 3, 5),
  ('11000000-0000-0000-0000-000000000003', '1-week check-in',              'low',    'manager',  7, 6),
  ('11000000-0000-0000-0000-000000000003', '30-day review',                'low',    'manager', 30, 7),
  ('11000000-0000-0000-0000-000000000003', '90-day evaluation',            'low',    'hr',       90, 8);
