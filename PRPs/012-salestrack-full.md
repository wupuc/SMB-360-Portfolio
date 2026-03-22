# PRP-012: SalesTrack — Full Build (Demo + Production Ready)

## Context
- Phase 1 (Foundation) and Phase 2 (RequestFlow demo) are complete.
- This PRP covers SalesTrack end-to-end: database schema, demo data, all screens, admin settings, and cross-app stubs.
- Pattern to follow: same architecture as RequestFlow — `isDemoMode` guard on every server component, all demo state in `@/lib/demo/data.ts`, fully interactive client components.
- Source spec: `PLATFORM_PRP_1.md §6 "APP 2: SALESTRACK"`

---

## Goal
Build a fully functional SalesTrack CRM module visible at `/platform/sales-track/` including:
1. Dashboard
2. Clients (table + profile)
3. Opportunities (table + Kanban)
4. Interactions log
5. Campaigns + Segments
6. Forecast
7. Reports
8. Admin Settings (pipeline stages, close reasons, products, email templates, inactivity thresholds)

All screens must be fully functional in demo mode (no Supabase required) and production-ready (Supabase-backed) with the same guard pattern used in RequestFlow.

---

## User Roles
- `employee / sales_rep` — own clients/opportunities, log interactions
- `manager / sales_manager` — full team pipeline, forecast, assign clients
- `admin` — full access + settings configuration

---

## Database Schema Migration
**File:** `supabase/migrations/20240010000000_salestrack_schema.sql`

```sql
-- ─── SalesTrack ───────────────────────────────────────────────────────────────

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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
  lead_score INTEGER DEFAULT 0, -- 1-5
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

-- Pipeline stages (admin-configured per company)
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  system_flag TEXT NOT NULL, -- in_progress, won, lost, on_hold
  color TEXT DEFAULT '#3B82F6',
  probability_default INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE
);

-- Products (admin-managed)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  category TEXT,
  sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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
  close_reason TEXT,
  last_activity_at TIMESTAMPTZ,
  inactivity_flag TEXT, -- null, amber, red
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity products
CREATE TABLE opportunity_products (
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(14,2),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  PRIMARY KEY (opportunity_id, product_id)
);

-- Close reasons (admin-configured)
CREATE TABLE close_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- won, lost
  is_active BOOLEAN DEFAULT TRUE
);

-- Interactions / Tasks
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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
  email_to TEXT,
  email_subject TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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

-- Contact segments
CREATE TABLE contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies (enable for all tables above)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy pattern: same-company access (repeat for each table)
CREATE POLICY "company_isolation_clients" ON clients
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
-- (repeat for all tables above)
```

---

## Demo Data
**File:** `src/lib/demo/sales-data.ts` (separate file, imported into `data.ts`)

### Clients (8 total)
```ts
export const demoClients = [
  { id: "cl-001", name: "TechCorp Sp. z o.o.", type: "strategic", industry: "IT", city: "Warszawa", country: "PL", assignedTo: "u1", leadScore: 5, isActive: true },
  { id: "cl-002", name: "Retail Plus S.A.",    type: "regular",   industry: "Retail", city: "Kraków",   country: "PL", assignedTo: "u2", leadScore: 3, isActive: true },
  { id: "cl-003", name: "BuildCo Sp. z o.o.",  type: "lead",      industry: "Construction", city: "Wrocław", country: "PL", assignedTo: "u1", leadScore: 2, isActive: true },
  { id: "cl-004", name: "MedGroup S.A.",        type: "strategic", industry: "Healthcare", city: "Gdańsk", country: "PL", assignedTo: "u3", leadScore: 4, isActive: true },
  { id: "cl-005", name: "LogiFlow Sp. z o.o.",  type: "regular",   industry: "Logistics", city: "Łódź",   country: "PL", assignedTo: "u2", leadScore: 3, isActive: true },
  { id: "cl-006", name: "EduSoft S.A.",         type: "lead",      industry: "Education", city: "Poznań", country: "PL", assignedTo: "u1", leadScore: 1, isActive: true },
  { id: "cl-007", name: "FinServ Sp. z o.o.",   type: "inactive",  industry: "Finance", city: "Warszawa", country: "PL", assignedTo: "u3", leadScore: 2, isActive: false },
  { id: "cl-008", name: "AutoDealer S.A.",      type: "regular",   industry: "Automotive", city: "Katowice", country: "PL", assignedTo: "u2", leadScore: 3, isActive: true },
]
```

