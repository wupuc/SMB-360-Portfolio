import { createClient } from "@/lib/supabase/server"
import { isDemoMode } from "@/lib/demo/data"
import { ProjectHubSettingsClient } from "./page-client"

export type TemplateTask = {
  id: string
  title: string
  priority: string
  role_assignment: string | null
  days_from_start: number
  order_index: number
}

export type ProjectTemplate = {
  id: string
  name: string
  description: string | null
  is_built_in: boolean
  trigger_app: string | null
  trigger_event: string | null
  tasks: TemplateTask[]
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const demoTemplates: ProjectTemplate[] = [
  {
    id: "demo-t1",
    name: "New Client Onboarding",
    description: "Triggered when a SalesTrack opportunity is won",
    is_built_in: true,
    trigger_app: "sales_track",
    trigger_event: "opportunity_won",
    tasks: [
      { id: "dt-1-1", title: "Send welcome email",       priority: "high",   role_assignment: "sales",   days_from_start: 0,  order_index: 1 },
      { id: "dt-1-2", title: "Schedule kick-off call",   priority: "high",   role_assignment: "sales",   days_from_start: 1,  order_index: 2 },
      { id: "dt-1-3", title: "Create client workspace",  priority: "medium", role_assignment: "ops",     days_from_start: 2,  order_index: 3 },
      { id: "dt-1-4", title: "Technical discovery call", priority: "high",   role_assignment: "tech",    days_from_start: 5,  order_index: 4 },
      { id: "dt-1-5", title: "Deliver proposal",         priority: "high",   role_assignment: "manager", days_from_start: 10, order_index: 5 },
      { id: "dt-1-6", title: "Contract signing",         priority: "urgent", role_assignment: "legal",   days_from_start: 14, order_index: 6 },
      { id: "dt-1-7", title: "30-day review",            priority: "low",    role_assignment: "manager", days_from_start: 30, order_index: 7 },
    ],
  },
  {
    id: "demo-t2",
    name: "Software Launch",
    description: "Sprints, milestones, and go-live checklist",
    is_built_in: true,
    trigger_app: null,
    trigger_event: null,
    tasks: [
      { id: "dt-2-1", title: "Define scope & requirements", priority: "high",   role_assignment: "manager", days_from_start: 0,  order_index: 1 },
      { id: "dt-2-2", title: "Design sprint",               priority: "high",   role_assignment: "design",  days_from_start: 5,  order_index: 2 },
      { id: "dt-2-3", title: "Development sprint 1",        priority: "high",   role_assignment: "dev",     days_from_start: 15, order_index: 3 },
      { id: "dt-2-4", title: "QA & bug fixes",              priority: "high",   role_assignment: "qa",      days_from_start: 45, order_index: 4 },
      { id: "dt-2-5", title: "UAT with stakeholders",       priority: "urgent", role_assignment: "manager", days_from_start: 52, order_index: 5 },
      { id: "dt-2-6", title: "Go-live deployment",          priority: "urgent", role_assignment: "dev",     days_from_start: 58, order_index: 6 },
    ],
  },
  {
    id: "demo-t3",
    name: "Employee Onboarding",
    description: "Triggered when a new hire is created",
    is_built_in: true,
    trigger_app: "people_hub",
    trigger_event: "new_hire",
    tasks: [
      { id: "dt-3-1", title: "Prepare workstation",      priority: "high",   role_assignment: "it", days_from_start: -3, order_index: 1 },
      { id: "dt-3-2", title: "Create accounts & access", priority: "high",   role_assignment: "it", days_from_start: -1, order_index: 2 },
      { id: "dt-3-3", title: "First day orientation",    priority: "high",   role_assignment: "hr", days_from_start: 0,  order_index: 3 },
      { id: "dt-3-4", title: "30-day check-in",          priority: "medium", role_assignment: "hr", days_from_start: 30, order_index: 4 },
    ],
  },
  {
    id: "demo-t4",
    name: "Mój szablon",
    description: "Szablon stworzony przez firmę",
    is_built_in: false,
    trigger_app: null,
    trigger_event: null,
    tasks: [
      { id: "dt-4-1", title: "Planowanie projektu", priority: "high",   role_assignment: "manager", days_from_start: 0, order_index: 1 },
      { id: "dt-4-2", title: "Kick-off meeting",    priority: "medium", role_assignment: null,      days_from_start: 1, order_index: 2 },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectHubSettingsPage() {
  if (isDemoMode) {
    return <ProjectHubSettingsClient initialTemplates={demoTemplates} />
  }

  const supabase = await createClient()

  const { data: templates } = await (supabase as any)
    .from("project_templates")
    .select("*, tasks:project_template_tasks(*)")
    .order("is_built_in", { ascending: false })
    .order("name", { ascending: true })

  const mapped: ProjectTemplate[] = (templates ?? []).map((t: any) => ({
    id:            t.id,
    name:          t.name,
    description:   t.description,
    is_built_in:   t.is_built_in,
    trigger_app:   t.trigger_app,
    trigger_event: t.trigger_event,
    tasks:         (t.tasks ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  return <ProjectHubSettingsClient initialTemplates={mapped} />
}
