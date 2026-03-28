/**
 * ProjectHub — Server-side Supabase query functions (use in Server Components only)
 */
import { createClient as createTypedClient } from "@/lib/supabase/server"

// Untyped helper — ProjectHub tables may not be in database.types.ts yet
async function createClient() {
  return (await createTypedClient()) as any
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Project = {
  id: string
  name: string
  description: string | null
  status: string
  owner_id: string | null
  client_id: string | null
  start_date: string | null
  end_date: string | null
  estimated_budget: number | null
  template_id: string | null
  created_at: string
  owner?: { first_name: string; last_name: string } | null
  client?: { name: string } | null
}

export type Task = {
  id: string
  company_id: string
  project_id: string | null
  sprint_id: string | null
  milestone_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  status: string
  priority: string
  created_by: string | null
  due_date: string | null
  estimated_hours: number | null
  labels: string[]
  created_at: string
  updated_at: string
  project?: { name: string } | null
  assignees?: { user: { first_name: string; last_name: string } }[]
}

export type Sprint = {
  id: string
  project_id: string
  name: string
  start_date: string
  end_date: string
  status: string
  goal: string | null
  created_at: string
}

export type Milestone = {
  id: string
  project_id: string
  name: string
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
}

export type Member = {
  project_id: string
  user_id: string
  role: string
  user?: { first_name: string; last_name: string; role: string }
}

export type Owner = { id: string; name: string }

// ─── Query functions ──────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("*, owner:users(first_name,last_name), client:clients(name)")
    .order("created_at", { ascending: false })
  return (data ?? []) as Project[]
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("*, owner:users(first_name,last_name), client:clients(name)")
    .eq("id", id)
    .single()
  return data ?? null
}

export async function fetchMyTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("task_assignees")
    .select(
      "task:tasks(*, project:projects(name), assignees:task_assignees(user:users(first_name,last_name)))"
    )
    .eq("user_id", userId)
  const tasks = (data ?? [])
    .map((row: any) => row.task)
    .filter(Boolean)
  return tasks as Task[]
}

export async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select(
      "*, project:projects(name), assignees:task_assignees(user:users(first_name,last_name))"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
  return (data ?? []) as Task[]
}

export async function fetchProjectMembers(projectId: string): Promise<Member[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("project_members")
    .select("*, user:users(first_name,last_name,role)")
    .eq("project_id", projectId)
  return (data ?? []) as Member[]
}

export async function fetchSprints(projectId: string): Promise<Sprint[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("sprints")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true })
  return (data ?? []) as Sprint[]
}

export async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })
  return (data ?? []) as Milestone[]
}

export async function fetchTaskById(taskId: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*, project:projects(name), assignees:task_assignees(user:users(id,first_name,last_name))")
    .eq("id", taskId)
    .single()
  return (data ?? null) as Task | null
}

export async function fetchTaskComments(taskId: string): Promise<{ id: string; body: string; created_at: string; author: { first_name: string; last_name: string } | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("task_comments")
    .select("id, body, created_at, author:users(first_name,last_name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })
  return (data ?? []) as any[]
}

export async function fetchSubtasks(parentTaskId: string): Promise<Task[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*, assignees:task_assignees(user:users(first_name,last_name))")
    .eq("parent_task_id", parentTaskId)
    .order("created_at", { ascending: true })
  return (data ?? []) as Task[]
}

// ─── Workload types ───────────────────────────────────────────────────────────

export type WorkloadUser = {
  id: string
  first_name: string
  last_name: string
  role: string
}

export type WorkloadTask = {
  id: string
  title: string
  priority: string
  status: string
  due_date: string
  estimated_hours: number | null
  project_name: string | null
  user_id: string
}

export async function fetchWorkloadData(): Promise<{ users: WorkloadUser[]; tasks: WorkloadTask[] }> {
  const supabase = await createClient()

  const [usersRes, tasksRes] = await Promise.all([
    supabase.from("users").select("id, first_name, last_name, role").order("first_name"),
    supabase
      .from("task_assignees")
      .select("user_id, task:tasks(id, title, priority, status, due_date, estimated_hours, project:projects(name))")
      .not("task.due_date", "is", null)
      .not("task.status", "in", "(done,cancelled)"),
  ])

  const users: WorkloadUser[] = (usersRes.data ?? []) as WorkloadUser[]

  const tasks: WorkloadTask[] = (tasksRes.data ?? [])
    .map((row: any) => {
      const t = row.task
      if (!t || !t.due_date) return null
      return {
        id:             t.id,
        title:          t.title,
        priority:       t.priority,
        status:         t.status,
        due_date:       t.due_date,
        estimated_hours: t.estimated_hours ?? null,
        project_name:   t.project?.name ?? null,
        user_id:        row.user_id,
      } as WorkloadTask
    })
    .filter(Boolean) as WorkloadTask[]

  return { users, tasks }
}

export async function fetchOwners(): Promise<Owner[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .order("first_name")
  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim(),
  }))
}
