"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ModuleKey } from "@/types/database.types"

const MODULE_KEYS: ModuleKey[] = [
  "request_flow",
  "sales_track",
  "project_hub",
  "people_hub",
  "book_it",
  "helpdesk",
]

const toggleModuleSchema = z.object({
  moduleKey: z.enum([
    "request_flow",
    "sales_track",
    "project_hub",
    "people_hub",
    "book_it",
    "helpdesk",
  ]),
  enabled: z.boolean(),
})

export async function toggleModule(
  moduleKey: string,
  enabled: boolean
): Promise<{ data: { module: string; is_enabled: boolean } | null; error: string | null }> {
  const parsed = toggleModuleSchema.safeParse({ moduleKey, enabled })

  if (!parsed.success) {
    return { data: null, error: "Invalid module key" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { data: null, error: "User profile not found" }
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    return { data: null, error: "Insufficient permissions" }
  }

  if (!profile.company_id) {
    return { data: null, error: "No company associated with this user" }
  }

  const { data, error } = await supabase
    .from("module_config")
    .upsert(
      {
        company_id: profile.company_id,
        module: parsed.data.moduleKey as ModuleKey,
        is_enabled: parsed.data.enabled,
        config: {},
      },
      { onConflict: "company_id,module" }
    )
    .select("module, is_enabled")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/modules")
  revalidatePath("/platform", "layout")

  return { data: data ? { module: data.module, is_enabled: data.is_enabled ?? false } : null, error: null }
}

export { MODULE_KEYS }
