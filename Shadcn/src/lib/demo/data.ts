import type { ModuleKey, UserRole } from "@/types/database.types"

// ─── Demo User ───────────────────────────────────────────────────────────────

export const demoUser = {
  id: "u1",
  email: "anna.kowalska@acmecorp.pl",
  first_name: "Anna",
  last_name: "Kowalska",
  role: "manager" as UserRole,
  company_id: "demo-company-001",
  department_id: "dept-engineering",
  manager_id: null,
  avatar_url: null,
  is_active: true,
  locale_override: "pl" as const,
  created_at: "2024-01-15T09:00:00Z",
  updated_at: "2024-01-15T09:00:00Z",
}

// ─── Demo Company ─────────────────────────────────────────────────────────────

export const demoCompany = {
  id: "demo-company-001",
  name: "Acme Corp",
  logo_url: null,
  login_background_url: null,
  brand_color: "#3B82F6",
  email_sender_name: "Acme Corp",
  email_sender_address: "noreply@acmecorp.pl",
  timezone: "Europe/Warsaw",
  locale: "pl",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Enabled Modules ──────────────────────────────────────────────────────────

export const demoEnabledModules: ModuleKey[] = [
  "request_flow",
  "sales_track",
  "project_hub",
  "people_hub",
  "book_it",
  "helpdesk",
]

// ─── Team Members ─────────────────────────────────────────────────────────────

export const demoTeam = [
  { id: "u1", name: "Anna Kowalska",    initials: "AK", role: "manager",  department: "Engineering" },
  { id: "u2", name: "Piotr Nowak",      initials: "PN", role: "employee", department: "Engineering" },
  { id: "u3", name: "Marta Wiśniewska", initials: "MW", role: "employee", department: "Sales" },
  { id: "u4", name: "Tomasz Kowalczyk", initials: "TK", role: "employee", department: "Engineering" },
  { id: "u5", name: "Ewa Dąbrowska",    initials: "ED", role: "hr",       department: "HR" },
  { id: "u6", name: "Jan Zieliński",    initials: "JZ", role: "employee", department: "Sales" },
]

// ─── Request Types ────────────────────────────────────────────────────────────

export type DemoRequestType =
  | "vacation"
  | "business_trip"
  | "home_office"
  | "equipment"
  | "overtime"
  | "budget_request"
  | "training_course"

export const requestTypeLabels: Record<DemoRequestType, string> = {
  vacation:       "Urlop",
  business_trip:  "Wyjazd służbowy",
  home_office:    "Home Office",
  equipment:      "Wniosek o sprzęt",
  overtime:       "Nadgodziny",
  budget_request: "Wniosek budżetowy",
  training_course:"Kurs szkoleniowy",
}

export const requestTypeColors: Record<DemoRequestType, string> = {
  vacation:       "bg-green-100 text-green-800",
  business_trip:  "bg-blue-100 text-blue-800",
  home_office:    "bg-purple-100 text-purple-800",
  equipment:      "bg-orange-100 text-orange-800",
  overtime:       "bg-red-100 text-red-800",
  budget_request: "bg-yellow-100 text-yellow-800",
  training_course:"bg-cyan-100 text-cyan-800",
}

// ─── My Requests ──────────────────────────────────────────────────────────────

export interface DemoRequest {
  id: string
  userId: string          // owner — "u1" = Anna (demoUser), others = team members
  reference_number: string
  type: DemoRequestType
  title: string
  status: "draft" | "pending" | "approved" | "rejected" | "in_progress" | "completed"
  start_date: string
  end_date: string
  submitted_at: string
  notes?: string
}

export const demoRequests: DemoRequest[] = [
  // ── Anna Kowalska (u1 / demoUser) ──────────────────────────────────────────
  {
    id: "req-001", userId: "u1",
    reference_number: "REQ-2024-0042",
    type: "vacation",
    title: "Urlop wypoczynkowy — Lipiec",
    status: "approved",
    start_date: "2024-07-15", end_date: "2024-07-26",
    submitted_at: "2024-06-20T10:30:00Z",
    notes: "Wakacje z rodziną",
  },
  {
    id: "req-002", userId: "u1",
    reference_number: "REQ-2024-0048",
    type: "business_trip",
    title: "Konferencja IT — Warszawa",
    status: "approved",
    start_date: "2024-09-12", end_date: "2024-09-13",
    submitted_at: "2024-08-28T14:00:00Z",
    notes: "Udział w konferencji Tech Summit",
  },
  {
    id: "req-003", userId: "u1",
    reference_number: "REQ-2024-0051",
    type: "home_office",
    title: "Home Office — Październik tydzień 1",
    status: "approved",
    start_date: "2024-10-07", end_date: "2024-10-11",
    submitted_at: "2024-10-01T08:00:00Z",
  },
  {
    id: "req-004", userId: "u1",
    reference_number: "REQ-2024-0055",
    type: "equipment",
    title: 'MacBook Pro 14" — stanowisko programistyczne',
    status: "pending",
    start_date: "2024-10-15", end_date: "2024-10-15",
    submitted_at: "2024-10-10T11:20:00Z",
    notes: "Aktualny laptop ma uszkodzoną klawiaturę",
  },
  {
    id: "req-005", userId: "u1",
    reference_number: "REQ-2024-0057",
    type: "training_course",
    title: "Kurs AWS Solutions Architect",
    status: "pending",
    start_date: "2024-11-04", end_date: "2024-11-08",
    submitted_at: "2024-10-14T09:00:00Z",
  },
  {
    id: "req-006", userId: "u1",
    reference_number: "REQ-2024-0033",
    type: "vacation",
    title: "Urlop okolicznościowy",
    status: "rejected",
    start_date: "2024-05-10", end_date: "2024-05-10",
    submitted_at: "2024-05-08T16:00:00Z",
    notes: "Odrzucono — zbyt krótki czas zgłoszenia",
  },
  {
    id: "req-007", userId: "u1",
    reference_number: "REQ-2024-0060",
    type: "overtime",
    title: "Nadgodziny — sprint finalizacja Q4",
    status: "draft",
    start_date: "2024-10-28", end_date: "2024-10-28",
    submitted_at: "2024-10-21T17:30:00Z",
  },
  {
    id: "req-008", userId: "u1",
    reference_number: "REQ-2024-0061",
    type: "budget_request",
    title: "Licencja IntelliJ Ultimate — 5 stanowisk",
    status: "in_progress",
    start_date: "2024-11-01", end_date: "2024-11-01",
    submitted_at: "2024-10-18T10:00:00Z",
  },
  // ── Piotr Nowak (u2) ───────────────────────────────────────────────────────
  {
    id: "req-009", userId: "u2",
    reference_number: "REQ-2024-0055",
    type: "equipment",
    title: 'MacBook Pro 14" — stanowisko programistyczne',
    status: "pending",
    start_date: "2024-10-15", end_date: "2024-10-15",
    submitted_at: "2024-10-10T11:20:00Z",
    notes: "Aktualny laptop ma uszkodzoną klawiaturę. Pilna wymiana.",
  },
  {
    id: "req-010", userId: "u2",
    reference_number: "REQ-2024-0063",
    type: "vacation",
    title: "Urlop wypoczynkowy — Listopad",
    status: "approved",
    start_date: "2024-11-18", end_date: "2024-11-22",
    submitted_at: "2024-11-01T08:00:00Z",
  },
  // ── Marta Wiśniewska (u3) ─────────────────────────────────────────────────
  {
    id: "req-011", userId: "u3",
    reference_number: "REQ-2024-0057",
    type: "training_course",
    title: "Kurs AWS Solutions Architect",
    status: "pending",
    start_date: "2024-11-04", end_date: "2024-11-08",
    submitted_at: "2024-10-14T09:00:00Z",
  },
  {
    id: "req-012", userId: "u3",
    reference_number: "REQ-2024-0062",
    type: "vacation",
    title: "Urlop — Boże Narodzenie",
    status: "pending",
    start_date: "2024-12-23", end_date: "2024-12-31",
    submitted_at: "2024-10-20T14:00:00Z",
  },
]

// ─── Pending Approvals (for manager inbox) ───────────────────────────────────

export interface DemoApproval {
  id: string
  request_id: string      // links to demoRequests[].id and detail page
  reference_number: string
  type: DemoRequestType
  title: string
  employee: { id: string; name: string; initials: string; department: string }
  start_date: string
  end_date: string
  submitted_at: string
  notes?: string
  urgency: "normal" | "urgent"
}

export const demoPendingApprovals: DemoApproval[] = [
  {
    id: "appr-001",
    request_id: "req-009",
    reference_number: "REQ-2024-0055",
    type: "equipment",
    title: 'MacBook Pro 14" — stanowisko programistyczne',
    employee: { id: "u2", name: "Piotr Nowak", initials: "PN", department: "Engineering" },
    start_date: "2024-10-15", end_date: "2024-10-15",
    submitted_at: "2024-10-10T11:20:00Z",
    notes: "Aktualny laptop ma uszkodzoną klawiaturę. Pilna wymiana.",
    urgency: "urgent",
  },
  {
    id: "appr-002",
    request_id: "req-011",
    reference_number: "REQ-2024-0057",
    type: "training_course",
    title: "Kurs AWS Solutions Architect",
    employee: { id: "u4", name: "Tomasz Kowalczyk", initials: "TK", department: "Engineering" },
    start_date: "2024-11-04", end_date: "2024-11-08",
    submitted_at: "2024-10-14T09:00:00Z",
    urgency: "normal",
  },
  {
    id: "appr-003",
    request_id: "req-012",
    reference_number: "REQ-2024-0062",
    type: "vacation",
    title: "Urlop — Boże Narodzenie",
    employee: { id: "u6", name: "Jan Zieliński", initials: "JZ", department: "Sales" },
    start_date: "2024-12-23", end_date: "2024-12-31",
    submitted_at: "2024-10-20T14:00:00Z",
    urgency: "normal",
  },
]

// ─── Leave Balances ───────────────────────────────────────────────────────────

export const demoLeaveBalances = [
  { type: "vacation",   label: "Urlop wypoczynkowy",    used: 14, total: 26, color: "bg-green-500" },
  { type: "sick",       label: "Urlop chorobowy",       used: 3,  total: 14, color: "bg-red-400" },
  { type: "home_office",label: "Home Office",           used: 12, total: 24, color: "bg-purple-500" },
  { type: "overtime",   label: "Nadgodziny do odbioru", used: 0,  total: 8,  color: "bg-orange-400" },
]

// ─── Leave Entitlements (admin config) ────────────────────────────────────────

export interface DemoLeaveEntitlement {
  userId: string
  vacation: number
  sick: number
  homeOffice: number
  overtime: number
}

export const demoLeaveEntitlements: DemoLeaveEntitlement[] = [
  { userId: "u1", vacation: 26, sick: 14, homeOffice: 24, overtime: 8 },
  { userId: "u2", vacation: 26, sick: 14, homeOffice: 20, overtime: 8 },
  { userId: "u3", vacation: 26, sick: 14, homeOffice: 20, overtime: 8 },
  { userId: "u4", vacation: 20, sick: 14, homeOffice: 20, overtime: 8 },
  { userId: "u5", vacation: 26, sick: 14, homeOffice: 24, overtime: 8 },
  { userId: "u6", vacation: 26, sick: 14, homeOffice: 16, overtime: 4 },
]

// ─── Team Calendar ────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  userId: string
  type: "vacation" | "business_trip" | "home_office" | "sick"
  startDate: string   // ISO YYYY-MM-DD
  endDate: string     // ISO YYYY-MM-DD
  label: string
}

