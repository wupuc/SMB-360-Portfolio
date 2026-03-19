# SMB Platform — Full Product Requirements & Engineering Brief

## INSTRUCTIONS FOR CLAUDE CODE

Before doing anything else, clone and read this repository:
```
https://github.com/Wirasm/PRPs-agentic-eng
```

Follow its methodology exactly:
1. Read the README and understand the PRP (Product Requirements Prompt) workflow
2. Use the PRP templates from that repo to create individual PRPs for each feature you build
3. Follow the "one PRP per feature" discipline — do not build multiple features in one pass
4. Run validation loops after each PRP implementation before moving to the next
5. Store all PRPs in a `/PRPs` directory at the root of this project
6. Never skip the research phase — read existing code before writing new code

This document IS the master PRP. Every sub-feature gets its own PRP derived from this document.

---

## 1. PLATFORM OVERVIEW

### What we are building
A modular SaaS platform for SMB and mid-market companies (5–200 employees). It consists of 6 standalone but interconnected web applications, each sold independently or as a bundle. All apps share one Supabase database per client, one authentication system, one notification service, one file storage system, and one admin settings layer.

### The 6 applications
1. **RequestFlow** — Employee request & approval platform (business trips, leave, home office, equipment, custom requests)
2. **SalesTrack** — CRM with pipeline management, client management, interactions, and marketing campaigns
3. **ProjectHub** — Task and project management with Gantt, sprints, cross-app task aggregation
4. **PeopleHub** — HR, recruitment (ATS), training tracking, performance management, employee self-service
5. **BookIt** — Resource booking (desks, meeting rooms, company cars, any bookable resource)
6. **Helpdesk** — Internal support ticket system with knowledge base, queues, SLA tracking

### Key platform principles
- **One codebase** — Next.js monorepo, all apps as modules within one repository
- **One database per client** — separate Supabase project per client for full data isolation
- **One login** — single authentication, user navigates between apps via module switcher
- **Zero-touch setup** — client admin configures everything from within the app
- **White-label ready** — custom logo, brand color, custom email sender
- **Microsoft-migration-friendly** — schema designed for future Dataverse compatibility (standard SQL, clean FKs, no Supabase-specific hacks)
- **Responsive** — works on desktop and tablet; mobile-optimized for key flows (approvals, bookings)

---

## 2. TECH STACK

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **UI Components:** shadcn/ui (full component library)
- **Styling:** Tailwind CSS
- **State management:** Zustand (global), TanStack Query (server state + caching)
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Gantt chart:** Frappe Gantt (open source, MIT)
- **Date handling:** date-fns
- **File uploads:** Supabase Storage + react-dropzone
- **Rich text editor:** Tiptap (for KB articles, announcements, notes)
- **Drag and drop:** dnd-kit
- **Icons:** Lucide React

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + OAuth ready)
- **Storage:** Supabase Storage (file attachments, avatars, floor plans)
- **Real-time:** Supabase Realtime (notifications, ticket updates)
- **API:** Next.js API Routes + Supabase client
- **Background jobs:** Supabase Edge Functions (escalation timers, email digests, reminders)
- **Email:** Resend (transactional email, custom sender name per client)
- **Validation:** Zod (shared between frontend and backend)

### Infrastructure
- **Hosting:** Vercel (frontend + API routes)
- **Database:** Supabase (one project per client)
- **CI/CD:** GitHub Actions
- **Version control:** GitHub

### Development tools
- **IDE:** VS Code
- **Package manager:** pnpm
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit) + Playwright (E2E)
- **API testing:** Bruno (open source Postman alternative)

---

## 3. REPOSITORY STRUCTURE

```
/
├── PRPs/                          # Product Requirement Prompts (one per feature)
│   ├── 000-master.md              # This document
│   ├── 001-shared-auth.md
│   ├── 002-shared-database.md
│   └── ...
├── apps/
│   └── web/                       # Single Next.js app (all modules)
│       ├── app/
│       │   ├── (auth)/            # Login, register, forgot password
│       │   ├── (platform)/        # All authenticated routes
│       │   │   ├── layout.tsx     # Platform shell with module switcher
│       │   │   ├── dashboard/     # Each app's dashboard
│       │   │   ├── request-flow/
│       │   │   ├── sales-track/
│       │   │   ├── project-hub/
│       │   │   ├── people-hub/
│       │   │   ├── book-it/
│       │   │   ├── helpdesk/
│       │   │   └── settings/      # Shared admin settings
│       │   └── api/               # API routes
│       ├── components/
│       │   ├── ui/                # shadcn/ui components
│       │   ├── shared/            # Shared platform components
│       │   │   ├── module-switcher.tsx
│       │   │   ├── notification-bell.tsx
│       │   │   ├── file-upload.tsx
│       │   │   ├── data-table.tsx
│       │   │   ├── rich-text-editor.tsx
│       │   │   └── ...
│       │   ├── request-flow/      # App-specific components
│       │   ├── sales-track/
│       │   ├── project-hub/
│       │   ├── people-hub/
│       │   ├── book-it/
│       │   └── helpdesk/
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts
│       │   │   ├── server.ts
│       │   │   └── middleware.ts
│       │   ├── utils/
│       │   ├── validations/       # Zod schemas
│       │   └── hooks/             # Shared React hooks
│       └── types/                 # TypeScript types + database types
├── supabase/
│   ├── migrations/                # Database migrations (numbered)
│   ├── seed.sql                   # Development seed data
│   └── functions/                 # Edge functions
├── docs/
│   └── ...
└── README.md
```

