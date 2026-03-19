# PRP-011: RequestFlow Demo — Enhancements Round 2

## Context
This PRP implements 6 improvements requested after the PRP-010 demo review.
All changes are demo-only (mock data, no Supabase connection).
The original spec (`PLATFORM_PRP_1.md` §5) explicitly calls for every one of these features —
this PRP ensures the demo faithfully represents the final product.

---

## Change 1 — Richer request forms + file attachment

### What spec says
> "custom request module with a form designer — field types: text, textarea, date, date range,
> number, currency, dropdown, **file upload**, user picker"
> "I can upload receipts and submit actual costs after returning from a trip"

### Current state
New request form has basic date/amount/course fields but all types share the same minimal layout.
No attachment field anywhere.

### Changes to `Shadcn/src/app/(platform)/platform/request-flow/new/page.tsx`

**Per-type extra fields (Step 2):**

| Type | Extra fields |
|------|-------------|
| `vacation` | Sub-type dropdown: wypoczynkowy / okolicznościowy / na żądanie |
| `business_trip` | Destination (text), Purpose (textarea), Estimated budget (currency), Transport mode (dropdown: własny samochód / PKP / samolot / firma) |
| `home_office` | Work location (text, default "Dom") |
| `overtime` | Reason (textarea), Hours requested (number) |
| `equipment` | Item description (text), Quantity (number), Estimated unit price (currency), Justification (textarea) |
| `budget_request` | Department (dropdown from demo departments), Cost category (dropdown: marketing/IT/operations/HR/other), Justification (textarea) |
| `training_course` | Course name, Provider, Format (dropdown: online / stacjonarne / e-learning), Cost (currency), Link (text) |

**Attachment field (all types):**
- Shown below Notes on Step 2
- `<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />`
- Demo: stores `File[]` in state, shows list of selected filenames with remove button
- Step 3 summary shows count: "2 załączniki"
- No actual upload in demo — show a dimmed info message "Pliki zostaną przesłane po złożeniu wniosku"

---

## Change 2 — Admin: Request type configurator + approval paths

### What spec says
> "Settings (admin): Approval flow builder per module (steps, conditions, approver assignment)"
> "I can configure approval chains per module type (sequential steps, conditional steps)"
> "I can build a custom request module with a form designer"
> PRP-016 explicitly: "admin settings — module config, leave entitlements, approval flow builder"

### Current state
No admin config screen for RequestFlow exists. Settings pages exist but only cover company/users/departments/modules/currencies/language.

### New page: `Shadcn/src/app/(platform)/platform/settings/request-flow/page.tsx`

Two tabs: **"Typy wniosków"** and **"Ścieżki akceptacji"**

#### Tab 1 — Typy wniosków
- Table of all 7 request types: name, icon, active toggle (demo: switches state), fields count, linked approval path
- "Edit" button per row → opens a slide-over/dialog showing field list (read-only in demo, with a "Konfiguruj pola" button that shows a toast "Dostępne w wersji produkcyjnej")
- "+ Dodaj typ" button → toast "Dostępne w wersji produkcyjnej"

#### Tab 2 — Ścieżki akceptacji
- List of 3 demo approval paths:
  1. "Urlopy — standardowa" — 2 steps: Kierownik → HR (sequential)
  2. "Wyjazdy służbowe — budżet <5000" — 1 step: Kierownik
  3. "Wyjazdy służbowe — budżet ≥5000" — 2 steps: Kierownik → Dyrektor (sequential)
- Each path shows: name, steps as pills (Step 1 → Step 2), linked request types
- "Edytuj" button → toast "Dostępne w wersji produkcyjnej"
- "+ Nowa ścieżka" → toast "Dostępne w wersji produkcyjnej"

### Add link in sidebar/settings nav
Add "Request Flow" entry under Settings navigation (link `/platform/settings/request-flow`).
Only visible to users with role `manager` or `hr` (in demo: always visible since demoUser is manager).

**Add to `Shadcn/src/app/(platform)/platform/settings/layout.tsx`** — new nav item "Request Flow".

---

## Change 3 — Admin: Leave entitlements per employee

### What spec says
> "I can set leave entitlements per employee per year"
> "Settings (admin): Leave entitlements per employee/year"

### Current state
Leave balances are hardcoded in demo data. No config screen.

### New page: `Shadcn/src/app/(platform)/platform/settings/request-flow/leave-entitlements/page.tsx`

