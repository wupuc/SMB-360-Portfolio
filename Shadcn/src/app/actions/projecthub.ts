"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSupabase() {
  return createClient() as unknown as ReturnType<typeof createClient>
}

async function getUserCompany() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, companyId: null }
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single()
  return { supabase, user, companyId: profile?.company_id ?? null }
}

function revalidateProject(projectId: string) {
  revalidatePath(`/platform/project-hub/projects/${projectId}`)
  revalidatePath("/platform/project-hub")
}

// ─── Sprint actions ────────────────────────────────────────────────────────────

const createSprintSchema = z.object({
  projectId:  z.string().uuid(),
  name:       z.string().min(1),
  startDate:  z.string(),
  endDate:    z.string(),
  goal:       z.string().optional(),
})

export async function createSprint(input: z.infer<typeof createSprintSchema>) {
  const parsed = createSprintSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: "Nieprawidłowe dane" }

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from("sprints")
    .insert({
      project_id: parsed.data.projectId,
      name:       parsed.data.name,
      start_date: parsed.data.startDate,
      end_date:   parsed.data.endDate,
      goal:       parsed.data.goal ?? null,
      status:     "planning",
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateProject(parsed.data.projectId)
  return { data, error: null }
}

export async function startSprint(sprintId: string, projectId: string) {
  const supabase = await createClient()

  // Only one active sprint per project allowed
  const { data: existing } = await (supabase as any)
    .from("sprints")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "active")
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: "Projekt ma już aktywny sprint. Zamknij go przed uruchomieniem nowego." }
  }

  const { error } = await (supabase as any)
    .from("sprints")
    .update({ status: "active" })
    .eq("id", sprintId)

  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { error: null }
}

export async function closeSprint(sprintId: string, projectId: string) {
  const supabase = await createClient()

  // Move incomplete tasks back to backlog (sprint_id = null)
  await (supabase as any)
    .from("tasks")
    .update({ sprint_id: null })
    .eq("sprint_id", sprintId)
    .not("status", "in", "(done,cancelled)")

  const { error } = await (supabase as any)
    .from("sprints")
    .update({ status: "completed" })
    .eq("id", sprintId)

  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { error: null }
}

export async function moveTaskToSprint(taskId: string, sprintId: string | null, projectId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from("tasks")
    .update({ sprint_id: sprintId })
    .eq("id", taskId)

  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { error: null }
}

// ─── Task actions ──────────────────────────────────────────────────────────────

const updateTaskSchema = z.object({
  id:          z.string().uuid(),
  status:      z.string().optional(),
  priority:    z.string().optional(),
  sprint_id:   z.string().uuid().nullable().optional(),
  due_date:    z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export async function updateTask(input: z.infer<typeof updateTaskSchema>) {
  const parsed = updateTaskSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: "Nieprawidłowe dane" }

  const supabase = await createClient()
  const { id, ...updates } = parsed.data

  // Remove undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  const { data, error } = await (supabase as any)
    .from("tasks")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

const createTaskSchema = z.object({
  projectId:   z.string().uuid(),
  companyId:   z.string().uuid(),
  title:       z.string().min(1),
  description: z.string().optional(),
  status:      z.string().default("todo"),
  priority:    z.string().default("medium"),
  sprintId:    z.string().uuid().nullable().optional(),
  dueDate:     z.string().nullable().optional(),
})

export async function createTask(input: z.infer<typeof createTaskSchema>) {
  const parsed = createTaskSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: "Nieprawidłowe dane" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any)
    .from("tasks")
    .insert({
      project_id:  parsed.data.projectId,
      company_id:  parsed.data.companyId,
      title:       parsed.data.title,
      description: parsed.data.description ?? null,
      status:      parsed.data.status,
      priority:    parsed.data.priority,
      sprint_id:   parsed.data.sprintId ?? null,
      due_date:    parsed.data.dueDate ?? null,
      created_by:  user?.id ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateProject(parsed.data.projectId)
  return { data, error: null }
}

// ─── Milestone actions ─────────────────────────────────────────────────────────

export async function toggleMilestone(milestoneId: string, isCompleted: boolean, projectId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from("milestones")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)

  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { error: null }
}

export async function createMilestone(projectId: string, name: string, dueDate: string | null) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from("milestones")
    .insert({ project_id: projectId, name, due_date: dueDate ?? null })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateProject(projectId)
  return { data, error: null }
}
