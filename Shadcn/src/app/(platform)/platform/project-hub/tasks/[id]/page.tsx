import { isDemoMode } from "@/lib/demo/data"
import { notFound } from "next/navigation"
import { fetchTaskById, fetchTaskComments, fetchSubtasks } from "@/lib/supabase/projecthub-server"
import { TaskDetailPageClient } from "./page-client"
import type { Task } from "@/lib/supabase/projecthub-server"

export const dynamic = "force-dynamic"

// ─── Demo data ────────────────────────────────────────────────────────────────

export type TaskComment = {
  id: string
  body: string
  created_at: string
  author: { first_name: string; last_name: string } | null
}

const demoTasks: Record<string, Task & { comments: TaskComment[]; subtasks: Task[] }> = {
  "task-001": {
    id: "task-001", company_id: "demo", project_id: "proj-001", sprint_id: "sprint-001",
    milestone_id: "ms-001", parent_task_id: null,
    title: "Konfiguracja VPC i subnets",
    description: `Ustawienie Virtual Private Cloud z podziałem na strefy dostępności (us-east-1a/b/c).

**Zakres prac:**
- Konfiguracja CIDR block (10.0.0.0/16) z myślą o przyszłej rozbudowie
- 3x public subnets (ALB, NAT Gateway)
- 3x private subnets (ECS tasks, RDS)
- 3x isolated subnets (RDS replicas)
- Internet Gateway + NAT Gateways (1 per AZ)
- Route tables i security groups

**Kryteria akceptacji:**
- [ ] EC2 w private subnet może dotrzeć do internetu przez NAT
- [ ] RDS jest niedostępny z zewnątrz
- [ ] Flow Logs włączone i logi dostępne w CloudWatch`,
    status: "in_progress", priority: "high", created_by: "u1",
    due_date: "2026-03-30", estimated_hours: 8, labels: ["aws","infra"],
    created_at: "2026-03-10T08:00:00Z", updated_at: "2026-03-24T10:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [{ user: { first_name: "Anna", last_name: "Kowalska" } }],
    comments: [
      { id:"c1", body:"Wstępna konfiguracja VPC gotowa. Sprawdziłam routingi dla public subnets — działa poprawnie. Zaczynam NAT Gateway.", created_at:"2026-03-22T09:15:00Z", author:{ first_name:"Anna", last_name:"Kowalska" } },
      { id:"c2", body:"@Anna — pamiętaj żeby NAT Gateway był w każdej strefie, nie tylko w us-east-1a. Poprzedni projekt miał z tym problem przy failover.", created_at:"2026-03-22T11:30:00Z", author:{ first_name:"Piotr", last_name:"Nowak" } },
      { id:"c3", body:"Dobra uwaga! Już poprawione — 3x NAT GW (po jednym na AZ). Koszty wzrosną ~$32/mies. ale HA jest ważniejsza. Zostały Flow Logs.", created_at:"2026-03-23T14:00:00Z", author:{ first_name:"Anna", last_name:"Kowalska" } },
    ],
    subtasks: [
      { id:"task-001a", company_id:"demo", project_id:"proj-001", sprint_id:"sprint-001", milestone_id:"ms-001", parent_task_id:"task-001", title:"Public subnet routing", description:"Konfiguracja route table z 0.0.0.0/0 → IGW.", status:"done",        priority:"medium", created_by:"u1", due_date:"2026-03-26", estimated_hours:2, labels:[], created_at:"2026-03-10T09:00:00Z", updated_at:"2026-03-22T10:00:00Z", project:null, assignees:[] },
      { id:"task-001b", company_id:"demo", project_id:"proj-001", sprint_id:"sprint-001", milestone_id:"ms-001", parent_task_id:"task-001", title:"NAT Gateway setup",     description:"Provisioning NAT GW dla private subnets.",            status:"done",        priority:"medium", created_by:"u1", due_date:"2026-03-28", estimated_hours:3, labels:[], created_at:"2026-03-10T09:30:00Z", updated_at:"2026-03-24T08:00:00Z", project:null, assignees:[] },
      { id:"task-001c", company_id:"demo", project_id:"proj-001", sprint_id:"sprint-001", milestone_id:"ms-001", parent_task_id:"task-001", title:"VPC Flow Logs",          description:"Włączenie logowania ruchu do S3/CloudWatch.",         status:"in_progress", priority:"low",    created_by:"u1", due_date:"2026-03-30", estimated_hours:1, labels:[], created_at:"2026-03-10T10:00:00Z", updated_at:"2026-03-10T10:00:00Z", project:null, assignees:[] },
    ],
  },
  "task-002": {
    id: "task-002", company_id: "demo", project_id: "proj-001", sprint_id: "sprint-001",
    milestone_id: null, parent_task_id: null,
    title: "Migracja bazy danych PostgreSQL",
    description: `Eksport danych z on-premise i import do Amazon RDS Multi-AZ.

**Etapy:**
1. Backup pg_dump ze wszystkich schematów produkcyjnych
2. Provisioning RDS PostgreSQL 15 Multi-AZ (db.r6g.large)
3. Import danych + weryfikacja integralności (row counts, checksums)
4. Konfiguracja PgBouncer jako connection pooler
5. Cutover plan (maintenance window sobota 02:00-06:00)`,
    status: "todo", priority: "urgent", created_by: "u2",
    due_date: "2026-03-28", estimated_hours: 12, labels: ["database","migration"],
    created_at: "2026-03-12T09:00:00Z", updated_at: "2026-03-12T09:00:00Z",
    project: { name: "Migracja infrastruktury do AWS" },
    assignees: [
      { user: { first_name: "Piotr", last_name: "Nowak" } },
      { user: { first_name: "Tomasz", last_name: "Kowalczyk" } },
    ],
    comments: [
      { id:"c4", body:"Zrobiłem test importu na środowisku dev — zajęło 2.5h dla 80GB. Produkcja ma ~200GB, więc liczymy na 6-7h okna migracyjnego.", created_at:"2026-03-20T10:00:00Z", author:{ first_name:"Piotr", last_name:"Nowak" } },
      { id:"c5", body:"Może warto użyć AWS DMS zamiast pg_dump? Przy takiej ilości danych replikacja CDC będzie bezpieczniejsza i krótsza okno.", created_at:"2026-03-20T11:45:00Z", author:{ first_name:"Tomasz", last_name:"Kowalczyk" } },
    ],
    subtasks: [],
  },
  "task-103": {
    id: "task-103", company_id: "demo", project_id: "proj-002", sprint_id: "sprint-b02",
    milestone_id: null, parent_task_id: null,
    title: "Moduł katalog produktów",
    description: `Implementacja katalogu produktów dla portalu B2B Omega.

**Wymagania:**
- Lista produktów z filtrami (kategoria, cena, dostępność, producent)
- Wyszukiwarka full-text (Supabase pg_trgm)
- Widok siatki i lista (toggle)
- Paginacja (20 prod/stronę) + infinite scroll opcjonalnie
- Integracja z API magazynowym klienta (REST, auth Bearer)
- Cache produktów (revalidate co 15 min)`,
    status: "in_progress", priority: "high", created_by: "u3",
    due_date: "2026-03-30", estimated_hours: 20, labels: ["frontend","api"],
    created_at: "2026-03-01T09:00:00Z", updated_at: "2026-03-24T10:00:00Z",
    project: { name: "Portal B2B dla Klienta Omega" },
    assignees: [
      { user: { first_name: "Piotr", last_name: "Nowak" } },
      { user: { first_name: "Marta", last_name: "Wiśniewska" } },
    ],
    comments: [
      { id:"c6", body:"Filtry działają. Zrobiłam też widok siatki/lista z persystencją w localStorage. Zostaje integracja z API magazynowym.", created_at:"2026-03-23T15:30:00Z", author:{ first_name:"Marta", last_name:"Wiśniewska" } },
    ],
    subtasks: [],
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params

  if (isDemoMode) {
    const demo = demoTasks[id]
    if (!demo) {
      // Fallback: show first demo task
      const fallback = demoTasks["task-001"]
      return <TaskDetailPageClient task={fallback} comments={fallback.comments} subtasks={fallback.subtasks} />
    }
    return <TaskDetailPageClient task={demo} comments={demo.comments} subtasks={demo.subtasks} />
  }

  const [task, comments, subtasks] = await Promise.all([
    fetchTaskById(id),
    fetchTaskComments(id),
    fetchSubtasks(id),
  ])

  if (!task) notFound()

  return <TaskDetailPageClient task={task} comments={comments} subtasks={subtasks} />
}