---

## 4. SHARED DATABASE SCHEMA

All tables include `created_at`, `updated_at` timestamps and `company_id` UUID (even though each client has a separate Supabase project — kept for forward compatibility with multi-tenant migration).

Row Level Security (RLS) is enabled on ALL tables. Policies are role-based.

### Core shared tables (used by all apps)

```sql
-- Companies (one row per client installation)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#3B82F6',
  email_sender_name TEXT,
  email_sender_address TEXT,
  timezone TEXT DEFAULT 'Europe/Warsaw',
  locale TEXT DEFAULT 'pl',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  -- roles: super_admin, admin, hr, manager, employee
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id),
  head_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams (cross-department groupings, e.g. sales team)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- member, lead
  PRIMARY KEY (team_id, user_id)
);

-- Notifications (central, cross-app)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL, -- approval_needed, request_update, task_assigned, etc.
  source_app TEXT, -- request_flow, sales_track, project_hub, etc.
  source_id UUID, -- ID of the record that triggered the notification
  source_url TEXT, -- deep link to the record
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files (shared storage)
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  uploaded_by UUID REFERENCES users(id),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  mime_type TEXT,
  size_bytes BIGINT,
  source_app TEXT,
  source_id UUID, -- linked record
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements (shared across all apps)
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  body TEXT, -- rich text HTML
  author_id UUID REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module config (which apps are enabled per company)
CREATE TABLE module_config (
  company_id UUID REFERENCES companies(id),
  module TEXT NOT NULL, -- request_flow, sales_track, etc.
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}', -- module-specific settings
  PRIMARY KEY (company_id, module)
);

-- Currencies (shared, admin-configured)
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  code TEXT NOT NULL, -- EUR, USD, PLN
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate DECIMAL(12,6) DEFAULT 1.0, -- relative to base currency
  is_base BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Audit log (immutable, append-only)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- created, updated, deleted, approved, rejected
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. APP 1: REQUESTFLOW

### Purpose
Employee request and approval platform. Employees submit requests (business trips, leave, home office, equipment, etc.), managers approve or reject them through configurable chains. The approval engine is also called by other platform apps.

### User roles
- **Employee** — submits requests, sees own history and leave balance
- **Manager** — approves/rejects requests from their team, sees team calendar
- **HR/Admin** — configures modules, chains, leave entitlements; sees all requests; accesses reports

### Database schema

```sql
-- Approval flow templates (admin-configured per module type)
CREATE TABLE approval_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  module_type TEXT NOT NULL, -- business_trip, vacation, home_office, equipment, custom, etc.
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps within an approval flow
CREATE TABLE approval_flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES approval_flows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- sequential, parallel
  approver_type TEXT NOT NULL, -- specific_user, role, direct_manager, department_head
  approver_user_id UUID REFERENCES users(id), -- if specific_user
  approver_role TEXT, -- if role-based
  condition_field TEXT, -- e.g. 'estimated_budget'
  condition_operator TEXT, -- gt, lt, eq
  condition_value TEXT, -- e.g. '5000'
  is_conditional BOOLEAN DEFAULT FALSE,
  escalation_hours INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegation (manager sets substitute)
CREATE TABLE approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  delegator_id UUID REFERENCES users(id),
  delegate_id UUID REFERENCES users(id),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom module definitions (admin builds own request types)
CREATE TABLE request_module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  module_type TEXT UNIQUE NOT NULL, -- slug identifier
  flow_id UUID REFERENCES approval_flows(id),
  form_schema JSONB NOT NULL, -- field definitions
  is_active BOOLEAN DEFAULT TRUE,
  is_built_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- All requests (single table, polymorphic by module_type)
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  reference_number TEXT UNIQUE NOT NULL, -- e.g. REQ-2024-0001
  module_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  -- statuses: draft, pending, approved, rejected, in_progress, completed, cancelled
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}', -- module-specific form data
  flow_id UUID REFERENCES approval_flows(id),
  current_step INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval decisions per step
CREATE TABLE request_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  step_id UUID REFERENCES approval_flow_steps(id),
  step_order INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  decision TEXT, -- approved, rejected, delegated
  comment TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave entitlements per employee
CREATE TABLE leave_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  leave_type TEXT NOT NULL, -- annual, sick, unpaid, parental
  year INTEGER NOT NULL,
  total_days DECIMAL(5,1) NOT NULL,
  used_days DECIMAL(5,1) DEFAULT 0,
  UNIQUE (user_id, leave_type, year)
);

-- Bank holidays
CREATE TABLE bank_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  country_code TEXT DEFAULT 'PL'
);