// Events spread across 3 weeks centred on 2026-03-16 (Mon of current week)
export const demoCalendarEvents: CalendarEvent[] = [
  // Current week: Mar 16–20 2026
  { id: "ev-01", userId: "u2", type: "vacation",      startDate: "2026-03-16", endDate: "2026-03-20", label: "Urlop" },
  { id: "ev-02", userId: "u3", type: "business_trip", startDate: "2026-03-18", endDate: "2026-03-19", label: "Wyjazd Kraków" },
  { id: "ev-03", userId: "u4", type: "home_office",   startDate: "2026-03-16", endDate: "2026-03-18", label: "Home Office" },
  { id: "ev-04", userId: "u6", type: "sick",          startDate: "2026-03-17", endDate: "2026-03-17", label: "Zwolnienie L4" },
  { id: "ev-05", userId: "u5", type: "vacation",      startDate: "2026-03-19", endDate: "2026-03-20", label: "Urlop" },
  // Next week: Mar 23–27 2026
  { id: "ev-06", userId: "u3", type: "business_trip", startDate: "2026-03-23", endDate: "2026-03-24", label: "Wyjazd Gdańsk" },
  { id: "ev-07", userId: "u1", type: "home_office",   startDate: "2026-03-25", endDate: "2026-03-26", label: "Home Office" },
  { id: "ev-08", userId: "u4", type: "vacation",      startDate: "2026-03-23", endDate: "2026-03-27", label: "Urlop" },
  // Previous week: Mar 9–13 2026
  { id: "ev-09", userId: "u2", type: "vacation",      startDate: "2026-03-09", endDate: "2026-03-13", label: "Urlop" },
  { id: "ev-10", userId: "u6", type: "home_office",   startDate: "2026-03-10", endDate: "2026-03-12", label: "Home Office" },
]

