# PRP-009: Demo Preview — Localhost with Mock Data

## Context
- Phase 1 is complete: platform shell, auth, admin settings, shared components, i18n.
- All module pages are placeholder "coming soon" text.
- Supabase is not yet connected — `.env.local` has empty values.
- Goal: get the full app running on `localhost:3000` with demo data so the UI can be reviewed.

## Goal
Make the app fully runnable on localhost without a Supabase connection. Add a "Demo Mode" that:
1. Bypasses auth (skip Supabase session check, use a hardcoded demo user)
2. Provides mock data for all module pages
3. Builds real, complete UI for the platform dashboard + RequestFlow (the most important app)
4. Login page gets a prominent "Try Demo" button

**What looks real:** Platform shell, dashboard stats, RequestFlow dashboard, My Requests table, Approvals inbox, Team Calendar
**What stays placeholder:** SalesTrack, ProjectHub, PeopleHub, BookIt, Helpdesk (shown with good empty states, not "coming soon")

## Implementation steps

### 1. Demo mode env flag
`Shadcn/.env.local` — add:
```
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo-key
```
(Non-empty URL/key prevents runtime crashes from missing env vars; actual calls are short-circuited.)

### 2. Demo data fixtures (`src/lib/demo/`)
Create `src/lib/demo/data.ts` with:
- `demoUser` — manager role, name "Anna Kowalska", department Engineering
- `demoCompany` — "Acme Corp", brand_color "#3B82F6"
- `demoEnabledModules` — all 6 enabled
- `demoRequests` — 8 requests of various types and statuses
- `demoPendingApprovals` — 3 items for manager inbox
- `demoLeaveBalances` — annual (18/26 days), sick (5/10 days), home office (8/20 days)
- `demoTeamCalendar` — 5 team members with current week absences/trips
- `demoNotifications` — 5 unread notifications

### 3. Demo middleware bypass
`src/middleware.ts` — when `NEXT_PUBLIC_DEMO_MODE=true`:
- Skip all Supabase session checks
- Allow all `/platform/*` routes through without redirect
- Allow `/login` to show (for the "Try Demo" button)

### 4. Demo platform layout
`src/app/(platform)/layout.tsx` — when demo mode:
- Skip `supabase.auth.getUser()` call
- Use `demoUser` and `demoCompany` directly
- Pass `demoEnabledModules` to sidebar

### 5. Login page enhancement
`src/app/(auth)/login/page.tsx` — add "Try Demo" button that links to `/platform/dashboard`
In demo mode show a banner: "Demo Mode — no account required"

### 6. Platform Dashboard (`/platform/dashboard`)
Build a real dashboard with:
- Welcome card: "Good morning, Anna" + date
- 4 stat cards: Pending Requests, Pending Approvals, Tasks Due Today, Upcoming Bookings
- "My pending requests" mini-table (last 3)
- "Quick actions" buttons: New Request, View Approvals, My Tasks, Book a Desk
- Module grid shortcuts (6 apps)

### 7. RequestFlow Dashboard (`/platform/request-flow`)
Build role-aware dashboard:
- Leave balance cards (Annual, Sick, Home Office) with progress bars
- "Pending Approvals" section with 3 approval cards (approve/reject buttons — demo only)
- "My recent requests" list with status badges
- Quick submit buttons for common request types

### 8. RequestFlow: My Requests (`/platform/request-flow/my-requests`)
Full DataTable with mock data:
- Columns: Reference, Type (badge), Title, Status (StatusBadge), Start Date, End Date, Submitted
- Search by title
- Filter by status
- Click row → opens a slide-over/dialog with request detail

### 9. RequestFlow: Approvals Inbox (`/platform/request-flow/approvals`)
Manager inbox:
- Cards per pending approval (not a table — more visual)
- Each card: employee name + avatar, request type, dates, title, "Approve" + "Reject" buttons
- Demo: clicking Approve/Reject shows a success toast and removes the card

### 10. RequestFlow: Team Calendar (`/platform/request-flow/calendar`)
Visual week/month calendar:
- Shows team members as rows
- Approved leave, trips, home office shown as colored blocks
- Current week highlighted
- Simple grid layout (no complex library needed — pure CSS grid)

### 11. Other module dashboards — proper empty states
Replace "coming soon" placeholders with proper empty states for:
- SalesTrack, ProjectHub, PeopleHub, BookIt, Helpdesk
- Each gets: app icon, "Module coming soon", description of what it'll do, a "Learn more" disabled button

## Files to create/modify
- `Shadcn/.env.local` — add demo flags
- `Shadcn/src/lib/demo/data.ts` — all mock data
- `Shadcn/src/middleware.ts` — demo bypass
- `Shadcn/src/app/(platform)/layout.tsx` — demo user inject
- `Shadcn/src/app/(auth)/login/page.tsx` — Try Demo button
- `Shadcn/src/app/(platform)/dashboard/page.tsx` — real dashboard
- `Shadcn/src/app/(platform)/request-flow/page.tsx` — RF dashboard
- `Shadcn/src/app/(platform)/request-flow/my-requests/page.tsx` — data table
- `Shadcn/src/app/(platform)/request-flow/approvals/page.tsx` — approvals inbox
- `Shadcn/src/app/(platform)/request-flow/calendar/page.tsx` — team calendar
- All other module pages — proper empty states

## Validation
- [ ] `npm run dev` starts without errors
- [ ] Visit `localhost:3000` → shows login page with "Try Demo" button
- [ ] Click "Try Demo" → lands on `/platform/dashboard` with real content
- [ ] Sidebar shows all 6 module icons; module switcher works
- [ ] Notification bell shows 5 unread (badge visible)
- [ ] Navigate to RequestFlow → see dashboard with leave balances
- [ ] My Requests → table with 8 rows, search works
- [ ] Approvals Inbox → 3 cards; clicking Approve shows toast
- [ ] Team Calendar → shows team members with absences
- [ ] Navigating to SalesTrack/ProjectHub etc → proper empty state (not crash)
- [ ] `npx tsc --noEmit` — no errors in platform code
