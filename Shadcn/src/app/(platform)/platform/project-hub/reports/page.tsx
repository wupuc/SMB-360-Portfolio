import { isDemoMode } from "@/lib/demo/data"
import { createClient } from "@/lib/supabase/server"
import { ReportsPageClient } from "./page-client"
import type { ReportData } from "./page-client"

// ─── Demo data ────────────────────────────────────────────────────────────────

const demoData: ReportData = {
  // KPI summary
  totalProjects:     12,
  activeProjects:    5,
  completedProjects: 4,
  totalTasks:        148,
  doneTasks:         93,
  overdueTasks:      11,
  teamMembers:       8,

  // Task status distribution
  tasksByStatus: [
    { status: "todo",        label: "Do zrobienia", count: 28, color: "#94a3b8" },
    { status: "in_progress", label: "W toku",       count: 19, color: "#3b82f6" },
    { status: "review",      label: "Przegląd",     count:  8, color: "#f59e0b" },
    { status: "done",        label: "Gotowe",        count: 93, color: "#22c55e" },
  ],

  // Task priority distribution
  tasksByPriority: [
    { priority: "urgent", label: "Pilne",   count: 9,  color: "#ef4444" },
    { priority: "high",   label: "Wysoki",  count: 34, color: "#f97316" },
    { priority: "medium", label: "Średni",  count: 72, color: "#3b82f6" },
    { priority: "low",    label: "Niski",   count: 33, color: "#94a3b8" },
  ],

  // Velocity per sprint (last 6)
  sprintVelocity: [
    { sprint: "Sprint 1", planned: 24, completed: 18 },
    { sprint: "Sprint 2", planned: 30, completed: 28 },
    { sprint: "Sprint 3", planned: 28, completed: 25 },
    { sprint: "Sprint 4", planned: 32, completed: 30 },
    { sprint: "Sprint 5", planned: 35, completed: 27 },
    { sprint: "Sprint 6", planned: 38, completed: 35 },
  ],

  // Tasks completed per week (last 8 weeks)
  weeklyThroughput: [
    { week: "Tydz. 1",  completed: 8  },
    { week: "Tydz. 2",  completed: 12 },
    { week: "Tydz. 3",  completed: 7  },
    { week: "Tydz. 4",  completed: 15 },
    { week: "Tydz. 5",  completed: 11 },
    { week: "Tydz. 6",  completed: 18 },
    { week: "Tydz. 7",  completed: 14 },
    { week: "Tydz. 8",  completed: 16 },
  ],

  // Per-project summary
  projects: [
    { id: "p1", name: "Migracja AWS",         status: "active",    totalTasks: 32, doneTasks: 24, overdueTasks: 2, members: 4 },
    { id: "p2", name: "Portal B2B",            status: "active",    totalTasks: 28, doneTasks: 18, overdueTasks: 3, members: 5 },
    { id: "p3", name: "TechCorp Integration",  status: "active",    totalTasks: 20, doneTasks: 14, overdueTasks: 1, members: 3 },
    { id: "p4", name: "Migracja CRM",          status: "active",    totalTasks: 18, doneTasks:  9, overdueTasks: 4, members: 3 },
    { id: "p5", name: "Retail Plus",           status: "active",    totalTasks: 15, doneTasks: 12, overdueTasks: 1, members: 2 },
    { id: "p6", name: "Mobile App v2",         status: "completed", totalTasks: 35, doneTasks: 35, overdueTasks: 0, members: 4 },
  ],

  // Workload distribution (tasks per person)
  memberWorkload: [
    { name: "Anna K.",   activeTasks: 7,  doneTasks: 22 },
    { name: "Piotr N.",  activeTasks: 9,  doneTasks: 18 },
    { name: "Marta W.",  activeTasks: 6,  doneTasks: 25 },
    { name: "Tomasz K.", activeTasks: 5,  doneTasks: 14 },
    { name: "Karol M.",  activeTasks: 8,  doneTasks: 19 },
    { name: "Agata S.",  activeTasks: 4,  doneTasks: 21 },
  ],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectHubReportsPage() {
  if (isDemoMode) {
    return <ReportsPageClient data={demoData} />
  }

  // Production: aggregate from Supabase
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <ReportsPageClient data={demoData} />

  const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.id).single()
  const companyId = profile?.company_id
  if (!companyId) return <ReportsPageClient data={demoData} />

  const [projectsRes, tasksRes, sprintsRes] = await Promise.all([
    supabase.from("projects").select("id, name, status").eq("company_id", companyId),
    supabase.from("tasks").select("id, status, priority, due_date, sprint_id, project_id").eq("company_id", companyId).is("parent_task_id", null),
    supabase.from("sprints").select("id, name, project_id, status").eq("project_id", companyId),
  ])

  const allProjects = projectsRes.data ?? []
  const allTasks    = tasksRes.data    ?? []
  const today = new Date().toISOString().split("T")[0]

  const totalProjects     = allProjects.length
  const activeProjects    = allProjects.filter((p: any) => p.status === "active").length
  const completedProjects = allProjects.filter((p: any) => p.status === "completed").length
  const totalTasks        = allTasks.length
  const doneTasks         = allTasks.filter((t: any) => t.status === "done").length
  const overdueTasks      = allTasks.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled").length

  const statusCounts: Record<string, number> = {}
  const priorityCounts: Record<string, number> = {}
  allTasks.forEach((t: any) => {
    statusCounts[t.status]     = (statusCounts[t.status]     ?? 0) + 1
    priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1
  })

  const tasksByStatus = [
    { status: "todo",        label: "Do zrobienia", count: statusCounts["todo"]        ?? 0, color: "#94a3b8" },
    { status: "in_progress", label: "W toku",       count: statusCounts["in_progress"] ?? 0, color: "#3b82f6" },
    { status: "review",      label: "Przegląd",     count: statusCounts["review"]      ?? 0, color: "#f59e0b" },
    { status: "done",        label: "Gotowe",        count: statusCounts["done"]        ?? 0, color: "#22c55e" },
  ]

  const tasksByPriority = [
    { priority: "urgent", label: "Pilne",  count: priorityCounts["urgent"] ?? 0, color: "#ef4444" },
    { priority: "high",   label: "Wysoki", count: priorityCounts["high"]   ?? 0, color: "#f97316" },
    { priority: "medium", label: "Średni", count: priorityCounts["medium"] ?? 0, color: "#3b82f6" },
    { priority: "low",    label: "Niski",  count: priorityCounts["low"]    ?? 0, color: "#94a3b8" },
  ]

  const projects = allProjects.map((p: any) => {
    const pTasks = allTasks.filter((t: any) => t.project_id === p.id)
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      totalTasks:   pTasks.length,
      doneTasks:    pTasks.filter((t: any) => t.status === "done").length,
      overdueTasks: pTasks.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled").length,
      members: 0,
    }
  })

  const data: ReportData = {
    totalProjects, activeProjects, completedProjects,
    totalTasks, doneTasks, overdueTasks,
    teamMembers: 0,
    tasksByStatus, tasksByPriority,
    sprintVelocity: demoData.sprintVelocity,
    weeklyThroughput: demoData.weeklyThroughput,
    projects,
    memberWorkload: demoData.memberWorkload,
  }

  return <ReportsPageClient data={data} />
}
