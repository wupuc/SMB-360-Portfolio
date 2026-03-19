-- ============================================================
-- SMB 360 Platform — Development Seed Data
-- Run after migrations: supabase db reset
-- ============================================================

-- NOTE: auth.users rows must be created via Supabase Auth API (cannot insert directly).
-- This seed assumes you have run `supabase db reset` and then created users via the
-- Supabase Auth dashboard or CLI. The handle_new_user trigger will auto-create public.users rows.
--
-- To fully seed: create users in Auth first, then run this file to set their data.
-- For CI/testing, use supabase CLI: `supabase auth users create --email ...`

-- -------------------------------------------------------
-- DEMO COMPANY
-- -------------------------------------------------------
INSERT INTO companies (id, name, brand_color, timezone, locale, email_sender_name, email_sender_address)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Acme Corp',
  '#3B82F6',
  'Europe/Warsaw',
  'pl',
  'Acme Corp',
  'noreply@acmecorp.example'
);

-- -------------------------------------------------------
-- DEPARTMENTS
-- -------------------------------------------------------
INSERT INTO departments (id, company_id, name)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sales'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Human Resources');

-- -------------------------------------------------------
-- MODULE CONFIG (all enabled for demo company)
-- -------------------------------------------------------
INSERT INTO module_config (company_id, module, is_enabled)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'request_flow', true),
  ('00000000-0000-0000-0000-000000000001', 'sales_track', true),
  ('00000000-0000-0000-0000-000000000001', 'project_hub', true),
  ('00000000-0000-0000-0000-000000000001', 'people_hub', true),
  ('00000000-0000-0000-0000-000000000001', 'book_it', true),
  ('00000000-0000-0000-0000-000000000001', 'helpdesk', true);

-- -------------------------------------------------------
-- CURRENCIES
-- -------------------------------------------------------
INSERT INTO currencies (company_id, code, name, symbol, exchange_rate, is_base, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'PLN', 'Polish Złoty', 'zł', 1.0, true, true),
  ('00000000-0000-0000-0000-000000000001', 'EUR', 'Euro', '€', 0.23, false, true),
  ('00000000-0000-0000-0000-000000000001', 'USD', 'US Dollar', '$', 0.25, false, true);

-- -------------------------------------------------------
-- NOTE ON USERS
-- -------------------------------------------------------
-- After creating auth users, update their public.users rows:
--
-- UPDATE users SET
--   company_id = '00000000-0000-0000-0000-000000000001',
--   role = 'admin',
--   department_id = '10000000-0000-0000-0000-000000000001',
--   first_name = 'Admin',
--   last_name = 'User'
-- WHERE email = 'admin@acmecorp.example';
