# PRP-005: Admin Settings

## Context
- PRP-004 established the platform shell with a Settings route at `/platform/settings`.
- PRP-001 created the `companies`, `users`, `departments`, `teams`, `module_config`, `currencies` tables.
- PRP-003 established role-based user session (roles: super_admin, admin, hr, manager, employee).
- Source spec: PLATFORM_PRP_1.md §11 "SHARED PLATFORM SHELL > Admin settings (shared layer)"

## Goal
Build the shared Admin Settings area with 5 sections:
1. **Company** — name, logo upload, brand color picker, email sender, timezone, locale
2. **Users** — invite user, manage roles, deactivate
3. **Departments & Teams** — create/edit departments (with parent), create/edit teams, assign members
4. **Modules** — enable/disable each of the 6 apps for this company
5. **Currencies** — list currencies, set exchange rates, set base currency

All mutations use Next.js Server Actions with Zod validation. Only `admin` and `super_admin` roles can access this area.

## Implementation steps

### 1. Settings layout
`src/app/(platform)/settings/layout.tsx`:
- Server component — check role; if not admin/super_admin → redirect to `/platform/dashboard`
- Left sidebar nav with 5 sections (Company, Users, Departments & Teams, Modules, Currencies)

### 2. Company settings page (`/settings/company`)
Form with fields:
- Company name (text)
- Logo (file upload → Supabase Storage `company-assets/{company_id}/logo.png`)
- Brand color (color picker input, hex value stored in `companies.brand_color`)
- Email sender name + address (`email_sender_name`, `email_sender_address`)
- Timezone (select, list of IANA timezones)
- Locale (select: pl, en, de, fr)

Server action: `updateCompanySettings(formData)` → Zod validate → `UPDATE companies SET ... WHERE id = company_id`
Logo upload: client-side Supabase Storage upload → returns URL → include in form submission

### 3. Users management page (`/settings/users`)
DataTable columns: Name, Email, Role, Department, Status (active/inactive), Actions

Invite user:
- Dialog with: email, first_name, last_name, role (select), department (select)
- Server action: `supabase.auth.admin.inviteUserByEmail()` + pre-create `users` row
- Sends Supabase invite email

Change role:
- Inline select in row; server action: `updateUserRole(userId, role)`

Deactivate/reactivate:
- Toggle `users.is_active`; deactivated users cannot log in (handled by middleware check)

### 4. Departments & Teams page (`/settings/departments`)
Two sections on one page (tabs):

**Departments tab:**
- Tree view of departments (parent/child hierarchy)
- Add department: name, parent department (optional), department head (user picker)
- Edit/delete department

**Teams tab:**
- Table of teams
- Add team: name, description
- Manage members: dialog with multi-user selector
- Role within team: member or lead

### 5. Modules page (`/settings/modules`)
Card grid (one per module):
- App icon + name + description
- Toggle switch → `UPDATE module_config SET is_enabled = !is_enabled WHERE company_id=? AND module=?`
- Shows count of active users per module (if tracking)

Server action: `toggleModule(moduleKey, enabled)`

### 6. Currencies page (`/settings/currencies`)
Table: Code, Name, Symbol, Exchange Rate, Base, Active

Add currency: code (ISO 4217), name, symbol, exchange rate, set as base (radio, only one base allowed)
Edit exchange rate inline
Set base currency (clears `is_base` on all others, sets on selected)
Toggle active/inactive

## Server actions to create
`src/app/actions/company.ts`:
- `updateCompanySettings(data)`
- `uploadCompanyLogo(file)`

`src/app/actions/users.ts`:
- `inviteUser(data)`
- `updateUserRole(userId, role)`
- `toggleUserActive(userId)`

`src/app/actions/departments.ts`:
- `createDepartment(data)`
- `updateDepartment(id, data)`
- `deleteDepartment(id)`

`src/app/actions/teams.ts`:
- `createTeam(data)`
- `updateTeamMembers(teamId, userIds)`

`src/app/actions/modules.ts`:
- `toggleModule(moduleKey, enabled)`

`src/app/actions/currencies.ts`:
- `upsertCurrency(data)`
- `setBaseCurrency(currencyId)`

## Files to create/modify
- `Shadcn/src/app/(platform)/settings/layout.tsx`
- `Shadcn/src/app/(platform)/settings/page.tsx` — redirect to /settings/company
- `Shadcn/src/app/(platform)/settings/company/page.tsx`
- `Shadcn/src/app/(platform)/settings/users/page.tsx`
- `Shadcn/src/app/(platform)/settings/departments/page.tsx`
- `Shadcn/src/app/(platform)/settings/modules/page.tsx`
- `Shadcn/src/app/(platform)/settings/currencies/page.tsx`
- `Shadcn/src/app/actions/company.ts`
- `Shadcn/src/app/actions/users.ts`
- `Shadcn/src/app/actions/departments.ts`
- `Shadcn/src/app/actions/teams.ts`
- `Shadcn/src/app/actions/modules.ts`
- `Shadcn/src/app/actions/currencies.ts`

## Validation
- [ ] TypeScript: no errors
- [ ] Lint: passes
- [ ] Non-admin user visiting `/settings` is redirected
- [ ] Company logo upload saves to Supabase Storage and URL updates in DB
- [ ] Brand color change reflects immediately in platform shell (CSS variable)
- [ ] Invite user: new row appears in Supabase Auth + public.users
- [ ] Module toggle: module becomes greyed in module switcher when disabled
- [ ] Currency marked as base: other currencies' `is_base` cleared
- [ ] All server actions return `{ data, error }` (never throw)