// ─── Approval Chains (per request) ───────────────────────────────────────────

export interface DemoApprovalStep {
  step: number
  role: string
  approverName: string
  approverInitials: string
  status: "approved" | "rejected" | "pending" | "returned" | "delegated"
  comment?: string
  decidedAt?: string
  delegatedTo?: string  // name of person it was delegated to
}

export const demoApprovalChains: Record<string, DemoApprovalStep[]> = {
  // req-001 vacation — fully approved (2 steps)
  "req-001": [
    { step: 1, role: "Kierownik", approverName: "Karol Malinowski", approverInitials: "KM",
      status: "approved", comment: "OK, miłego wypoczynku!", decidedAt: "2024-06-21T09:15:00Z" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "approved", decidedAt: "2024-06-21T14:30:00Z" },
  ],
  // req-002 business trip — fully approved (1 step)
  "req-002": [
    { step: 1, role: "Kierownik", approverName: "Karol Malinowski", approverInitials: "KM",
      status: "approved", comment: "Proszę o zakup ekonomicznego biletu.", decidedAt: "2024-08-29T10:00:00Z" },
  ],
  // req-003 home office — fully approved (1 step)
  "req-003": [
    { step: 1, role: "Kierownik", approverName: "Karol Malinowski", approverInitials: "KM",
      status: "approved", decidedAt: "2024-10-01T12:00:00Z" },
  ],
  // req-004 equipment — pending (2 steps, step 1 pending)
  "req-004": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "IT / Zakupy", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
  // req-005 training — pending (2 steps, step 1 pending)
  "req-005": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
  // req-006 vacation — rejected at step 1
  "req-006": [
    { step: 1, role: "Kierownik", approverName: "Karol Malinowski", approverInitials: "KM",
      status: "rejected", comment: "Zbyt krótki czas zgłoszenia — min. 3 dni wcześniej.", decidedAt: "2024-05-08T18:00:00Z" },
  ],
  // req-007 overtime — draft (no steps started)
  "req-007": [],
  // req-008 budget — in progress (step 1 approved, step 2 returned, step 1 re-pending)
  "req-008": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "approved", comment: "Potrzebne — zatwierdzam.", decidedAt: "2024-10-19T09:00:00Z" },
    { step: 2, role: "Dyrektor", approverName: "Karol Malinowski", approverInitials: "KM",
      status: "returned", comment: "Proszę o uzupełnienie o kosztorys porównawczy.", decidedAt: "2024-10-20T11:30:00Z" },
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
  ],
  // req-009 Piotr equipment — pending (Anna is approver)
  "req-009": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "IT / Zakupy", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
  // req-010 Piotr vacation — approved
  "req-010": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "approved", decidedAt: "2024-11-02T10:00:00Z" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "approved", decidedAt: "2024-11-02T15:00:00Z" },
  ],
  // req-011 Marta training — pending
  "req-011": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
  // req-012 Jan vacation — pending
  "req-012": [
    { step: 1, role: "Kierownik", approverName: "Anna Kowalska", approverInitials: "AK",
      status: "pending" },
    { step: 2, role: "HR", approverName: "Ewa Dąbrowska", approverInitials: "ED",
      status: "pending" },
  ],
}