### Pipeline Stages (5 default stages)
```ts
export const demoPipelineStages = [
  { id: "stage-001", name: "Kwalifikacja",     order: 1, systemFlag: "in_progress", color: "#6366f1", probability: 20 },
  { id: "stage-002", name: "Propozycja",       order: 2, systemFlag: "in_progress", color: "#3b82f6", probability: 40 },
  { id: "stage-003", name: "Negocjacje",       order: 3, systemFlag: "in_progress", color: "#f59e0b", probability: 70 },
  { id: "stage-004", name: "Wygrany",          order: 4, systemFlag: "won",         color: "#10b981", probability: 100 },
  { id: "stage-005", name: "Przegrany",        order: 5, systemFlag: "lost",        color: "#ef4444", probability: 0 },
]
```

### Opportunities (10 total, varied stages)
```ts
export const demoOpportunities = [
  { id: "op-001", name: "Wdrożenie SMB 360",       clientId: "cl-001", stageId: "stage-003", ownerId: "u1", value: 48000, probability: 70, expectedClose: "2026-04-15", lastActivity: "2026-03-15", inactivityFlag: null },
  { id: "op-002", name: "Licencja roczna — Retail", clientId: "cl-002", stageId: "stage-002", ownerId: "u2", value: 12000, probability: 40, expectedClose: "2026-05-01", lastActivity: "2026-03-10", inactivityFlag: "amber" },
  { id: "op-003", name: "Moduł HR",                clientId: "cl-004", stageId: "stage-001", ownerId: "u3", value: 22000, probability: 20, expectedClose: "2026-06-30", lastActivity: "2026-02-20", inactivityFlag: "red" },
  { id: "op-004", name: "Rozszerzenie licencji",   clientId: "cl-005", stageId: "stage-002", ownerId: "u2", value: 8000,  probability: 50, expectedClose: "2026-04-30", lastActivity: "2026-03-17", inactivityFlag: null },
  { id: "op-005", name: "Pilot — EduSoft",         clientId: "cl-006", stageId: "stage-001", ownerId: "u1", value: 5000,  probability: 20, expectedClose: "2026-07-01", lastActivity: "2026-03-12", inactivityFlag: null },
  { id: "op-006", name: "Enterprise deal",         clientId: "cl-001", stageId: "stage-004", ownerId: "u1", value: 95000, probability: 100, expectedClose: "2026-03-01", lastActivity: "2026-03-01", inactivityFlag: null },
  { id: "op-007", name: "Pakiet logistyczny",      clientId: "cl-005", stageId: "stage-003", ownerId: "u2", value: 18000, probability: 65, expectedClose: "2026-05-15", lastActivity: "2026-03-14", inactivityFlag: null },
  { id: "op-008", name: "Migracja danych",         clientId: "cl-002", stageId: "stage-005", ownerId: "u2", value: 7000,  probability: 0,  expectedClose: "2026-02-28", lastActivity: "2026-02-28", inactivityFlag: null },
  { id: "op-009", name: "Support Premium",         clientId: "cl-004", stageId: "stage-002", ownerId: "u3", value: 14400, probability: 40, expectedClose: "2026-05-01", lastActivity: "2026-03-16", inactivityFlag: null },
  { id: "op-010", name: "Moduł BookIt",            clientId: "cl-008", stageId: "stage-001", ownerId: "u2", value: 9600,  probability: 20, expectedClose: "2026-08-01", lastActivity: "2026-03-18", inactivityFlag: null },
]
```

### Interactions (15 entries across types)
Mix of: call, meeting, email, note, task — linked to clients/opportunities, statuses: todo/done.

