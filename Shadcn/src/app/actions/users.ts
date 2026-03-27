"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database.types"

const VALID_ROLES: UserRole[] = ["super_admin", "admin", "hr", "manager", "employee"]

async function getAdminProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase: null, profile: null, error: "Not authenticated" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { supabase: null, profile: null, error: "User profile not found" }
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    return { supabase: null, profile: null, error: "Insufficient permissions" }
  }

  return { supabase, profile, error: null }
}

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["super_admin", "admin", "hr", "manager", "employee"]),
})

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const parsed = updateUserRoleSchema.safeParse({ userId, role })

  if (!parsed.success) {
    return { data: null, error: "Invalid input" }
  }

  const { supabase, profile, error: adminError } = await getAdminProfile()

  if (adminError || !supabase || !profile) {
    return { data: null, error: adminError ?? "Authorization failed" }
  }

  if (!profile.company_id) {
    return { data: null, error: "No company associated with this user" }
  }

  // Verify target user belongs to the same company
  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", parsed.data.userId)
    .eq("company_id", profile.company_id)
    .single()

  if (targetError || !targetUser) {
    return { data: null, error: "User not found in your company" }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role: parsed.data.role as UserRole })
    .eq("id", parsed.data.userId)
    .select("id")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/users")

  return { data, error: null }
}

const toggleUserActiveSchema = z.object({
  userId: z.string().uuid(),
})

export async function toggleUserActive(
  userId: string
): Promise<{ data: { id: string; is_active: boolean } | null; error: string | null }> {
  const parsed = toggleUserActiveSchema.safeParse({ userId })

  if (!parsed.success) {
    return { data: null, error: "Invalid user ID" }
  }

  const { supabase, profile, error: adminError } = await getAdminProfile()

  if (adminError || !supabase || !profile) {
    return { data: null, error: adminError ?? "Authorization failed" }
  }

  if (!profile.company_id) {
    return { data: null, error: "No company associated with this user" }
  }

  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id, is_active, company_id")
    .eq("id", parsed.data.userId)
    .eq("company_id", profile.company_id)
    .single()

  if (targetError || !targetUser) {
    return { data: null, error: "User not found in your company" }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ is_active: !targetUser.is_active })
    .eq("id", parsed.data.userId)
    .select("id, is_active")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/users")

  return { data: data ? { id: data.id, is_active: data.is_active ?? false } : null, error: null }
}

const inviteUserSchema = z.object({
  email: z.string().email("Must be a valid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["super_admin", "admin", "hr", "manager", "employee"]),
  department_id: z.string().uuid().optional().or(z.literal("")),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>

export async function inviteUser(
  formData: unknown
): Promise<{ data: { id: string } | null; error: string | null }> {
  const parsed = inviteUserSchema.safeParse(formData)

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Validation failed"
    return { data: null, error: firstError }
  }

  const { supabase, profile, error: adminError } = await getAdminProfile()

  if (adminError || !supabase || !profile) {
    return { data: null, error: adminError ?? "Authorization failed" }
  }

  if (!profile.company_id) {
    return { data: null, error: "No company associated with this user" }
  }

  // Check if a user with this email already exists in the company
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .eq("company_id", profile.company_id)
    .maybeSingle()

  if (existing) {
    return { data: null, error: "A user with this email already exists in your company" }
  }

  // In a real app this would call supabase.auth.admin.inviteUserByEmail
  // For now we insert a placeholder profile record (auth handled externally)
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: crypto.randomUUID(),
      company_id: profile.company_id,
      email: parsed.data.email,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      role: parsed.data.role as UserRole,
      department_id: parsed.data.department_id || null,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/users")

  return { data, error: null }
}

export { VALID_ROLES }

// -------------------------------------------------------
// i18n: set user's personal locale override
// -------------------------------------------------------
const setUserLocaleSchema = z.object({
  locale: z.enum(["pl", "en", "de", "fr"]),
})

export async function setUserLocale(
  locale: string
): Promise<{ data: null; error: string | null }> {
  const parsed = setUserLocaleSchema.safeParse({ locale })
  if (!parsed.success) return { data: null, error: "Invalid locale" }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { data: null, error: "Not authenticated" }

  // Set locale cookie for next-intl (takes effect on next request)
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  cookieStore.set("locale", parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // needs to be readable client-side for some scenarios
  })

  // Also persist to DB for cross-device consistency
  const { error } = await supabase
    .from("users")
    .update({ locale_override: parsed.data.locale })
    .eq("id", user.id)

  if (error) return { data: null, error: error.message }

  revalidatePath("/platform")
  return { data: null, error: null }
}
