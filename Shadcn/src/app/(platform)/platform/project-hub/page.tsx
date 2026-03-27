import { isDemoMode, demoUser } from "@/lib/demo/data"
import { fetchProjects, fetchMyTasks } from "@/lib/supabase/projecthub-server"
import { createClient } from "@/lib/supabase/server"
import { ProjectHubDashboardClient } from "./page-client"
import type { Project, Task } from "@/lib/supabase/projecthub-server"

// ─── Demo data ────────────────────────────────────────────────────────────────

const demoProjects: Project[] = [
  {
    id: "proj-001",
    name: "Migracja infrastruktury do AWS",
    description: "Przeniesienie całej infrastruktury on-premise do chmury AWS.",
    status: "active",
    owner_id: "u1",
    client_id: null,
    start_date: "2026-01-15",
    end_date: "2026-06-30",
    estimated_budget: 120000,
    template_id: null,
    created_at: "2026-01-10T10:00:00Z",
    owner: { first_name: "Anna", last_name: "Kowalska" },
    client: null,
  },
  {
    id: "proj-002",
    name: "Portal B2B dla Klienta Omega",
    description: "Budowa portalu zamówień B2B dla klienta Omega Sp. z o.o.",
    status: "active",
    owner_id: "u2",
    client_id: "cl-001",
    start_date: "2026-02-01",
    end_date: "2026-05-31",
    estimated_budget: 85000,
    template_id: null,
    created_at: "2026-01-28T09:00:00Z",
    owner: { first_name: "Piotr", last_name: "Nowak" },
    client: { name: "Omega Sp. z o.o." },
  },
  {
    id: "proj-003",
    name: "Wdrożenie ERP — moduł HR",
    description: "Implementacja modułu HR w systemie ERP.",
    status: "planning",
    owner_id: "u1",
    client_id: null,
    start_date: "2026-04-01",
    end_date: "2026-09-30",
    estimated_budget: 60000,
    template_id: null,
    created_at: "2026-03-01T08:00:00Z",
    owner: { first_name: "Anna", last_name: "Kowalska" },
    client: null,
  },
  {
    id: "proj-004",
    name: "Redesign strony głównej",
    description: "Odświeżenie wizerunku strony korporacyjnej.",
    status: "completed",
    owner_id: "u3",
    client_id: null,
    start_date: "2025-10-01",
    end_date: "2025-12-31",
    estimated_budget: 25000,
    template_id: null,
    created_at: "2025-09-20T14:00:00Z",
    owner: { first_name: "Marta", last_name: "Wiśniewska" },
    client: null,
  },
]

const demoMyTasks: Task[] = [
  {
    id: "task-001",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-001",
    milestone_id: null,
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
    description: "Eksport i import danych do RDS.",
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
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectHubPage() {
  if (isDemoMode) {
    return (
      <ProjectHubDashboardClient
        initialProjects={demoProjects}
        initialMyTasks={demoMyTasks}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const [projects, myTasks] = await Promise.all([
    fetchProjects(),
    userId ? fetchMyTasks(userId) : Promise.resolve([] as Task[]),
  ])

  return (
    <ProjectHubDashboardClient
      initialProjects={projects}
      initialMyTasks={myTasks}
    />
  )
}
