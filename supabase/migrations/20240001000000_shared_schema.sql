-- ============================================================
-- SMB 360 Platform — Shared Schema
-- Migration: 20240001000000_shared_schema
-- Phase 1 / PRP-001
-- ============================================================

-- -------------------------------------------------------
-- COMPANIES
-- -------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  login_background_url TEXT,
  brand_color TEXT DEFAULT '#3B82F6',
  email_sender_name TEXT,
  email_sender_address TEXT,
  timezone TEXT DEFAULT 'Europe/Warsaw',
  locale TEXT DEFAULT 'pl',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- DEPARTMENTS (self-referential; must exist before users)
-- -------------------------------------------------------
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id),
  head_user_id UUID, -- FK to users added after users table is created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- USERS (extends auth.users)
-- -------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee'
    CHECK (role IN ('super_admin', 'admin', 'hr', 'manager', 'employee')),
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now we can add the FK from departments.head_user_id to users
ALTER TABLE departments
  ADD CONSTRAINT departments_head_user_id_fkey
  FOREIGN KEY (head_user_id) REFERENCES users(id);

-- -------------------------------------------------------
-- TEAMS
-- -------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead')),
  PRIMARY KEY (team_id, user_id)
);

-- -------------------------------------------------------
-- NOTIFICATIONS (central, cross-app)
-- -------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL,
  source_app TEXT,
  source_id UUID,
  source_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- FILES (shared storage index)
-- -------------------------------------------------------
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  source_app TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- ANNOUNCEMENTS
-- -------------------------------------------------------
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  author_id UUID REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- MODULE CONFIG
-- -------------------------------------------------------
CREATE TABLE module_config (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN (
    'request_flow', 'sales_track', 'project_hub',
    'people_hub', 'book_it', 'helpdesk'
  )),
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  PRIMARY KEY (company_id, module)
);

-- -------------------------------------------------------
-- CURRENCIES
-- -------------------------------------------------------
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate DECIMAL(12,6) DEFAULT 1.0,
  is_base BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (company_id, code)
);

-- -------------------------------------------------------
-- AUDIT LOG (immutable, append-only)
-- -------------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected', 'login', 'logout')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TRIGGERS: updated_at auto-update
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- TRIGGER: create public.users row when auth.users is created
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'employee'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------

-- Companies: super_admin can see all; others see own company only
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_own_read" ON companies
  FOR SELECT USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );
CREATE POLICY "company_admin_update" ON companies
  FOR UPDATE USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Users: employees read their own company; update own row; admins update any
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_company_read" ON users
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );
CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "users_admin_insert" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = id  -- allow own row from trigger
  );

-- Departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_company_isolation" ON departments
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_company_isolation" ON teams
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_company_isolation" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams
      WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );

-- Notifications: users see only their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own_read" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_company_insert" ON notifications
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_company_isolation" ON files
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_company_isolation" ON announcements
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Module config
ALTER TABLE module_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_config_company_isolation" ON module_config
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Currencies
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "currencies_company_isolation" ON currencies
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Audit log: read-only for admins; system can insert
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin', 'hr')
  );
CREATE POLICY "audit_log_service_insert" ON audit_log
  FOR INSERT WITH CHECK (true);  -- restricted via service role key only