// ─── Admin: Approval Paths ────────────────────────────────────────────────────

export interface DemoApprovalPath {
  id: string
  name: string
  steps: { order: number; role: string; type: "sequential" | "parallel" }[]
  linkedTypes: DemoRequestType[]
  isActive: boolean
}

export const demoApprovalPaths: DemoApprovalPath[] = [
  {
    id: "path-001",
    name: "Urlopy — standardowa",
    steps: [
      { order: 1, role: "Kierownik bezpośredni", type: "sequential" },
      { order: 2, role: "HR",                    type: "sequential" },
    ],
    linkedTypes: ["vacation"],
    isActive: true,
  },
  {
    id: "path-002",
    name: "Wyjazdy służbowe (budżet < 5 000 PLN)",
    steps: [
      { order: 1, role: "Kierownik bezpośredni", type: "sequential" },
    ],
    linkedTypes: ["business_trip", "home_office"],
    isActive: true,
  },
  {
    id: "path-003",
    name: "Wyjazdy / Zakupy (budżet ≥ 5 000 PLN)",
    steps: [
      { order: 1, role: "Kierownik bezpośredni", type: "sequential" },
      { order: 2, role: "Dyrektor",              type: "sequential" },
    ],
    linkedTypes: ["equipment", "budget_request"],
    isActive: true,
  },
  {
    id: "path-004",
    name: "Szkolenia i kursy",
    steps: [
      { order: 1, role: "Kierownik bezpośredni", type: "sequential" },
      { order: 2, role: "HR",                    type: "sequential" },
    ],
    linkedTypes: ["training_course", "overtime"],
    isActive: true,
  },
]

