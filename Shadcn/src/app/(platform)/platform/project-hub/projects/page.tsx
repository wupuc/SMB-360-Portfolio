import { isDemoMode } from "@/lib/demo/data"
import { fetchProjects } from "@/lib/supabase/projecthub-server"
import { ProjectsPageClient } from "./page-client"
import type { Project } from "@/lib/supabase/projecthub-server"

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
  {
    id: "proj-005",
    name: "Integracja z systemem płatności",
    description: "Podłączenie bramki płatniczej PayU do portalu B2B.",
    status: "on_hold",
    owner_id: "u4",
    client_id: "cl-001",
    start_date: "2026-03-01",
    end_date: "2026-04-30",
    estimated_budget: 18000,
    template_id: null,
    created_at: "2026-02-20T10:00:00Z",
    owner: { first_name: "Tomasz", last_name: "Kowalczyk" },
    client: { name: "Omega Sp. z o.o." },
  },
  {
    id: "proj-006",
    name: "Kampania e-mail Q2",
    description: "Automatyzacja kampanii e-mail na Q2 2026.",
    status: "cancelled",
    owner_id: "u3",
    client_id: null,
    start_date: "2026-03-15",
    end_date: "2026-04-15",
    estimated_budget: 5000,
    template_id: null,
    created_at: "2026-03-05T12:00:00Z",
    owner: { first_name: "Marta", last_name: "Wiśniewska" },
    client: null,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const projects = isDemoMode ? demoProjects : await fetchProjects()

  return <ProjectsPageClient initialProjects={projects} />
}
