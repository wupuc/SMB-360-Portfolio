# PRP-010: RequestFlow Demo — Complete & Functional

## Context
PRP-009 implemented the RequestFlow demo shell. The following are still missing or non-functional:
1. **Dark / Light mode toggle** — `ThemeSwitch` component exists but is not wired into `PlatformTopNav`.
2. **New Request page** (`/platform/request-flow/new`) — shows "wkrótce dostępne" placeholder.
3. **Reports page** (`/platform/request-flow/reports`) — shows "wkrótce dostępne" placeholder.

All other RequestFlow pages (dashboard, my-requests, approvals, calendar) are already complete.

## Goal
Make every RequestFlow screen and button functional for the demo. Only RequestFlow is in scope — other modules stay as empty states.

---

## Step 1 — Dark/Light mode toggle in TopNav

**File:** `Shadcn/src/components/shared/platform-top-nav.tsx`

Add `ThemeSwitch` between the `NotificationBell` and the user avatar dropdown.

```tsx
import { ThemeSwitch } from "@/components/theme-switch"
// ...
<NotificationBell userId={userId} />
<ThemeSwitch />   {/* ← add here */}
<DropdownMenu> ... </DropdownMenu>
```

No other changes needed — `ThemeProvider` is already wired in the root layout.

---

## Step 2 — New Request page

**File:** `Shadcn/src/app/(platform)/platform/request-flow/new/page.tsx`

Build a demo-functional multi-step form:

### UI
- **Step 1 — Select type:** Grid of request type cards (Vacation, Home Office, Business Trip, Overtime, Equipment, Budget Request, Training). Clicking a card selects it and advances to step 2.
- **Step 2 — Fill details:** Fields vary by type:
  - All types: Title (text input), Notes (textarea)
  - Date-based types (vacation, home_office, business_trip, overtime): Start Date + End Date pickers
  - Equipment / Budget: Description + Estimated Amount
  - Training: Course name + Provider
- **Step 3 — Confirm:** Summary of inputs + "Submit Request" button
- Progress indicator at top (Step 1/2/3)

### Demo behaviour
- No actual submission — clicking "Submit Request" shows a success toast and redirects to `/platform/request-flow/my-requests`
- Validation: all required fields must be filled before advancing

### Request types grid
Use `requestTypeLabels` and `requestTypeColors` from `@/lib/demo/data`. Show an icon per type (Lucide icons).

---

## Step 3 — Reports page

**File:** `Shadcn/src/app/(platform)/platform/request-flow/reports/page.tsx`

Build a demo reports page with mock statistics (no charting library — pure CSS / Tailwind).

### Sections

**1. Summary cards (row of 4):**
- Total Requests this month: 12
- Approved: 8
- Pending: 3
- Rejected: 1

**2. Requests by type — horizontal bar chart (pure CSS):**
- Each row: type label + colored bar (width = % of max) + count
- Use `requestTypeColors` for bar colors
- Data: Vacation 5, Home Office 3, Business Trip 2, Equipment 1, Training 1

**3. Approval time — stat block:**
- Average approval time: 1.4 days
- Fastest: same day
- Slowest: 3 days

**4. Team leave overview — simple table:**
- 5 columns: Employee | Vacation used | Vacation remaining | Home Office used | Sick used
- Use `demoTeam` + mock balances

---

## Files to create/modify
| File | Action |
|------|--------|
| `Shadcn/src/components/shared/platform-top-nav.tsx` | Add `ThemeSwitch` |
| `Shadcn/src/app/(platform)/platform/request-flow/new/page.tsx` | Build multi-step form |
| `Shadcn/src/app/(platform)/platform/request-flow/reports/page.tsx` | Build demo reports |

---

## Validation
- [ ] TopNav shows sun/moon icon; clicking it cycles Light → Dark → System
- [ ] Dark mode applies to entire platform shell (sidebar, nav, cards, forms)
- [ ] `/platform/request-flow/new` — can select request type, fill fields, submit → toast + redirect
- [ ] Back button on new-request form works (returns to type selection)
- [ ] `/platform/request-flow/reports` — shows stat cards, bar chart, approval time, team table
- [ ] "New Request" button on RF dashboard links correctly to `/platform/request-flow/new`
- [ ] "Quick submit" buttons on RF dashboard (Vacation, Home Office, etc.) link to `/platform/request-flow/new` with type pre-selected (query param `?type=vacation`)
- [ ] `npx tsc --noEmit` — no new errors