-- Business trip expense submissions (post-trip)
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  submitted_by UUID REFERENCES users(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency_id UUID REFERENCES currencies(id),
  category TEXT, -- transport, hotel, meals, other
  receipt_file_id UUID REFERENCES files(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Built-in module types
`business_trip` | `vacation` | `home_office` | `budget_request` | `equipment_request` | `overtime` | `training_course` | `custom`

### Screens
1. **Dashboard** — role-aware; employee sees pending requests + leave balance; manager sees approvals inbox + team calendar; admin sees all stats
2. **New request** — module picker → dynamic form based on module definition → submit
3. **My requests** — table with filters (status, type, date); click to view detail and timeline
4. **Approvals inbox** — manager view; pending items with quick approve/reject + comment
5. **Team calendar** — built-in calendar; approved leave, business trips, home office shown per person; absent people highlighted
6. **Reports** — request volume by type, average approval time, rejection rate, leave balance summary
7. **Announcements** — pinnable company-wide posts
8. **Settings (admin)**
   - Module on/off toggle per module type
   - Approval flow builder per module (steps, conditions, approver assignment)
   - Leave entitlements per employee/year
   - Bank holidays management
   - Delegation management (set substitutes)
   - Custom module builder (field types: text, textarea, date, date range, number, currency, dropdown, file upload, user picker)

### Key user stories

**As an employee:**
- I can submit a business trip request with destination, dates, purpose, and estimated budget
- I can submit a vacation request and see my remaining leave balance before submitting
- I can track the status of all my requests with a visual timeline of approval steps
- I can re-submit a rejected request with changes after reading the rejection comment
- I can see who is away on the team calendar before picking my leave dates
- I can upload receipts and submit actual costs after returning from a trip

**As a manager:**
- I can see all pending approval requests in one inbox, sorted by urgency
- I can approve or reject with a comment in two clicks
- I can see my team's calendar with absences and trips at a glance
- I can set a delegate for my approvals before going on leave

**As an admin/HR:**
- I can configure approval chains per module type (sequential steps, conditional steps)
- I can turn modules on or off for the company
- I can set leave entitlements per employee per year
- I can build a custom request module with a form designer
- I can see full request history and approval audit trail

### Cross-app integrations
- Business trip approved → block dates in built-in calendar
- Budget request approved → referenced in ProjectHub project budget
- Any request approved with calendar dates → visible in BookIt team absence view
- Custom modules can be invoked from other apps (e.g. SalesTrack deal discount → creates a budget_request)

---

## 6. APP 2: SALESTRACK

### Purpose
CRM for sales representatives. Manages clients, opportunities, interactions, products, and lightweight marketing campaigns. Central tool for daily sales work.

### User roles
- **Sales rep** — manages own clients and opportunities, logs interactions
- **Sales manager** — sees team pipeline, assigns clients, views forecasts
- **Admin** — configures pipeline stages, products, teams, currencies

### Database schema

```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'lead', -- lead, strategic, regular, inactive
  industry TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'PL',
  assigned_to UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  lead_score INTEGER DEFAULT 0, -- 1-5 manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client contacts (multiple per client)
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline stages (admin-configured)
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  system_flag TEXT NOT NULL, -- in_progress, won, lost, on_hold
  color TEXT DEFAULT '#3B82F6',
  probability_default INTEGER DEFAULT 50, -- %
  is_active BOOLEAN DEFAULT TRUE
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  stage_id UUID REFERENCES pipeline_stages(id),
  owner_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  estimated_value DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason TEXT, -- win/loss reason (admin-configured list)
  last_activity_at TIMESTAMPTZ,
  inactivity_flag TEXT, -- null, amber, red (auto-computed)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity products (many-to-many)
CREATE TABLE opportunity_products (
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(14,2),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  PRIMARY KEY (opportunity_id, product_id)
);

-- Products (admin-managed)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  category TEXT,
  sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions / Tasks
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type TEXT NOT NULL, -- call, meeting, email, note, conference, task
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  opportunity_id UUID REFERENCES opportunities(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'todo', -- todo, in_progress, done
  -- Email interaction fields
  email_to TEXT,
  email_from TEXT,
  email_subject TEXT,
  -- Campaign link
  campaign_id UUID REFERENCES campaigns(id),
  -- Cross-app: also visible in ProjectHub
  project_hub_task_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Close reasons (admin-configured)
CREATE TABLE close_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- won, lost
  is_active BOOLEAN DEFAULT TRUE
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- email_blast, event, cold_outreach, linkedin, trade_show, webinar
  status TEXT DEFAULT 'draft', -- draft, active, completed
  owner_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  goal TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign products (link campaign to products)
CREATE TABLE campaign_products (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  PRIMARY KEY (campaign_id, product_id)
);

-- Contact segments (dynamic saved filters)
CREATE TABLE contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB NOT NULL, -- serialised filter state
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign audience (segment linked to campaign)
CREATE TABLE campaign_audiences (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES contact_segments(id),
  PRIMARY KEY (campaign_id, segment_id)
);

-- Email templates (for reps)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- rich text
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Screens
1. **Dashboard** — today's tasks, pipeline summary (value by stage), recent interactions, inactivity alerts
2. **Clients** — filterable/sortable table; import CSV; export CSV; duplicate detection on add; click to open client profile
3. **Client profile** — all contacts, linked opportunities, interactions, documents, notes
4. **Opportunities** — table view + Kanban by stage; inactivity flags visual; filters by stage/owner/team/value
5. **Opportunity detail** — all linked products, interactions, documents, approval history
6. **Interactions** — table of all interactions; filter by type/status/client/owner; add email interaction form
7. **Products** — admin only; list with price and availability
8. **Campaigns** — list with status; campaign detail with audience, interactions, attribution metrics
9. **Segments** — saved audience filters; dynamic; shared
10. **Forecast** — projected monthly revenue (value × probability); filtered by rep/team/period
11. **Reports** — pipeline by stage, win/loss reasons, activity per rep, campaign ROI
12. **Settings (admin)** — pipeline stages + system flags, close reasons, inactivity thresholds, email templates, team config

### Key user stories

**As a sales rep:**
- I can see all my clients in a table and filter by type, industry, or assigned rep
- I can open a client profile and see every interaction, opportunity, and document in one place
- I can add a new opportunity and link it to a client, products, and estimated value
- I can move an opportunity through pipeline stages via Kanban drag-and-drop
- I can log an email interaction with subject/body fields without leaving the app
- I can see a flag on deals with no activity in the configured threshold
- I can assign a lead score (1–5) to a client

**As a sales manager:**
- I can see my entire team's pipeline on one Kanban board
- I can see a forecast view showing projected revenue by month
- I can see which deals are at risk (inactivity flagged)

**As an admin:**
- I can configure pipeline stages, assign system flags, set order
- I can configure win/loss reason lists
- I can set inactivity thresholds (amber/red) in days

### Cross-app integrations
- Opportunity marked won (stage with `won` flag) → auto-create project in ProjectHub using "New client onboarding" template
- Deal above configured threshold → trigger RequestFlow `budget_request` approval
- Interactions of type `task` → also appear in ProjectHub "my tasks"
- Campaign with event dates → visible in RequestFlow built-in calendar

---

## 7. APP 3: PROJECTHUB

### Purpose
Central work coordination layer. Tasks from any app aggregate here. Projects with Gantt charts, sprints, team workload management.

### User roles
- **Team member** — sees assigned tasks, updates status, adds comments
- **Project lead/Manager** — creates projects, assigns tasks, manages sprints, sees workload
- **Admin** — configures project templates, teams

### Database schema

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  owner_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  client_id UUID REFERENCES clients(id), -- link to SalesTrack client
  start_date DATE,
  end_date DATE,
  estimated_budget DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  template_id UUID REFERENCES project_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- member, lead, observer
  PRIMARY KEY (project_id, user_id)
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning', -- planning, active, completed
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  project_id UUID REFERENCES projects(id),
  sprint_id UUID REFERENCES sprints(id),
  milestone_id UUID REFERENCES milestones(id),
  parent_task_id UUID REFERENCES tasks(id), -- for subtasks
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- todo, in_progress, review, done, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  created_by UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  -- Cross-app source tracking
  source_app TEXT, -- request_flow, sales_track, helpdesk, people_hub
  source_id UUID,
  source_label TEXT, -- human-readable reference
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- iCal RRULE format
  -- Labels (stored as array)
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task assignees (multiple per task)
CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (task_id, user_id)
);

-- Task dependencies
CREATE TABLE task_dependencies (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'finish_to_start',
  PRIMARY KEY (task_id, depends_on_id)
);

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project templates
CREATE TABLE project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_built_in BOOLEAN DEFAULT FALSE,
  trigger_app TEXT, -- which app auto-triggers this template
  trigger_event TEXT, -- e.g. 'opportunity_won'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template tasks
CREATE TABLE project_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES project_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  role_assignment TEXT, -- role (not person) to assign to
  days_from_start INTEGER DEFAULT 0, -- offset from project start date
  order_index INTEGER NOT NULL
);
```

### Built-in project templates
1. `new_client_onboarding` — triggered when SalesTrack opportunity is won
2. `software_launch` — sprints, milestones, go-live checklist
3. `employee_onboarding` — triggered when PeopleHub new hire created
4. `event_tradeshow` — logistics, materials, travel requests
5. `business_trip_followup` — triggered when RequestFlow trip is approved
6. `recruitment_process` — triggered when PeopleHub position opens

### Screens
1. **Dashboard** — my tasks (due today/week), my projects, overdue items, quick-add
2. **My tasks** — flat list of all tasks assigned to me across all projects + standalone; filters by priority/status/source
3. **Projects** — list/grid with status, owner, progress bar, linked client
4. **Project detail**
   - Task list view (filterable)
   - Kanban by status
   - Gantt chart (Frappe Gantt; drag to reschedule; dependencies shown)
   - Sprint board
   - Milestones timeline
   - Activity log
   - Members
   - Files
5. **Team workload** — calendar view per person; tasks shown as bars; RequestFlow leave/absences overlaid; capacity indicator
6. **Reports** — velocity, completion rate, overdue analysis, project health

### Key user stories

**As a team member:**
- I can see all my tasks from all apps in one "My tasks" view
- I can update task status, add comments, and upload files
- I see tasks from SalesTrack, PeopleHub, and Helpdesk automatically without re-entering data
- I can create subtasks under any task

**As a project lead:**
- I can create a project from a template and all tasks are pre-populated
- I can view the Gantt chart and drag tasks to reschedule
- I can see team workload and who has capacity before assigning tasks
- I can run a sprint — move tasks into backlog, activate sprint, close sprint

**As an admin:**
- I can create and edit project templates with role-based task assignments
- I can configure which templates auto-trigger from cross-app events

### Cross-app integrations
- Receives tasks from: SalesTrack (interactions type task), Helpdesk (escalated tickets), RequestFlow (post-trip tasks), PeopleHub (onboarding checklist)
- All incoming cross-app tasks carry `source_app` + `source_id` — status updates sync back bidirectionally
- Team workload view reads absence data from RequestFlow approved leave/trips
- Project budget shows actual spend from RequestFlow approved budget requests linked to this project
- Won opportunity in SalesTrack → auto-creates project from template

---

## 8. APP 4: PEOPLEHUB

### Purpose
HR system covering the full employee lifecycle: directory, org structure, recruitment, training, performance management, and employee self-service portal with HR requests.

### User roles
- **Employee** — self-service: sees own profile, documents, training, requests to HR
- **Manager** — sees team members, collaborates on candidate profiles, runs performance reviews
- **HR** — full access to all employee data, recruitment pipeline, training management, performance cycles
- **Admin** — system configuration

### Database schema

```sql
-- Employee profiles (extends users table)
CREATE TABLE employee_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  -- Personal
  date_of_birth DATE,
  personal_phone TEXT,
  personal_email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- Employment
  employee_number TEXT,
  job_title TEXT,
  contract_type TEXT, -- permanent, b2b, contract, internship
  start_date DATE NOT NULL,
  end_date DATE, -- for contracts
  salary_band TEXT, -- HR/admin only
  salary_amount DECIMAL(12,2), -- HR/admin only
  salary_currency_id UUID REFERENCES currencies(id), -- HR/admin only
  notice_period_days INTEGER,
  -- Status
  employment_status TEXT DEFAULT 'active', -- active, on_notice, inactive
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee documents (personal folder, shared with HR only)
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  file_id UUID REFERENCES files(id),
  document_type TEXT, -- contract, id_copy, certificate, other
  uploaded_by UUID REFERENCES users(id),
  is_visible_to_employee BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recruitment positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  description TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'draft', -- draft, open, interviewing, offer, closed
  hiring_manager_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  opened_at DATE,
  closed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  position_id UUID REFERENCES positions(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_company TEXT,
  linkedin_url TEXT,
  cv_file_id UUID REFERENCES files(id),
  source TEXT, -- linkedin, referral, job_board, direct
  stage TEXT DEFAULT 'applied', -- applied, screened, interview_1, interview_2, offer, hired, rejected
  stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
  overall_rating INTEGER, -- 1-5 average of collaborator ratings
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate collaborators (HR grants access)
CREATE TABLE candidate_collaborators (
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  can_rate BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (candidate_id, user_id)
);

-- Candidate ratings (from collaborators)
CREATE TABLE candidate_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  rated_by UUID REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training items
CREATE TABLE training_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  provider TEXT,
  type TEXT, -- course, workshop, certification, webinar
  description TEXT,
  duration_hours DECIMAL(6,2),
  cost DECIMAL(12,2),
  currency_id UUID REFERENCES currencies(id),
  external_url TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training assignments
CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES training_items(id),
  user_id UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  due_date DATE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  completed_at DATE,
  certificate_file_id UUID REFERENCES files(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR request types (admin-configured)
CREATE TABLE hr_request_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB DEFAULT '[]', -- required fields and document types
  assignee_role TEXT DEFAULT 'hr', -- who receives it
  is_active BOOLEAN DEFAULT TRUE
);

-- HR requests (raised by employees to HR)
CREATE TABLE hr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type_id UUID REFERENCES hr_request_types(id),
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  title TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding/offboarding templates
CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- onboarding, offboarding
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible TEXT, -- hr, manager, employee, it
  days_offset INTEGER DEFAULT 0, -- relative to start/end date
  is_visible_to_employee BOOLEAN DEFAULT TRUE,
  order_index INTEGER NOT NULL
);

-- Performance review cycles
CREATE TABLE review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- self_review, manager_review, 360
  status TEXT DEFAULT 'draft', -- draft, open, in_progress, completed
  period_start DATE,
  period_end DATE,
  submission_deadline DATE,
  form_schema JSONB NOT NULL, -- configurable questions
  show_self_review_to_manager TEXT DEFAULT 'after', -- before, after, never
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES review_cycles(id),
  employee_id UUID REFERENCES users(id),
  reviewer_id UUID REFERENCES users(id),
  reviewer_type TEXT NOT NULL, -- self, manager, peer
  responses JSONB DEFAULT '{}',
  overall_rating INTEGER,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  review_cycle_id UUID REFERENCES review_cycles(id),
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT,
  due_date DATE,
  progress INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-on-one notes
CREATE TABLE one_on_one_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES users(id),
  employee_id UUID REFERENCES users(id),
  meeting_date DATE NOT NULL,
  manager_notes TEXT,
  employee_notes TEXT,
  action_items TEXT,
  mood_indicator TEXT, -- great, good, neutral, struggling
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Screens
1. **Dashboard** — headcount, open positions, new starters, expiring contracts (visual warning), training completion rate
2. **Employees** — table with filters; click to open profile
3. **Employee profile** — tabs: Personal info / Employment / Documents / Training / Requests / Performance
4. **Self-service portal** (employee view) — my profile (editable contact fields), my documents, my training, my HR requests, my onboarding checklist
5. **Org chart** — visual hierarchy, clickable, department grouping
6. **Recruitment** — positions list → position detail → candidate pipeline per position (stage Kanban) → candidate profile
7. **Training** — assign training; compliance view; my training (employee view)
8. **Onboarding/offboarding** — active onboarding checklists; configure templates
9. **HR Requests** — all open requests (HR view); configure request types
10. **Performance** — review cycles; cycle detail; goals per employee; one-on-one log
11. **Reports** — headcount, turnover, time-to-hire, training compliance, review completion
12. **Announcements** — company-wide posts (shared with other apps)
13. **Settings** — department management, HR request types, onboarding templates, review cycle config

### Cross-app integrations
- Hired candidate → create employee record → trigger ProjectHub onboarding template
- Leave entitlements sync with RequestFlow
- Absence data feeds ProjectHub team workload view
- HR requests run through RequestFlow approval engine
- Training assignments linked to RequestFlow training_course module
- Employee offboarding → notify relevant people via RequestFlow

---

## 9. APP 5: BOOKIT

### Purpose
Resource booking for offices. Desks, meeting rooms, company cars, parking spots, and any bookable resource type. Simple enough for a 10-person company, scalable to 200.

### Database schema

```sql
-- Resource types (admin-configured)
CREATE TABLE resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL, -- Desk, Meeting Room, Company Car, Parking
  icon TEXT,
  booking_mode TEXT DEFAULT 'instant', -- instant, approval, admin_only
  requires_approval BOOLEAN DEFAULT FALSE,
  max_booking_days INTEGER DEFAULT 1,
  advance_booking_days INTEGER DEFAULT 30,
  cancellation_cutoff_minutes INTEGER DEFAULT 60,
  checkin_required BOOLEAN DEFAULT FALSE,
  checkin_window_minutes INTEGER DEFAULT 15,
  custom_attributes JSONB DEFAULT '[]', -- extra field definitions
  is_active BOOLEAN DEFAULT TRUE
);

-- Floors / locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL, -- "Floor 2", "Warsaw Office"
  address TEXT,
  floor_plan_url TEXT, -- Supabase Storage path for uploaded image
  order_index INTEGER DEFAULT 0
);

-- Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type_id UUID REFERENCES resource_types(id),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 1,
  photo_url TEXT,
  status TEXT DEFAULT 'available', -- available, unavailable, maintenance
  -- Floor map pin position (percentage-based for responsive map)
  map_x DECIMAL(6,3), -- 0-100 (% from left)
  map_y DECIMAL(6,3), -- 0-100 (% from top)
  -- Desk assignment type
  desk_type TEXT DEFAULT 'hot', -- hot (bookable), assigned (permanent)
  permanently_assigned_to UUID REFERENCES users(id),
  -- Car-specific
  license_plate TEXT,
  mileage_log_enabled BOOLEAN DEFAULT FALSE,
  -- Custom attributes (values)
  custom_attributes JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance windows
CREATE TABLE resource_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  resource_id UUID REFERENCES resources(id),
  booked_by UUID REFERENCES users(id),
  -- Visitor bookings
  visitor_name TEXT,
  visitor_company TEXT,
  host_user_id UUID REFERENCES users(id),
  -- Time
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  -- Status
  status TEXT DEFAULT 'confirmed', -- pending_approval, confirmed, cancelled, no_show, checked_in
  purpose TEXT,
  -- Approval link (if resource requires approval)
  request_id UUID REFERENCES requests(id),
  -- Check-in
  checked_in_at TIMESTAMPTZ,
  -- Mileage (for cars)
  km_start INTEGER,
  km_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR codes (generated per resource)
