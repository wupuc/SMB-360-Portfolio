"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const updateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #ff0000)"),
  email_sender_name: z.string().optional(),
  email_sender_address: z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
})

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>

export async function updateCompanySettings(
  formData: unknown
): Promise<{ data: { id: string } | null; error: string | null }> {
  const parsed = updateCompanySchema.safeParse(formData)

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Validation failed"
    return { data: null, error: firstError }
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

  const updatePayload = {
    name: parsed.data.name,
    brand_color: parsed.data.brand_color,
    email_sender_name: parsed.data.email_sender_name ?? null,
    email_sender_address: parsed.data.email_sender_address || null,
    timezone: parsed.data.timezone,
    locale: parsed.data.locale,
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updatePayload)
    .eq("id", profile.company_id)
    .select("id")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/company")
  revalidatePath("/platform", "layout")

  return { data, error: null }
}