- Header: "Limity urlopowe" + year selector (2024, 2025, 2026)
- Table: Employee | Department | Urlop (input) | L4 limit (input) | Home Office (input) | Nadgodziny (input) | Akcje
- Each row editable inline — "Zapisz" button per row → shows success toast + updates local state
- "Reset do domyślnych" per row
- Footer: "Globalny limit roczny: 26 dni" — editable input + save button
- Default values pulled from `demoTeam` + mock entitlement data defined in `src/lib/demo/data.ts`

**Add `demoLeaveEntitlements` to `src/lib/demo/data.ts`:**
```ts
export const demoLeaveEntitlements = [
  { userId: "u1", vacation: 26, sick: 14, homeOffice: 24, overtime: 8 },
  { userId: "u2", vacation: 26, sick: 14, homeOffice: 20, overtime: 8 },
  // ... all 6 team members
]
```

---

## Change 4 — Filter by employee in requests view

### What spec says
> "As an admin/HR: I can see full request history and approval audit trail"
> Dashboard screen: "admin sees all stats" — implied cross-user request view

### Current state
My Requests shows only `demoRequests` (all from the logged-in user). No user picker filter.

### Changes to `Shadcn/src/app/(platform)/platform/request-flow/my-requests/page.tsx`

- Add "Pracownik" dropdown filter (only visible when `demoUser.role === 'manager'` or `'hr'`)
- Dropdown options: "Wszyscy pracownicy" + each member from `demoTeam`
- When a specific employee is selected, show a notice "Przeglądasz wnioski: {name}" and filter/label requests accordingly
- Demo: all requests are mapped to `demoUser` so selecting another employee shows 0 results with proper empty state — or alternatively add 2-3 extra demo requests assigned to other team members in `demoRequests`

**Add 3 extra requests to `demoRequests` in `src/lib/demo/data.ts`** belonging to Piotr Nowak and Marta Wiśniewska so the filter shows real data.

---

## Change 5 — Team calendar navigation (week/month switching)

### What spec says
> "built-in calendar; approved leave, business trips, home office shown per person"
> The spec implies a real navigable calendar, not a static snapshot.

### Current state
`/platform/request-flow/calendar` shows the current week only. No navigation.

### Changes to `Shadcn/src/app/(platform)/platform/request-flow/calendar/page.tsx`

- Convert `getWeekDays()` to use a `currentWeekOffset` state (0 = this week, -1 = last week, +1 = next week)
- Add navigation bar: `< Poprzedni tydzień` | `Bieżący tydzień` (disabled when offset=0) | `Następny tydzień >`
- Show week range in header: "Tydzień 17 Mar – 21 Mar 2026"
- Calendar events stay static in demo (always appear relative to the current real week using startDay/endDay offsets), OR shift the mock events to appear on the correct real dates so navigation is meaningful
- Add "Miesiąc" view toggle button (for now → toast "Widok miesięczny dostępny w wersji produkcyjnej")

**Update `demoCalendarEvents` in `src/lib/demo/data.ts`** to use absolute ISO date strings (`start_date`, `end_date`) instead of `startDay`/`endDay` offsets, so navigation shows/hides events correctly across weeks.

---

## Change 6 — Request detail page + approval chain in approvals inbox

### What spec says
> "I can track the status of all my requests with a visual timeline of approval steps"
> "I can approve or reject with a comment in two clicks"
> "I can build a custom request module — approval audit trail"
> Screen: "My requests — table with filters; click to view detail and timeline"

### Current state
- My Requests: clicking a row opens a small `<Dialog>` with basic fields. No approval chain. No comment.
- Approvals Inbox: cards with quick approve/reject only. No link to a detail page. No comment field. No approval chain.

### New page: `Shadcn/src/app/(platform)/platform/request-flow/requests/[id]/page.tsx`

Full-page request detail with:

**Left column — Request info:**
- Page header: request title + reference number + status badge
- Card: all request fields (type, dates, notes, attached files list)
- "Pobierz PDF" button → toast "Dostępne w wersji produkcyjnej"

**Right column — Approval chain:**
- "Ścieżka akceptacji" section
- Visual vertical timeline per step:
  - Step 1: [avatar] Kierownik — Anna Kowalska — ✅ Zatwierdzone — "Proszę o zakup ekonomicznego biletu" — 14 mar 2026
  - Step 2: [avatar] HR — Ewa Dąbrowska — ⏳ Oczekuje
- Each step shows: step number, role, approver name, status icon (pending/approved/rejected), comment if any, timestamp if decided
- "Dodaj komentarz" section (textarea + "Wyślij" button) — demo: appends comment to state with timestamp

**Action buttons (only in approvals context — detected via query param `?action=approve`):**
- "Zatwierdź" (green) and "Odrzuć" (red) buttons at bottom of approval chain
- Clicking shows a confirm dialog with comment textarea
- On confirm: toast + redirect back to approvals inbox

