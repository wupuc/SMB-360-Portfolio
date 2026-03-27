import { isDemoMode, demoUser } from "@/lib/demo/data"
import { fetchMyTasks, fetchProjects } from "@/lib/supabase/projecthub-server"
import { createClient } from "@/lib/supabase/server"
import { MyTasksPageClient } from "./page-client"
import type { Task, Project } from "@/lib/supabase/projecthub-server"

// ─── Demo data ────────────────────────────────────────────────────────────────

const demoTasks: Task[] = [
  {
    id: "task-001",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-001",
    milestone_id: "ms-001",
    parent_task_id: null,
    title: "Konfiguracja VPC i subnets",
    description: "Ustawienie Virtual Private Cloud z podziałem na strefy dostępności.",
    status: "in_progress",
    priority: "high",
    created_by: "u1",
    due_date: "2026-03-28",
    estimated_hours: 8,
    labels: ["aws", "infra"],
    created_at: "2026-03-10T08:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-002",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-001",
    milestone_id: null,
    parent_task_id: null,
    title: "Migracja bazy danych PostgreSQL",
    description: "Eksport danych z on-premise i import do Amazon RDS.",
    status: "todo",
    priority: "urgent",
    created_by: "u2",
    due_date: "2026-03-25",
    estimated_hours: 12,
    labels: ["database", "migration"],
    created_at: "2026-03-12T09:00:00Z",
    updated_at: "2026-03-12T09:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-003",
    company_id: "demo-company-001",
    project_id: "proj-002",
    sprint_id: "sprint-002",
    milestone_id: null,
    parent_task_id: null,
    title: "Projekt UI dla strony zamówień",
    description: "Makiety i prototypy interaktywne dla głównego widoku zamówień.",
    status: "review",
    priority: "medium",
    created_by: "u1",
    due_date: "2026-04-05",
    estimated_hours: 6,
    labels: ["design", "ui"],
    created_at: "2026-03-15T11:00:00Z",
    updated_at: "2026-03-22T14:00:00Z",
    project: { name: "Portal B2B dla Klienta Omega" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-004",
    company_id: "demo-company-001",
    project_id: "proj-003",
    sprint_id: null,
    milestone_id: null,
    parent_task_id: null,
    title: "Analiza wymagań HR",
    description: "Zebranie wymagań funkcjonalnych od działu HR.",
    status: "todo",
    priority: "low",
    created_by: "u1",
    due_date: "2026-04-10",
    estimated_hours: 4,
    labels: ["requirements"],
    created_at: "2026-03-18T08:00:00Z",
    updated_at: "2026-03-18T08:00:00Z",
    project: { name: "Wdrożenie ERP — moduł HR" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-005",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-001",
    milestone_id: null,
    parent_task_id: null,
    title: "Testy bezpieczeństwa środowiska",
    description: "Penetration testing i audyt konfiguracji IAM.",
    status: "done",
    priority: "high",
    created_by: "u4",
    due_date: "2026-03-15",
    estimated_hours: 10,
    labels: ["security"],
    created_at: "2026-03-01T09:00:00Z",
    updated_at: "2026-03-14T16:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-006",
    company_id: "demo-company-001",
    project_id: "proj-002",
    sprint_id: "sprint-002",
    milestone_id: null,
    parent_task_id: null,
    title: "Integracja API płatności",
    description: "Podłączenie PayU do backendu portalu B2B.",
    status: "todo",
    priority: "high",
    created_by: "u1",
    due_date: "2026-04-15",
    estimated_hours: 8,
    labels: ["backend", "api"],
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    project: { name: "Portal B2B dla Klienta Omega" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
]

const demoProjects: Project[] = [
  {
    id: "proj-001",
    name: "Migracja infrastruktury do AWS",
    description: null,
    status: "active",
    owner_id: "u1",
    client_id: null,
    start_date: "2026-01-15",
    end_date: "2026-06-30",
    estimated_budget: null,
    template_id: null,
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "proj-002",
    name: "Portal B2B dla Klienta Omega",
    description: null,
    status: "active",
    owner_id: "u2",
    client_id: null,
    start_date: "2026-02-01",
    end_date: "2026-05-31",
    estimated_budget: null,
    template_id: null,
    created_at: "2026-01-28T09:00:00Z",
  },
  {
    id: "proj-003",
    name: "Wdrożenie ERP — moduł HR",
    description: null,
    status: "planning",
    owner_id: "u1",
    client_id: null,
    start_date: "2026-04-01",
    end_date: "2026-09-30",
    estimated_budget: null,
    template_id: null,
    created_at: "2026-03-01T08:00:00Z",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyTasksPage() {
  if (isDemoMode) {
    return (
      <MyTasksPageClient
        initialTasks={demoTasks}
        initialProjects={demoProjects}
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
    />
  )
}
