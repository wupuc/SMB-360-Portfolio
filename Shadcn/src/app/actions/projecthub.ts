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
  id:          z.string(),
  projectId:   z.string().optional(),
  title:       z.string().optional(),
  status:      z.string().optional(),
  priority:    z.string().optional(),
  sprint_id:   z.string().nullable().optional(),
  due_date:    z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export async function updateTask(input: z.infer<typeof updateTaskSchema>) {
  const parsed = updateTaskSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: "Nieprawidłowe dane" }

  const supabase = await createClient()
  const { id, projectId, ...updates } = parsed.data

  // Remove undefined values and non-DB fields
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

// ─── Comment actions ───────────────────────────────────────────────────────────

export async function addComment(taskId: string, body: string, projectId: string) {
  if (!body.trim()) return { data: null, error: "Komentarz nie może być pusty" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Nie zalogowano" }

  const { data, error } = await (supabase as any)
    .from("task_comments")
    .insert({ task_id: taskId, author_id: user.id, body: body.trim() })
    .select("*, author:users(first_name, last_name)")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Subtask actions ───────────────────────────────────────────────────────────

export async function createSubtask(
  parentTaskId: string,
  title: string,
  projectId: string,
  companyId: string,
) {
  if (!title.trim()) return { data: null, error: "Tytuł nie może być pusty" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any)
    .from("tasks")
    .insert({
      parent_task_id: parentTaskId,
      project_id:     projectId,
      company_id:     companyId,
      title:          title.trim(),
      status:         "todo",
      priority:       "medium",
      created_by:     user?.id ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateProject(projectId)
  return { data, error: null }
}

// ─── Template actions ──────────────────────────────────────────────────────────

const TemplateTaskSchema = z.object({
  title:           z.string().min(1),
  priority:        z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  role_assignment: z.string().optional(),
  days_from_start: z.number().int().default(0),
  order_index:     z.number().int(),
})

const CreateTemplateSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  tasks:       z.array(TemplateTaskSchema).optional(),
})

export async function createTemplate(input: z.infer<typeof CreateTemplateSchema>) {
  const { supabase, companyId } = await getUserCompany()
  if (!companyId) return { data: null, error: "Brak firmy" }

  const parsed = CreateTemplateSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.message }

  const { name, description, tasks = [] } = parsed.data

  const { data: template, error: tplError } = await (supabase as any)
    .from("project_templates")
    .insert({ company_id: companyId, name, description: description ?? null })
    .select()
    .single()

  if (tplError) return { data: null, error: tplError.message }

  if (tasks.length > 0) {
    const rows = tasks.map(t => ({ ...t, template_id: template.id }))
    await (supabase as any).from("project_template_tasks").insert(rows)
  }

  revalidatePath("/platform/settings/project-hub")
  return { data: template, error: null }
}

export async function deleteTemplate(templateId: string) {
  const { supabase, companyId } = await getUserCompany()
  if (!companyId) return { error: "Brak firmy" }

  const { error } = await (supabase as any)
    .from("project_templates")
    .delete()
    .eq("id", templateId)
    .eq("company_id", companyId)

  if (error) return { error: error.message }
  revalidatePath("/platform/settings/project-hub")
  return { error: null }
}

export async function updateTemplate(templateId: string, name: string, description: string) {
  const { supabase, companyId } = await getUserCompany()
  if (!companyId) return { error: "Brak firmy" }

  const { error } = await (supabase as any)
    .from("project_templates")
    .update({ name, description })
    .eq("id", templateId)
    .eq("company_id", companyId)

  if (error) return { error: error.message }
  revalidatePath("/platform/settings/project-hub")
  return { error: null }
}

export async function addTemplateTask(
  templateId: string,
  input: { title: string; priority?: string; role_assignment?: string; days_from_start?: number },
) {
  const { supabase, companyId } = await getUserCompany()
  if (!companyId) return { error: "Brak firmy" }

  const { data: existing } = await (supabase as any)
    .from("project_template_tasks")
    .select("order_index")
    .eq("template_id", templateId)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1

  const { error } = await (supabase as any)
    .from("project_template_tasks")
    .insert({
      template_id:     templateId,
      title:           input.title,
      priority:        input.priority ?? "medium",
      role_assignment: input.role_assignment ?? null,
      days_from_start: input.days_from_start ?? 0,
      order_index:     nextOrder,
    })

  if (error) return { error: error.message }
  revalidatePath("/platform/settings/project-hub")
  return { error: null }
}

export async function deleteTemplateTask(taskId: string) {
  const { supabase } = await getUserCompany()
  const { error } = await (supabase as any)
    .from("project_template_tasks")
    .delete()
    .eq("id", taskId)

  if (error) return { error: error.message }
  revalidatePath("/platform/settings/project-hub")
  return { error: null }
}