### Link from Approvals Inbox
In `approvals/page.tsx` — add "Zobacz szczegóły" link on each card → `/platform/request-flow/requests/{approval.request_id}?action=approve`

### Link from My Requests
In `my-requests/page.tsx` — replace the Dialog with a Link → `/platform/request-flow/requests/{req.id}`

### Demo data — add mock approval chains
Add `demoApprovalChains` to `src/lib/demo/data.ts`:
```ts
export interface DemoApprovalStep {
  step: number
  role: string
  approverName: string
  approverInitials: string
  status: "approved" | "rejected" | "pending" | "skipped"
  comment?: string
  decidedAt?: string
}

export const demoApprovalChains: Record<string, DemoApprovalStep[]> = {
  "req-001": [  // approved vacation
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "approved", comment: "OK, miłego wypoczynku!", decidedAt: "2024-06-21T09:15:00Z" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "approved", decidedAt: "2024-06-21T14:30:00Z" },
  ],
  "req-002": [ ... business trip - approved ],
  "req-003": [ ... pending - step 1 approved, step 2 pending ],
  "req-004": [ ... rejected ],
  // etc. for all 8 + new requests
  "appr-001": [  // pending approval for manager
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
}
```

---

## Files to create / modify

| File | Action |
|------|--------|
| `src/lib/demo/data.ts` | Add: `demoLeaveEntitlements`, extra requests for Piotr/Marta, `demoApprovalChains`, update `demoCalendarEvents` to use ISO dates |
| `src/app/(platform)/platform/request-flow/new/page.tsx` | Richer per-type fields + file attachment step |
| `src/app/(platform)/platform/settings/request-flow/page.tsx` | **NEW** — admin type configurator + approval paths (2 tabs) |
| `src/app/(platform)/platform/settings/request-flow/leave-entitlements/page.tsx` | **NEW** — leave entitlements table |
| `src/app/(platform)/platform/settings/layout.tsx` | Add "Request Flow" nav item |
| `src/app/(platform)/platform/request-flow/my-requests/page.tsx` | Add employee filter; replace Dialog with link to detail page |
| `src/app/(platform)/platform/request-flow/calendar/page.tsx` | Week navigation (prev/next/current) |
| `src/app/(platform)/platform/request-flow/requests/[id]/page.tsx` | **NEW** — full request detail + approval chain |
| `src/app/(platform)/platform/request-flow/approvals/page.tsx` | Add "Zobacz szczegóły" link → detail page |

---

## Cross-check against original spec
| User request | In spec? | Original PRP ref |
|---|---|---|
| Per-type fields + attachment | ✅ Yes — custom form_schema JSONB, file upload field type | PRP-012, PRP-016 |
| Admin: configure request types + approval paths | ✅ Yes — approval flow builder, custom module builder | PRP-016 |
| Admin: configure leave days per employee | ✅ Yes — leave entitlements per employee/year | PRP-016 |
| Filter requests by employee | ✅ Yes — admin sees full request history | PRP-013, PRP-016 |
| Calendar navigation | ✅ Implied — "built-in calendar" with real dates | PRP-014 |
| Request detail + approval chain + comment | ✅ Yes — visual timeline, comment on approve/reject | PRP-012, PRP-013 |

All 6 requests align directly with the original spec. No scope creep.

---

## Validation checklist
- [ ] New request form: business trip shows destination + purpose + budget + transport fields
- [ ] New request form: file attachment input visible on all types; selected files shown; step 3 shows count
- [ ] Settings → Request Flow tab visible in settings nav
- [ ] Request types tab: 7 rows, active toggles work, edit button shows toast
- [ ] Approval paths tab: 3 paths with step pills, edit shows toast
- [ ] Leave entitlements: table shows all 6 employees with editable inputs; save shows toast
- [ ] My Requests: employee filter dropdown visible; selecting Piotr Nowak shows his 2 requests
- [ ] Team Calendar: prev/next week buttons change the displayed week dates; today column moves
- [ ] My Requests rows link to `/platform/request-flow/requests/{id}` — no more dialog
- [ ] Request detail page: all fields shown + approval chain timeline with statuses/comments
- [ ] Request detail: "Dodaj komentarz" textarea + send button appends comment to chain
- [ ] Approvals inbox: "Zobacz szczegóły" links to detail page with ?action=approve
- [ ] Detail page with ?action=approve: approve/reject buttons shown; confirm dialog with comment; toast + redirect
- [ ] `npx tsc --noEmit` — zero new errors in platform files