CREATE TABLE resource_qr_codes (
  resource_id UUID PRIMARY KEY REFERENCES resources(id),
  qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Screens
1. **Dashboard** — today's bookings (mine), current resource status, upcoming reservations, quick-book
2. **Book a resource** — pick type → see availability calendar/grid → select slot → confirm or submit for approval
3. **Floor map** — per location/floor; floor plan image with colored pins; click pin to book
4. **My bookings** — upcoming and past; cancel option
5. **All bookings** (admin) — full calendar view; filter by resource/person/type
6. **Resources** (admin) — list and manage resources; add/edit; set maintenance windows
7. **Floor map editor** (admin) — upload floor plan image; click to place pins; assign to desk records
8. **Reports** — utilization rates, occupancy by day, no-show rates, mileage log per car
9. **Settings** — resource types, locations, booking rules per type

### Cross-app integrations
- Bookings requiring approval → route through RequestFlow
- Approved trips/leave in RequestFlow → show person as unavailable in floor map
- PeopleHub onboarding → auto-create desk assignment task
- Room bookings → visible in built-in calendar

---

## 10. APP 6: HELPDESK

### Purpose
Internal support ticket system. Employees report problems (IT, HR, facilities). Agents manage queues, use knowledge base, track SLA, log time.

### Database schema

```sql
-- Queues (e.g. IT Support, HR, Facilities)
CREATE TABLE helpdesk_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  email_address TEXT, -- incoming email alias (future)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue agents
CREATE TABLE queue_agents (
  queue_id UUID REFERENCES helpdesk_queues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'agent', -- agent, team_lead
  PRIMARY KEY (queue_id, user_id)
);

-- SLA policies
CREATE TABLE sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES helpdesk_queues(id) ON DELETE CASCADE,
  priority TEXT NOT NULL, -- low, medium, high, urgent
  response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL
);

-- Categories
CREATE TABLE helpdesk_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES helpdesk_queues(id),
  name TEXT NOT NULL,
  default_priority TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE
);

-- Canned responses
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES helpdesk_queues(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  reference_number TEXT UNIQUE NOT NULL, -- e.g. TKT-2024-0001
  queue_id UUID REFERENCES helpdesk_queues(id),
  category_id UUID REFERENCES helpdesk_categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open', -- open, in_progress, pending_submitter, resolved, closed
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  -- Client link (SalesTrack)
  client_id UUID, -- references sales_track clients
  -- Cross-app
  project_task_id UUID, -- if escalated to ProjectHub
  request_id UUID REFERENCES requests(id), -- if approval triggered
  -- Parent/child (split tickets)
  parent_ticket_id UUID REFERENCES tickets(id),
  -- SLA tracking
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_response_due_at TIMESTAMPTZ,
  sla_resolution_due_at TIMESTAMPTZ,
  sla_paused_at TIMESTAMPTZ, -- when status = pending_submitter
  -- CSAT
  csat_rating INTEGER CHECK (csat_rating BETWEEN 1 AND 5),
  csat_comment TEXT,
  csat_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages (thread)
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE, -- not visible to submitter
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time logs
CREATE TABLE ticket_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id),
  minutes INTEGER NOT NULL,
  note TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base
CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  queue_id UUID REFERENCES helpdesk_queues(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL, -- rich text
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, published
  author_id UUID REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Screens
1. **Dashboard** — open tickets assigned to me, SLA breach alerts, recent activity, queue summary (admin)
2. **Tickets** — queue view; filter by status/priority/assignee/SLA; bulk actions
3. **Ticket detail** — full thread; internal notes tab; time log; escalate button; merge/split; assign; link to KB; link to client (SalesTrack); trigger RequestFlow approval
4. **Knowledge base** — article list; search; article view with helpful rating; suggested articles on new ticket
5. **KB editor** — Tiptap rich text; categories; tags; draft/publish
6. **Reports** — volume, resolution time, SLA compliance, CSAT scores, agent performance, time logged
7. **Settings** — queues, agents, categories, SLA policies, canned responses

### Cross-app integrations
- Tickets linked to SalesTrack client record
- Ticket escalated → creates task in ProjectHub (bidirectional status)
- Exception ticket → triggers RequestFlow approval
- Agent time logs → visible in agent performance view

---

## 11. SHARED PLATFORM SHELL

### Module switcher
- Bottom-left popup (click user avatar / app icon area)
- Shows all 6 apps as a grid
- Active module highlighted
- Disabled modules greyed out (not purchased/enabled)
- Links directly to that app's dashboard
- Built as a floating panel, not a full modal

### Notification center
- Bell icon in top nav bar, visible across all apps
- Badge count of unread notifications
- Dropdown panel: notification list with app icon, title, body, time, source link
- Mark as read; mark all as read
- All apps write to shared `notifications` table via server action
- Supabase Realtime subscription updates bell count instantly

### White-label system
- Stored in `companies` table: `logo_url`, `brand_color`
- Brand color generates a full CSS custom property set at runtime (primary, primary-hover, primary-foreground)
- Logo shown in top nav and login page
- Custom email sender name used in all Resend emails
- Login page supports custom background image (stored in Supabase Storage)
- All implemented via CSS variables injected in root layout from company settings

### Admin settings (shared layer)
- Reachable via Settings icon in every app's nav
- Sections:
  - **Company** — name, logo, brand color, email sender, timezone, locale
  - **Users** — invite, manage roles, deactivate
  - **Departments & Teams** — org structure
  - **Modules** — enable/disable each of the 6 apps
  - **Currencies** — list, exchange rates, base currency
  - **Notifications** — email digest settings per user
  - App-specific settings (each app contributes its own settings section)

---

## 12. SECURITY & RLS

### Row Level Security policies (pattern for all tables)

```sql
-- Employees can only read their own company's data
CREATE POLICY "company_isolation" ON [table]
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Employees can only see their own sensitive data
CREATE POLICY "employee_own_data" ON employee_profiles
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('hr', 'admin', 'super_admin')
  );

