import { isDemoMode } from "@/lib/demo/data"
import { fetchMyTasks, fetchProjects } from "@/lib/supabase/projecthub-server"
import { createClient } from "@/lib/supabase/server"
import { MyTasksPageClient } from "./page-client"
import type { Task, Project } from "@/lib/supabase/projecthub-server"

// ─── Demo data ────────────────────────────────────────────────────────────────

function d(n: number) {
  const dt = new Date("2026-03-28"); dt.setDate(dt.getDate() + n)
  return dt.toISOString().split("T")[0]
}

function mt(
  id: string, projectId: string, title: string, status: string, priority: string,
  dueDate: string | null, hours: number | null, labels: string[], projectName: string,
  sourceApp = "projecthub"
): Task {
  return {
    id, company_id: "demo-company-001", project_id: projectId,
    sprint_id: null, milestone_id: null, parent_task_id: null,
    title, description: null, status, priority, created_by: "u1",
    due_date: dueDate, estimated_hours: hours, labels,
    created_at: "2026-03-10T08:00:00Z", updated_at: "2026-03-24T10:00:00Z",
    project: { name: projectName }, assignees: [],
    ...({ source_app: sourceApp } as any),
  } as Task
}

const demoTasks: Task[] = [
  // ── Overdue ──────────────────────────────────────────────────────────────
  mt("my-002","proj-001","Migracja bazy danych PostgreSQL",   "todo",        "urgent", d(-3), 12, ["database","migration"], "Migracja AWS"),
  mt("my-003","proj-001","Testy bezpieczeństwa środowiska",   "in_progress", "high",   d(-2), 10, ["security"],             "Migracja AWS"),

  // ── Dzisiaj ───────────────────────────────────────────────────────────────
  mt("my-001","proj-001","Konfiguracja VPC i subnets",        "in_progress", "high",   d(0),   8, ["aws","infra"],          "Migracja AWS"),
  mt("my-009","proj-002","Koszyk i proces zamówienia",         "in_progress", "urgent", d(0),  16, ["frontend","backend"],   "Portal B2B"),
  // SalesTrack → ProjectHub: auto-generated task from won deal
  mt("my-010","proj-002","Onboarding klienta Omega — demo",   "todo",        "high",   d(0),   2, ["onboarding"],           "Portal B2B", "salestrack"),
  // Helpdesk → ProjectHub: dev task from support ticket
  mt("my-011","proj-002","Bug: walidacja formularza rejestracji","todo",     "urgent", d(1),   1, ["bug"],                  "Portal B2B", "helpdesk"),

  // ── Ten tydzień ───────────────────────────────────────────────────────────
  mt("my-004","proj-002","Projekt UI dla strony zamówień",    "review",      "medium", d(3),   6, ["design","ui"],          "Portal B2B"),
  mt("my-005","proj-001","Konfiguracja AWS WAF i Shield",     "in_progress", "high",   d(4),   5, ["security","aws"],       "Migracja AWS"),
  mt("my-006","proj-002","Moduł katalog produktów",           "in_progress", "high",   d(4),  20, ["frontend","api"],       "Portal B2B"),

  // ── Później ───────────────────────────────────────────────────────────────
  mt("my-007","proj-003","Analiza wymagań HR",                "todo",        "low",    d(14),  4, ["requirements"],         "Wdrożenie ERP — moduł HR"),
  mt("my-008","proj-002","Integracja API płatności (Stripe)", "todo",        "high",   d(18),  8, ["backend","api"],        "Portal B2B"),
  mt("my-012","proj-001","Disaster Recovery Plan",            "todo",        "high",   d(48), 10, ["dr","docs"],            "Migracja AWS"),

  // ── Done ─────────────────────────────────────────────────────────────────
  mt("my-d01","proj-001","Dokumentacja architektury AWS",     "done",        "low",    d(-8),  4, ["docs"],                 "Migracja AWS"),
  mt("my-d02","proj-002","Wireframes portalu B2B",            "done",        "high",   d(-14), 12, ["design","ux"],         "Portal B2B"),
  mt("my-d03","proj-001","Konfiguracja CI/CD pipeline",       "done",        "medium", d(-4),  6, ["devops","ci-cd"],       "Migracja AWS"),
]

const demoProjects: Project[] = [
  { id:"proj-001", name:"Migracja infrastruktury do AWS", description:null, status:"active",    owner_id:"u1", client_id:null, start_date:"2026-01-15", end_date:"2026-06-30", estimated_budget:null, template_id:null, created_at:"2026-01-10T10:00:00Z" },
  { id:"proj-002", name:"Portal B2B dla Klienta Omega",   description:null, status:"active",    owner_id:"u2", client_id:null, start_date:"2026-02-01", end_date:"2026-05-31", estimated_budget:null, template_id:null, created_at:"2026-01-28T09:00:00Z" },
  { id:"proj-003", name:"Wdrożenie ERP — moduł HR",       description:null, status:"planning",  owner_id:"u1", client_id:null, start_date:"2026-04-01", end_date:"2026-09-30", estimated_budget:null, template_id:null, created_at:"2026-03-01T08:00:00Z" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyTasksPage() {
  if (isDemoMode) {
    return (
      <MyTasksPageClient
        initialTasks={demoTasks}
        initialProjects={demoProjects}
        activeModules={["projecthub", "salestrack", "helpdesk"]}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const [tasks, projects] = await Promise.all([
    userId ? fetchMyTasks(userId) : Promise.resolve([] as Task[]),
    fetchProjects(),
  ])

  return (
    <MyTasksPageClient
      initialTasks={tasks}
      initialProjects={projects}
      activeModules={["projecthub"]}
    />
  )
}