### Campaigns (3 campaigns)
One active, one draft, one completed — with audience segments linked.

### Products (6 products)
SMB 360 modules as products: Request Flow License, Sales Track License, etc., with PLN prices.

---

## Implementation Order

### Step 1 — Demo data file
Create `src/lib/demo/sales-data.ts` with all demo data above. Export from `src/lib/demo/data.ts`.

### Step 2 — Sidebar & routing
Add SalesTrack sub-navigation to `PlatformSidebar` (same pattern as RequestFlow):
```
/platform/sales-track                 → Dashboard
/platform/sales-track/clients         → Clients list
/platform/sales-track/clients/[id]    → Client profile
/platform/sales-track/opportunities   → Opportunities (table + Kanban tabs)
/platform/sales-track/interactions    → Interactions log
/platform/sales-track/campaigns       → Campaigns list
/platform/sales-track/campaigns/[id]  → Campaign detail
/platform/sales-track/forecast        → Forecast view
/platform/sales-track/reports         → Reports
/platform/settings/sales-track        → Admin settings
```

### Step 3 — Dashboard (`/platform/sales-track`)
**Stat cards (4):**
- My open deals (count + total value)
- Deals closing this month (count)
- Overdue tasks today (count)
- Pipeline value (total in-progress, formatted PLN)

**Today's tasks widget:** list of interactions with status=todo, scheduled_at=today, with done/snooze actions.

**Pipeline summary bar:** horizontal stacked bar showing value per stage (Kwalifikacja → Negocjacje).

**Inactivity alerts:** cards for opportunities with `inactivityFlag = "red"` or `"amber"` — red border for red, amber for amber.

**Recent activity feed:** last 5 interactions across all clients.

### Step 4 — Clients list (`/platform/sales-track/clients`)
**Table columns:** Name, Type badge, Industry, City, Assigned rep, Lead score (★ out of 5), Last activity, Actions.

**Features:**
- Search by name/city/industry
- Filter by type (lead/strategic/regular/inactive)
- Filter by assigned rep (manager only)
- Sort by name / lead score / created
- "Dodaj klienta" button → dialog with all fields
- Row click → navigate to `/clients/[id]`
- Export CSV button (downloads current filter result)

**Add client dialog fields:** Nazwa, Typ (select), Branża, Strona WWW, Telefon, Miasto, Kraj (select), Przypisany handlowiec (select, manager only), Lead score (1–5 star rating click).

### Step 5 — Client profile (`/platform/sales-track/clients/[id]`)
**Hero section:** Company name, type badge, city, assigned rep avatar, lead score stars, active/inactive toggle.

**Tab navigation:**
1. **Kontakty** — contacts table (primary contact highlighted); add/edit/delete contact dialog
2. **Szanse** — linked opportunities cards with stage badge, value, probability; "Dodaj szansę" button
3. **Interakcje** — chronological feed (newest first); add interaction inline; filter by type
4. **Notatki** — free-text notes with timestamp; add/edit
5. **Dokumenty** — file attachment list (demo: 2-3 placeholder files); upload button

### Step 6 — Opportunities (`/platform/sales-track/opportunities`)
**Dual view toggle** (Table / Kanban):

**Table view columns:** Name, Client, Stage badge, Value (formatted), Probability %, Owner, Expected close, Inactivity flag (flame icon), Actions.
- Filter by: stage, owner, team, inactivity flag, date range
- Sort by value / close date / last activity
- "Dodaj szansę" button

**Kanban view:**
- Columns = pipeline stages (excluding won/lost which go to separate "Archiwum" tab)
- Cards show: client name, deal name, value, probability, owner avatar, inactivity flag badge
- Cards are draggable between stages (dnd-kit) → updates stage in local state → toast
- Won/Lost columns togglable via checkbox "Pokaż zamknięte"
- Column headers show count + total value

### Step 7 — Opportunity detail (`/platform/sales-track/opportunities/[id]`)
**Hero:** Deal name, client link, stage select (inline change), probability slider, value + currency.