-- Salary fields visible only to HR and admin
-- Implement via a view that redacts salary columns for non-HR roles
CREATE VIEW employee_profiles_safe AS
  SELECT
    user_id, company_id, date_of_birth, job_title, contract_type,
    start_date, end_date, employment_status,
    CASE WHEN (SELECT role FROM users WHERE id = auth.uid()) IN ('hr','admin','super_admin')
      THEN salary_amount ELSE NULL END as salary_amount,
    CASE WHEN (SELECT role FROM users WHERE id = auth.uid()) IN ('hr','admin','super_admin')
      THEN salary_band ELSE NULL END as salary_band
  FROM employee_profiles;
```

### Auth middleware
- Supabase middleware in `middleware.ts` protects all `/platform/*` routes
- Role checked on every protected server action
- Company ID always validated against authenticated user's company

### API security
- All mutations go through Next.js Server Actions (not client-direct Supabase writes for sensitive operations)
- Zod validation on all inputs before any database write
- Rate limiting on auth endpoints via Supabase

---

## 13. FILE STORAGE STRUCTURE

```
supabase-storage/
├── company-assets/
│   ├── {company_id}/
│   │   ├── logo.png
│   │   └── login-background.jpg
├── employee-documents/
│   └── {company_id}/{user_id}/{file_id}-{filename}
├── floor-plans/
│   └── {company_id}/{location_id}/{filename}
├── attachments/
│   └── {company_id}/{source_app}/{source_id}/{file_id}-{filename}
└── avatars/
    └── {user_id}/{filename}
```

Storage policies: employees can only read their own folder; HR can read all employee documents; public access only for company logo and floor plans within same company.

---

## 14. EMAIL SYSTEM

All emails sent via Resend. Email sender name and address configurable per company.

### Email types by app

**RequestFlow:**
- Request submitted (to approvers in chain)
- Approved / rejected (to submitter)
- Reminder: pending approval not actioned in 24h
- Reminder: request starting tomorrow

**SalesTrack:**
- Deal inactivity alert (to assigned rep)
- Campaign milestone reached (to owner)

**ProjectHub:**
- Task assigned to you
- Task overdue
- Sprint starting

**PeopleHub:**
- New candidate in pipeline (to HR)
- Contract expiring in 30 days (to HR)
- Review cycle open (to all participants)
- Onboarding task due (to responsible person)

**BookIt:**
- Booking confirmed
- Booking reminder (day before)
- Booking cancelled

**Helpdesk:**
- New ticket created (to assigned agent)
- Ticket reply received (to submitter)
- SLA breach warning
- CSAT rating request (on close)

All email templates: React Email components, white-label aware (logo + brand color injected).

---

## 15. BUILD ORDER & PRIORITIES

### Phase 1 — Foundation (build this first, everything else depends on it)
1. Supabase project setup + shared schema migrations (companies, users, departments, teams, notifications, files, currencies, audit_log)
2. Next.js project scaffold with shadcn/ui, Tailwind, TypeScript strict
3. Authentication flow (login, register, password reset, middleware)
4. Platform shell (layout, top nav, module switcher popup, notification bell)
5. Admin settings — company branding, user management, module toggle
6. White-label system (CSS variable injection from company settings)
7. Shared components library (DataTable, FileUpload, RichTextEditor, NotificationBell, ModuleSwitcher)

### Phase 2 — RequestFlow (first full app)
Build all RequestFlow features using shared foundation. This validates the approval engine which every other app needs.

### Phase 3 — SalesTrack
Depends on: shared users, teams, currencies, files, notifications, and the approval engine from RequestFlow.

### Phase 4 — ProjectHub
Depends on: tasks cross-app model, SalesTrack client links, RequestFlow absence data.

### Phase 5 — PeopleHub
Depends on: users, departments, files, RequestFlow (leave sync, HR requests), ProjectHub (onboarding template).

### Phase 6 — BookIt
Depends on: users, RequestFlow (approval routing, absence view), notifications.

### Phase 7 — Helpdesk
Depends on: users, notifications, SalesTrack (client link), ProjectHub (task escalation), RequestFlow (approval trigger).

---

## 16. PRP DISCIPLINE FOR CLAUDE CODE

When building each feature, follow this workflow from the PRPs-agentic-eng repository:

1. **Read the repo first** — `https://github.com/Wirasm/PRPs-agentic-eng` — understand the PRP template format and validation loop concept
2. **One PRP per feature** — never bundle multiple features. Examples of correctly scoped PRPs:
   - `001-auth-login-page.md`
   - `002-shared-data-table-component.md`
   - `003-request-flow-schema-migration.md`
   - `004-request-flow-dashboard-employee-view.md`
3. **Research before writing** — read existing files, understand current patterns, check what already exists before adding anything
4. **Validation loop** — after implementing a PRP, run: TypeScript check → lint → unit tests → manual smoke test → only then mark done
5. **No orphaned code** — every new file must be imported/used somewhere. Every new database table must have a migration file.
6. **Commit per PRP** — one git commit per completed PRP with the PRP ID in the commit message

### PRP template structure (use this for every feature)
```markdown
# PRP-{id}: {Feature Name}

## Context
What already exists. What files are relevant. What patterns to follow.

## Goal
Exactly what this PRP delivers. One clear outcome.

## Implementation steps
1. ...
2. ...

## Files to create/modify
- path/to/file.ts — purpose

## Validation
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes
- [ ] Component renders in browser
- [ ] RLS policy tested (data isolation confirmed)
- [ ] Mobile responsive check
```

---

## 17. CODING STANDARDS

- **TypeScript:** strict mode, no `any`, all DB types generated from Supabase schema using `supabase gen types`
- **Components:** server components by default, client components only when needed (forms, interactive UI)
- **Data fetching:** server components fetch directly via Supabase server client; client components use TanStack Query
- **Mutations:** Next.js Server Actions with Zod validation — never client-direct writes for anything sensitive
- **Error handling:** every server action returns `{ data, error }` — never throw, always return
- **Loading states:** every data-fetching component has a skeleton loader
- **Empty states:** every list/table has a proper empty state with a call to action
- **Responsive:** all layouts tested at 375px (mobile), 768px (tablet), 1280px (desktop)
- **Accessibility:** all interactive elements keyboard navigable; proper ARIA labels; color contrast AA minimum

---

## 18. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_DEFAULT=noreply@yourplatform.com

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Platform

# Feature flags
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false
NEXT_PUBLIC_ENABLE_MICROSOFT_AUTH=false
```

---

## 19. FUTURE CONSIDERATIONS (do not build now, but keep in mind)

- **Microsoft migration:** schema uses standard PostgreSQL — no Supabase-specific types. When migrating to Dataverse, table names and field names should map cleanly. Avoid Supabase-only features in the critical path.
- **Google Calendar / Outlook OAuth:** built-in calendar is v1. OAuth integration is v2. The calendar event data model should be designed to support both.
- **Email OAuth (Gmail/Outlook per rep):** manual email logging is v1. OAuth sync is v2. The `interactions` table already has `email_to/from/subject` fields to support both.
- **Multi-tenant:** currently one Supabase project per client. If moving to shared infrastructure, `company_id` is already on every table. Migration path exists.
- **Mobile app:** React Native with Expo, sharing Zod schemas and API logic from the web app.
- **Payroll export:** `employee_profiles` has salary fields. CSV export format should be designed per-country (Poland: Symfonia/Optima compatible format).
- **StockManager app:** warehouse inventory, asset tracking, check-out/check-in. Schema placeholder: `inventory_items`, `inventory_movements`, `asset_assignments`. Scope to be defined.
