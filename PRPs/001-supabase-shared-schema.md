# PRP-001: Supabase Shared Schema Migrations

## Context
- No Supabase project exists yet. This PRP creates the foundational database schema.
- All 6 platform apps share these tables. Every app-specific schema (PRPs 010, 020, 030…) depends on this.
- Source spec: `PLATFORM_PRP_1.md` §4 "SHARED DATABASE SCHEMA"
- Existing project scaffold: `Shadcn/` (Next.js 15, shadcn/ui) — no Supabase integration yet.

## Goal
Create numbered SQL migration files for the shared database tables, RLS policies, and triggers. The result is a `supabase/migrations/` directory that can be applied to a fresh Supabase project to bootstrap the shared platform schema.

## Tables to create (in dependency order)
1. `companies`
2. `departments` (self-referential parent_id — create before users)
3. `users` (extends auth.users, references departments)
4. `teams` + `team_members`
5. `notifications`
6. `files`
7. `announcements`
8. `module_config`
9. `currencies`
10. `audit_log`

## Implementation steps

### 1. Create directory structure
```
supabase/
├── migrations/
│   └── 20240001000000_shared_schema.sql
├── seed.sql
└── functions/
```

### 2. Migration file content
Each table includes:
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()` (where applicable)
- `company_id UUID REFERENCES companies(id)` (on all non-company tables, for forward multi-tenant compatibility)

### 3. RLS policies
Enable RLS on ALL tables. Base policy: employees can only read their own company's data.

```sql
-- Pattern for all tables with company_id:
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_isolation" ON [table]
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

Users table has special self-referential policy: user can read/update own row; admin/hr can read all.

### 4. Triggers
```sql
-- updated_at auto-update trigger (apply to companies, users, announcements)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. Seed data
`supabase/seed.sql` — creates one demo company, 5 users (super_admin, admin, hr, manager, employee), 2 departments, 1 team.

## Files to create/modify
- `supabase/migrations/20240001000000_shared_schema.sql` — all shared tables + RLS
- `supabase/seed.sql` — demo data
- `supabase/functions/.gitkeep` — placeholder

## Validation
- [ ] `supabase db reset` applies migration without errors
- [ ] All tables visible in Supabase dashboard
- [ ] RLS enabled on all tables (verify in Supabase Auth > Policies)
- [ ] `SELECT * FROM users` returns empty (RLS blocks unauthenticated reads)
- [ ] Seed data inserts without FK violations
- [ ] TypeScript types generated: `supabase gen types typescript --local > Shadcn/src/types/database.types.ts`