**Left column:**
- Products table (linked products with qty/price/discount; add/remove)
- Linked interactions feed with "Dodaj interakcję" button

**Right column:**
- Key info card: owner, team, expected close date, created date
- Inactivity warning banner if flagged
- Notes textarea
- "Zamknij szansę" section: win/lose buttons → dialog asks for close reason + date

### Step 8 — Interactions (`/platform/sales-track/interactions`)
**Table columns:** Type icon, Title, Client, Opportunity, Assigned, Scheduled, Priority badge, Status, Actions.

**Filters:** Type (call/meeting/email/note/task), Status (todo/done), Assigned rep, Date range, Client.

**Add interaction dialog fields:**
- Typ (select with icons: Telefon, Spotkanie, Email, Notatka, Zadanie)
- Tytuł
- Klient (select)
- Szansa (select, filtered by client)
- Przypisany do (select)
- Data i godzina (datetime input)
- Priorytet (low/medium/high)
- Opis (textarea)
- For email type: email_to, Temat

**Mark done:** inline toggle in row.

### Step 9 — Campaigns (`/platform/sales-track/campaigns`)
**List view:** Name, Type badge, Status badge, Owner, Date range, Budget, Actions.

**Add campaign dialog:** Nazwa, Typ, Data od–do, Budżet, Cel, Opis.

**Campaign detail** (`/campaigns/[id]`):
- Header: name, status badge, type, owner, dates, budget
- Tabs:
  1. **Odbiorcy** — linked segments; add/remove segment; show estimated count
  2. **Interakcje** — interactions linked to this campaign; stats (sent, responded)
  3. **Metryki** — simple cards: Liczba kontaktów, Odpowiedzi, Koszt/kontakt, Szanse powiązane

### Step 10 — Forecast (`/platform/sales-track/forecast`)
**Filters:** Period (month/quarter/year), Rep, Team.

**Weighted pipeline chart:** Bar chart (Recharts) — x-axis = months, bars = expected value × probability, segmented by stage color.

**Table below chart:** Per rep/deal row — Name, Client, Stage, Value, Probability, Weighted value, Expected close. Grouped by month with subtotals.

**Summary cards:** Total pipeline value, Weighted forecast, Deals closing this month, Average deal size.

### Step 11 — Reports (`/platform/sales-track/reports`)
**4 report sections:**

1. **Pipeline by stage** — horizontal bar chart (value per stage), table with count + value
2. **Win/Loss analysis** — donut chart (won vs lost ratio), top close reasons list
3. **Activity per rep** — table: rep name, calls, meetings, emails, notes, total interactions
4. **Campaign ROI** — table: campaign name, budget, linked opportunities, pipeline generated

Date range filter applies to all.

### Step 12 — Admin Settings (`/platform/settings/sales-track`)
Add nav item "Sales Track" to settings layout.

**Tab 1: Etapy pipeline**
- Sortable list of stages (drag to reorder, or up/down buttons)
- Each row: name input, color picker, system_flag select, probability input, active toggle
- Add/delete stage buttons
- Warning: cannot delete stage with linked opportunities

**Tab 2: Powody zamknięcia**
- Two sections: Won reasons + Lost reasons
- Add/edit/delete per reason
- Toggle active

**Tab 3: Progi nieaktywności**
- "Amber alert after X days" (number input, default 14)
- "Red alert after X days" (number input, default 21)
- Save button → toast

**Tab 4: Produkty**
- Table: Name, SKU, Category, Price (PLN), Active toggle, Edit/Delete
- Add product dialog: all fields above

**Tab 5: Szablony e-mail**
- List of email templates (shared/private badge)
- Add/edit template dialog: Nazwa, Temat, Treść (textarea — rich text in production)
- Mark as shared toggle

---

## Demo Mode Architecture

### `src/lib/demo/sales-data.ts`
Export all demo entities: clients, contacts, opportunities, interactions, campaigns, segments, products, pipeline stages, close reasons, email templates.

