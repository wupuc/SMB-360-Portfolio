import { isDemoMode } from "@/lib/demo/data"
import { createClient } from "@/lib/supabase/server"
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
    description: "Przeniesienie całej infrastruktury on-premise do chmury AWS. Projekt obejmuje: VPC, ECS Fargate, RDS Multi-AZ, CloudWatch monitoring, WAF i pełny CI/CD pipeline.",
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
    description: "Budowa portalu zamówień B2B dla klienta Omega Sp. z o.o. — katalog produktów, koszyk, płatności Stripe, panel administracyjny i integracja z ERP klienta.",
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
  "proj-003": {
    id: "proj-003",
    name: "Wdrożenie ERP — moduł HR",
    description: "Implementacja modułu HR w systemie ERP — ewidencja czasu pracy, urlopy, oceny pracownicze.",
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

const t = (id: string, projectId: string, sprintId: string|null, milestoneId: string|null, parentId: string|null,
  title: string, desc: string, status: string, priority: string, createdBy: string,
  dueDate: string, hours: number, labels: string[], createdAt: string, updatedAt: string,
  projectName: string, assignees: {first_name:string;last_name:string}[]
): Task => ({
  id, company_id: "demo-company-001", project_id: projectId, sprint_id: sprintId,
  milestone_id: milestoneId, parent_task_id: parentId, title, description: desc,
  status, priority, created_by: createdBy, due_date: dueDate, estimated_hours: hours,
  labels, created_at: createdAt, updated_at: updatedAt,
  project: { name: projectName },
  assignees: assignees.map(u => ({ user: u })),
})

const P1 = "proj-001", P2 = "proj-002"
const AN = { first_name:"Anna",    last_name:"Kowalska"  }
const PI = { first_name:"Piotr",   last_name:"Nowak"     }
const MA = { first_name:"Marta",   last_name:"Wiśniewska"}
const TK = { first_name:"Tomasz",  last_name:"Kowalczyk" }

const demoTasks: Task[] = [
  // ── Sprint 1 (active) ─────────────────────────────────────────────────────
  t("task-001",P1,"sprint-001","ms-001",null,
    "Konfiguracja VPC i subnets",
    "Ustawienie Virtual Private Cloud z podziałem na strefy dostępności (us-east-1a/b/c). Konfiguracja public/private subnets, NAT Gateway, Internet Gateway oraz route tables. Należy zaplanować CIDR block z myślą o przyszłej rozbudowie.",
    "in_progress","high","u1","2026-03-30",8,["aws","infra"],
    "2026-03-10T08:00:00Z","2026-03-24T10:00:00Z","Migracja AWS",[AN]),

  t("task-002",P1,"sprint-001",null,null,
    "Migracja bazy danych PostgreSQL",
    "Eksport danych z on-premise i import do Amazon RDS. Obejmuje: backup pg_dump, provisioning RDS Multi-AZ, import danych, weryfikacja integralności, konfiguracja connection pooling przez PgBouncer.",
    "todo","urgent","u2","2026-03-28",12,["database","migration"],
    "2026-03-12T09:00:00Z","2026-03-12T09:00:00Z","Migracja AWS",[PI,TK]),

  t("task-003",P1,"sprint-001","ms-001",null,
    "Konfiguracja CI/CD pipeline",
    "GitHub Actions workflow: build → test → push ECR → deploy ECS. Etapy: dev, staging, production. Secrets management przez AWS Secrets Manager. Rollback strategy.",
    "review","medium","u1","2026-04-05",6,["devops","ci-cd"],
    "2026-03-14T10:00:00Z","2026-03-25T15:00:00Z","Migracja AWS",[AN]),

  t("task-005",P1,"sprint-001",null,null,
    "Testy bezpieczeństwa środowiska",
    "Penetration testing i audyt konfiguracji IAM. Sprawdzenie otwartych portów, review security groups, IAM least-privilege audit, sprawdzenie encryption at rest i in transit.",
    "done","high","u4","2026-03-15",10,["security"],
    "2026-03-01T09:00:00Z","2026-03-14T16:00:00Z","Migracja AWS",[TK]),

  t("task-006",P1,"sprint-001",null,null,
    "Dokumentacja architektury AWS",
    "Diagram architektury (draw.io), opis wszystkich komponentów, decyzje architektoniczne (ADR), runbook dla on-call.",
    "done","low","u1","2026-03-20",4,["docs"],
    "2026-03-05T08:00:00Z","2026-03-19T17:00:00Z","Migracja AWS",[AN]),

  t("task-007",P1,"sprint-001",null,null,
    "Konfiguracja AWS WAF i Shield",
    "Ochrona przed DDoS i atakami warstwy aplikacji. Reguły OWASP Top 10, geo-blocking, rate limiting.",
    "in_progress","high","u4","2026-03-29",5,["security","aws"],
    "2026-03-18T09:00:00Z","2026-03-25T11:00:00Z","Migracja AWS",[TK]),

  // Subtaski pod task-001
  t("task-001a",P1,"sprint-001","ms-001","task-001",
    "Public subnet routing","Konfiguracja route table z 0.0.0.0/0 → IGW.",
    "done","medium","u1","2026-03-26",2,[],
    "2026-03-10T09:00:00Z","2026-03-22T10:00:00Z","Migracja AWS",[AN]),
  t("task-001b",P1,"sprint-001","ms-001","task-001",
    "NAT Gateway setup","Provisioning NAT GW dla private subnets.",
    "in_progress","medium","u1","2026-03-28",3,[],
    "2026-03-10T09:30:00Z","2026-03-24T08:00:00Z","Migracja AWS",[AN]),
  t("task-001c",P1,"sprint-001","ms-001","task-001",
    "VPC Flow Logs","Włączenie logowania ruchu do S3/CloudWatch.",
    "todo","low","u1","2026-03-30",1,[],
    "2026-03-10T10:00:00Z","2026-03-10T10:00:00Z","Migracja AWS",[AN]),

  // ── Sprint 2 (planning) ───────────────────────────────────────────────────
  t("task-004",P1,"sprint-002","ms-002",null,
    "Konfiguracja monitoringu CloudWatch",
    "Alerty, dashboardy i logi dla wszystkich serwisów ECS, RDS, ALB. Integracja z PagerDuty dla on-call alertów. Dashboardy: latency, error rate, saturation.",
    "todo","medium","u1","2026-04-20",5,["monitoring","aws"],
    "2026-03-15T08:00:00Z","2026-03-15T08:00:00Z","Migracja AWS",[TK]),

  t("task-008",P1,"sprint-002","ms-002",null,
    "Migracja aplikacji backendowej",
    "Containeryzacja aplikacji Node.js, push do ECR, deployment na ECS Fargate. Health checks, auto-scaling policy, task definitions.",
    "todo","urgent","u2","2026-04-15",16,["backend","migration","aws"],
    "2026-03-20T10:00:00Z","2026-03-20T10:00:00Z","Migracja AWS",[PI,TK]),

  t("task-009",P1,"sprint-002",null,null,
    "Testy wydajnościowe (load testing)",
    "k6 load tests: 1000 concurrent users, 30 min soak test. Analiza bottlenecks, raport wydajności.",
    "todo","high","u4","2026-04-22",8,["testing","performance"],
    "2026-03-20T11:00:00Z","2026-03-20T11:00:00Z","Migracja AWS",[MA,TK]),

  t("task-010",P1,"sprint-002","ms-002",null,
    "Konfiguracja Auto Scaling",
    "Target tracking scaling policy dla ECS: CPU 70%, Memory 80%. Min/max task counts. Scale-in cooldown.",
    "todo","medium","u1","2026-04-18",4,["aws","infra"],
    "2026-03-21T08:00:00Z","2026-03-21T08:00:00Z","Migracja AWS",[AN]),

  // ── Backlog ───────────────────────────────────────────────────────────────
  t("task-011",P1,null,null,null,
    "Disaster Recovery Plan",
    "Dokumentacja i testy procedur DR. RTO < 4h, RPO < 1h. Cross-region backup dla RDS, S3 versioning.",
    "todo","high","u1","2026-05-15",10,["dr","docs"],
    "2026-03-22T08:00:00Z","2026-03-22T08:00:00Z","Migracja AWS",[AN,PI]),

  t("task-012",P1,null,null,null,
    "Szkolenie zespołu z AWS",
    "2-dniowe szkolenie z obsługi ECS, RDS, CloudWatch dla całego zespołu operacyjnego.",
    "todo","low","u1","2026-05-30",16,["training"],
    "2026-03-22T09:00:00Z","2026-03-22T09:00:00Z","Migracja AWS",[MA]),

  // ── Projekt 2: Portal B2B ─────────────────────────────────────────────────
  t("task-101",P2,"sprint-b01","ms-b01",null,
    "Projekt UI/UX — wireframes",
    "Figma wireframes dla wszystkich ekranów portalu: logowanie, dashboard, katalog, koszyk, zamówienia, faktury. Prototyp klikalny do akceptacji klienta.",
    "done","high","u3","2026-02-28",12,["design","ux"],
    "2026-02-01T09:00:00Z","2026-02-27T17:00:00Z","Portal B2B",[MA]),

  t("task-102",P2,"sprint-b01","ms-b01",null,
    "Konfiguracja Next.js + Supabase",
    "Scaffold projektu, konfiguracja auth, RLS policies, środowiska dev/staging/prod.",
    "done","high","u2","2026-02-28",8,["nextjs","supabase"],
    "2026-02-03T09:00:00Z","2026-02-26T16:00:00Z","Portal B2B",[PI]),

  t("task-103",P2,"sprint-b02",null,null,
    "Moduł katalog produktów",
    "Strona listy produktów z filtrami (kategoria, cena, dostępność), wyszukiwarka, widok siatki/lista, paginacja. Integracja z API magazynowym klienta.",
    "in_progress","high","u2","2026-03-30",20,["frontend","api"],
    "2026-03-01T09:00:00Z","2026-03-24T10:00:00Z","Portal B2B",[PI,MA]),

  t("task-104",P2,"sprint-b02",null,null,
    "Koszyk i proces zamówienia",
    "Koszyk z persystencją w bazie, checkout flow (3 kroki), walidacja zamówień, generowanie numerów zamówień, emaile potwierdzające.",
    "in_progress","urgent","u2","2026-03-28",16,["frontend","backend"],
    "2026-03-05T09:00:00Z","2026-03-24T11:00:00Z","Portal B2B",[PI]),

  t("task-105",P2,"sprint-b02","ms-b02",null,
    "Integracja bramki płatniczej Stripe",
    "Płatności kartą, PayPo, BLIK. Webhooks do obsługi statusów płatności. Faktury PDF automatyczne.",
    "todo","urgent","u2","2026-04-10",12,["payments","backend"],
    "2026-03-10T09:00:00Z","2026-03-10T09:00:00Z","Portal B2B",[PI,TK]),

  t("task-106",P2,null,null,null,
    "Panel administracyjny klienta",
    "Zarządzanie użytkownikami portalu, cenniki, rabaty grupowe, limity kredytowe, historia zamówień wszystkich użytkowników.",
    "todo","medium","u3","2026-04-25",20,["frontend","admin"],
    "2026-03-15T09:00:00Z","2026-03-15T09:00:00Z","Portal B2B",[MA,PI]),

  t("task-107",P2,null,null,null,
    "Testy E2E (Playwright)",
    "Pokrycie krytycznych ścieżek: rejestracja, logowanie, złożenie zamówienia, płatność.",
    "todo","high","u4","2026-04-30",8,["testing","e2e"],
    "2026-03-18T09:00:00Z","2026-03-18T09:00:00Z","Portal B2B",[TK,MA]),
]

const allDemoMembers: Member[] = [
  // proj-001
  { project_id:"proj-001", user_id:"u1", role:"lead",     user:{ first_name:"Anna",   last_name:"Kowalska",  role:"manager"  } },
  { project_id:"proj-001", user_id:"u2", role:"member",   user:{ first_name:"Piotr",  last_name:"Nowak",     role:"employee" } },
  { project_id:"proj-001", user_id:"u4", role:"member",   user:{ first_name:"Tomasz", last_name:"Kowalczyk", role:"employee" } },
  { project_id:"proj-001", user_id:"u3", role:"observer", user:{ first_name:"Marta",  last_name:"Wiśniewska",role:"employee" } },
  // proj-002
  { project_id:"proj-002", user_id:"u2", role:"lead",     user:{ first_name:"Piotr",  last_name:"Nowak",     role:"manager"  } },
  { project_id:"proj-002", user_id:"u3", role:"member",   user:{ first_name:"Marta",  last_name:"Wiśniewska",role:"employee" } },
  { project_id:"proj-002", user_id:"u4", role:"member",   user:{ first_name:"Tomasz", last_name:"Kowalczyk", role:"employee" } },
  { project_id:"proj-002", user_id:"u1", role:"observer", user:{ first_name:"Anna",   last_name:"Kowalska",  role:"manager"  } },
]

const allDemoSprints: Sprint[] = [
  // proj-001
  { id:"sprint-001", project_id:"proj-001", name:"Sprint 1 — Fundament", start_date:"2026-03-01", end_date:"2026-03-28", status:"active",    goal:"Zbudowanie podstawowej infrastruktury AWS i konfiguracja bezpieczeństwa.", created_at:"2026-02-25T08:00:00Z" },
  { id:"sprint-002", project_id:"proj-001", name:"Sprint 2 — Migracja danych", start_date:"2026-03-31", end_date:"2026-04-25", status:"planning", goal:"Migracja wszystkich baz danych i konfiguracja monitoringu.", created_at:"2026-02-25T08:00:00Z" },
  { id:"sprint-003", project_id:"proj-001", name:"Sprint 3 — Testy i UAT", start_date:"2026-04-28", end_date:"2026-05-23", status:"planning", goal:"Testy end-to-end i akceptacyjne przed go-live.", created_at:"2026-02-25T08:00:00Z" },
  // proj-002
  { id:"sprint-b01", project_id:"proj-002", name:"Sprint 1 — Design & Setup", start_date:"2026-02-01", end_date:"2026-02-28", status:"completed", goal:"Finalizacja UX i konfiguracja środowiska.", created_at:"2026-01-28T09:00:00Z" },
  { id:"sprint-b02", project_id:"proj-002", name:"Sprint 2 — Core Features", start_date:"2026-03-03", end_date:"2026-03-28", status:"active",    goal:"Katalog, koszyk i płatności.", created_at:"2026-01-28T09:00:00Z" },
  { id:"sprint-b03", project_id:"proj-002", name:"Sprint 3 — Admin & Tests", start_date:"2026-03-31", end_date:"2026-04-25", status:"planning",  goal:"Panel admina, testy E2E i UAT z klientem.", created_at:"2026-01-28T09:00:00Z" },
]

const allDemoMilestones: Milestone[] = [
  // proj-001
  { id:"ms-001", project_id:"proj-001", name:"Infrastruktura podstawowa gotowa", due_date:"2026-03-31", is_completed:false, completed_at:null },
  { id:"ms-002", project_id:"proj-001", name:"Migracja danych zakończona",        due_date:"2026-04-30", is_completed:false, completed_at:null },
  { id:"ms-003", project_id:"proj-001", name:"Testy bezpieczeństwa zaliczone",    due_date:"2026-03-15", is_completed:true,  completed_at:"2026-03-14T16:00:00Z" },
  { id:"ms-004", project_id:"proj-001", name:"Go-live produkcyjny",               due_date:"2026-06-15", is_completed:false, completed_at:null },
  // proj-002
  { id:"ms-b01", project_id:"proj-002", name:"Design zaakceptowany przez klienta", due_date:"2026-02-28", is_completed:true, completed_at:"2026-02-27T17:00:00Z" },
  { id:"ms-b02", project_id:"proj-002", name:"MVP (katalog + koszyk + płatności)", due_date:"2026-04-10", is_completed:false, completed_at:null },
  { id:"ms-b03", project_id:"proj-002", name:"UAT z klientem Omega",               due_date:"2026-04-25", is_completed:false, completed_at:null },
  { id:"ms-b04", project_id:"proj-002", name:"Go-live portalu",                    due_date:"2026-05-15", is_completed:false, completed_at:null },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params

  if (isDemoMode) {
    const project  = demoProjects[id] ?? demoFallbackProject
    const tasks     = demoTasks.filter(t => t.project_id === project.id)
    const sprints   = allDemoSprints.filter(s => s.project_id === project.id)
    const milestones= allDemoMilestones.filter(m => m.project_id === project.id)
    const members   = allDemoMembers.filter(m => m.project_id === project.id)
    return (
      <ProjectDetailClient
        initialProject={project}
        initialTasks={tasks}
        initialMembers={members}
        initialSprints={sprints}
        initialMilestones={milestones}
        companyId="demo-company-001"
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("users").select("company_id").eq("id", user!.id).single()

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
      companyId={profile?.company_id ?? ""}
    />
  )
}