// ─── Notifications ────────────────────────────────────────────────────────────

export const demoNotifications = [
  {
    id: "notif-001",
    title: "Nowy wniosek do zatwierdzenia",
    body: 'Piotr Nowak złożył wniosek o sprzęt: MacBook Pro 14"',
    type: "approval_needed",
    source_app: "request_flow",
    source_url: "/platform/request-flow/approvals",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "notif-002",
    title: "Wniosek zatwierdzony",
    body: "Twój wniosek REQ-2024-0051 (Home Office) został zatwierdzony",
    type: "request_update",
    source_app: "request_flow",
    source_url: "/platform/request-flow/my-requests",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "notif-003",
    title: "Nowe zadanie przypisane",
    body: "Zostałaś przypisana do zadania: Migracja bazy danych v2",
    type: "task_assigned",
    source_app: "project_hub",
    source_url: "/platform/project-hub/my-tasks",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "notif-004",
    title: "Rezerwacja potwierdzona",
    body: "Sala konferencyjna A — jutro 10:00–12:00",
    type: "booking_confirmed",
    source_app: "book_it",
    source_url: "/platform/book-it/my-bookings",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "notif-005",
    title: "Przypomnienie: wniosek oczekuje",
    body: "Tomasz Kowalczyk czeka na zatwierdzenie od 48h",
    type: "approval_needed",
    source_app: "request_flow",
    source_url: "/platform/request-flow/approvals",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export const demoDashboardStats = {
  pendingRequests: 2,
  pendingApprovals: 3,
  tasksDueToday: 4,
  upcomingBookings: 1,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
