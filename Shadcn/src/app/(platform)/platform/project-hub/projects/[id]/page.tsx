import { isDemoMode } from "@/lib/demo/data"
import {
  fetchProjectById,
  fetchProjectTasks,
  fetchProjectMembers,
  fetchSprints,
  fetchMilestones,
} from "@/lib/supabase/projecthub-server"
import { ProjectDetailClient } from "./page-client"
import type { Project, Task, Member, Sprint, Milestone } from "@/lib/supabase/projecthub-server"

export const dynamic = "force-dynamic"

// ─── Demo data ────────────────────────────────────────────────────────────────

const demoProjects: Record<string, Project> = {
  "proj-001": {
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
  "proj-002": {
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
}

const demoFallbackProject: Project = {
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
}

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
    assignees: [
      { user: { first_name: "Piotr", last_name: "Nowak" } },
      { user: { first_name: "Tomasz", last_name: "Kowalczyk" } },
    ],
  },
  {
    id: "task-003",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-001",
    milestone_id: "ms-001",
    parent_task_id: null,
    title: "Konfiguracja CI/CD pipeline",
    description: "Ustawienie GitHub Actions z deploymentem na ECS.",
    status: "review",
    priority: "medium",
    created_by: "u1",
    due_date: "2026-04-05",
    estimated_hours: 6,
    labels: ["devops", "ci-cd"],
    created_at: "2026-03-14T10:00:00Z",
    updated_at: "2026-03-23T15:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
  },
  {
    id: "task-004",
    company_id: "demo-company-001",
    project_id: "proj-001",
    sprint_id: "sprint-002",
    milestone_id: "ms-002",
    parent_task_id: null,
    title: "Konfiguracja monitoringu CloudWatch",
    description: "Alerty, dashboardy i logi dla wszystkich serwisów.",
    status: "todo",
    priority: "medium",
    created_by: "u1",
    due_date: "2026-04-20",
    estimated_hours: 5,
    labels: ["monitoring", "aws"],
    created_at: "2026-03-15T08:00:00Z",
    updated_at: "2026-03-15T08:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Tomasz", last_name: "Kowalczyk" } }],
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
    assignees: [{ user: { first_name: "Tomasz", last_name: "Kowalczyk" } }],
  },
]

const demoMembers: Member[] = [
  {
    project_id: "proj-001",
    user_id: "u1",
    role: "lead",
    user: { first_name: "Anna", last_name: "Kowalska", role: "manager" },
  },
  {
    project_id: "proj-001",
    user_id: "u2",
    role: "member",
    user: { first_name: "Piotr", last_name: "Nowak", role: "employee" },
  },
  {
    project_id: "proj-001",
    user_id: "u4",
    role: "member",
    user: { first_name: "Tomasz", last_name: "Kowalczyk", role: "employee" },
  },
  {
    project_id: "proj-001",
    user_id: "u6",
    role: "observer",
    user: { first_name: "Jan", last_name: "Zieliński", role: "employee" },
  },
]

const demoSprints: Sprint[] = [
  {
    id: "sprint-001",
    project_id: "proj-001",
    name: "Sprint 1 — Fundament",
    start_date: "2026-03-01",
    end_date: "2026-03-28",
    status: "active",
    goal: "Zbudowanie podstawowej infrastruktury AWS i konfiguracja bezpieczeństwa.",
    created_at: "2026-02-25T08:00:00Z",
  },
  {
    id: "sprint-002",
    project_id: "proj-001",
    name: "Sprint 2 — Migracja danych",
    start_date: "2026-03-31",
    end_date: "2026-04-25",
    status: "planning",
    goal: "Migracja wszystkich baz danych i konfiguracja monitoringu.",
    created_at: "2026-02-25T08:00:00Z",
  },
  {
    id: "sprint-003",
    project_id: "proj-001",
    name: "Sprint 3 — Testy i UAT",
    start_date: "2026-04-28",
    end_date: "2026-05-23",
    status: "planning",
    goal: "Testy end-to-end i akceptacyjne przed go-live.",
    created_at: "2026-02-25T08:00:00Z",
  },
]

const demoMilestones: Milestone[] = [
  {
    id: "ms-001",
    project_id: "proj-001",
    name: "Infrastruktura podstawowa gotowa",
    due_date: "2026-03-31",
    is_completed: false,
    completed_at: null,
  },
  {
    id: "ms-002",
    project_id: "proj-001",
    name: "Migracja danych zakończona",
    due_date: "2026-04-30",
    is_completed: false,
    completed_at: null,
  },
  {
    id: "ms-003",
    project_id: "proj-001",
    name: "Testy bezpieczeństwa zaliczone",
    due_date: "2026-03-15",
    is_completed: true,
    completed_at: "2026-03-14T16:00:00Z",
  },
  {
    id: "ms-004",
    project_id: "proj-001",
    name: "Go-live produkcyjny",
    due_date: "2026-06-15",
    is_completed: false,
    completed_at: null,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params

  if (isDemoMode) {
    const project = demoProjects[id] ?? demoFallbackProject
    return (
      <ProjectDetailClient
        initialProject={project}
        initialTasks={demoTasks}
        initialMembers={demoMembers}
        initialSprints={demoSprints}
        initialMilestones={demoMilestones}
      />
    )
  }

  const [project, tasks, members, sprints, milestones] = await Promise.all([
    fetchProjectById(id),
    fetchProjectTasks(id),
    fetchProjectMembers(id),
    fetchSprints(id),
    fetchMilestones(id),
  ])

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Projekt nie został znaleziony.</p>
      </div>
    )
  }

  return (
    <ProjectDetailClient
      initialProject={project}
      initialTasks={tasks}
      initialMembers={members}
      initialSprints={sprints}
      initialMilestones={milestones}
    />
  )
}