### Guard pattern (same as RequestFlow)
Every server component page:
```tsx
import { isDemoMode } from "@/lib/demo/data"

export default async function SomePage() {
  if (isDemoMode) {
    return <SomePageClient /> // "use client" component with full functionality
  }
  // production: Supabase fetches here
}
```

### Client components
Each page has a corresponding `*-client.tsx` or inline client component that:
- Initialises local state from demo data
- Handles all mutations (add/edit/delete) via state + toast
- Never calls Supabase

---

## Sidebar Navigation
Add to `src/components/shared/platform-sidebar.tsx` under SalesTrack section:
```tsx
{ title: "Dashboard",      href: "/platform/sales-track",               icon: BarChart2 },
{ title: "Klienci",        href: "/platform/sales-track/clients",        icon: Building2 },
{ title: "Szanse",         href: "/platform/sales-track/opportunities",  icon: TrendingUp },
{ title: "Interakcje",     href: "/platform/sales-track/interactions",   icon: MessageSquare },
{ title: "Kampanie",       href: "/platform/sales-track/campaigns",      icon: Megaphone },
{ title: "Prognoza",       href: "/platform/sales-track/forecast",       icon: LineChart },
{ title: "Raporty",        href: "/platform/sales-track/reports",        icon: PieChart },
```

---

## Cross-App Integration Stubs (demo)
These won't be wired in Phase 3 but the UI should show the entry points:

1. **Won deal → create project**: On opportunity marked "won", show a toast: "Szansa wygrana! Możesz utworzyć projekt w ProjectHub" with a "Utwórz projekt" link button → navigates to `/platform/project-hub` (stub).

2. **Task interactions → ProjectHub**: In interactions list, interactions of type `task` show a "Widoczne w ProjectHub" badge.

3. **Budget approval → RequestFlow**: When opportunity value > 50 000 PLN, show a "Wymaga akceptacji budżetu" banner in opportunity detail with link to create a `budget_request` in RequestFlow.

---

## Component Inventory
New components to create:
- `LeadScoreStars` — 5-star clickable rating
- `InactivityBadge` — flame icon, amber/red variants
- `OpportunityKanban` — board with dnd-kit drag between stage columns
- `PipelineBarChart` — Recharts stacked bar for forecast
- `InteractionFeed` — chronological list with type icons
- `ClientTypeSelect` — styled select with color-coded type badges
- `ProbabilitySlider` — range input 0–100% with visual fill

Reuse from RequestFlow:
- `useToast` pattern
- Dialog/form patterns (add/edit/delete)
- Table + filter patterns from My Requests
- Status badge patterns

---

## Files to Create

```
src/
├── lib/demo/sales-data.ts
├── app/(platform)/platform/sales-track/
│   ├── page.tsx                              # Dashboard
│   ├── clients/
│   │   ├── page.tsx                          # Clients list
│   │   └── [id]/page.tsx                     # Client profile
│   ├── opportunities/
│   │   ├── page.tsx                          # Table + Kanban
│   │   └── [id]/page.tsx                     # Opportunity detail
│   ├── interactions/
│   │   └── page.tsx
│   ├── campaigns/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── forecast/
│   │   └── page.tsx
│   └── reports/
│       └── page.tsx
└── app/(platform)/platform/settings/
    └── sales-track/
        └── page.tsx                          # Admin settings (tabs)
```

---

## Validation Checklist
- [ ] TypeScript: `npx tsc --noEmit` — zero errors in platform files
- [ ] All pages accessible from sidebar in demo mode without login
- [ ] Kanban drag-and-drop works on desktop
- [ ] Mobile: clients list readable; opportunity cards readable; no horizontal overflow
- [ ] Add/edit/delete flows work on all entities (local state)
- [ ] Forecast chart renders with demo data
- [ ] Admin settings: all 5 tabs functional (stage reorder, add/delete reasons, threshold save, product CRUD, email template CRUD)
- [ ] Cross-app stubs visible (won deal banner, task badge, budget approval banner)
- [ ] No "dostępne w wersji produkcyjnej" messages anywhere — everything is interactive
- [ ] Settings `/platform/settings/sales-track` accessible from settings nav
