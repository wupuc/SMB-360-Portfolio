"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function getAdminContext() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase: null, companyId: null, error: "Not authenticated" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { supabase: null, companyId: null, error: "User profile not found" }
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    return { supabase: null, companyId: null, error: "Insufficient permissions" }
  }

  if (!profile.company_id) {
    return { supabase: null, companyId: null, error: "No company associated with this user" }
  }

  return { supabase, companyId: profile.company_id, error: null }
}

const upsertCurrencySchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .length(3, "Currency code must be exactly 3 characters")
    .toUpperCase(),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  exchange_rate: z
    .number({ invalid_type_error: "Exchange rate must be a number" })
    .positive("Exchange rate must be positive"),
  is_base: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export type UpsertCurrencyInput = z.infer<typeof upsertCurrencySchema>

export async function upsertCurrency(
  formData: unknown
): Promise<{ data: { id: string } | null; error: string | null }> {
  const parsed = upsertCurrencySchema.safeParse(formData)

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Validation failed"
    return { data: null, error: firstError }
  }

  const { supabase, companyId, error: adminError } = await getAdminContext()

  if (adminError || !supabase || !companyId) {
    return { data: null, error: adminError ?? "Authorization failed" }
  }

  const { id, ...rest } = parsed.data

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from("currencies")
      .update({ ...rest })
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id")
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    revalidatePath("/platform/settings/currencies")
    return { data, error: null }
  }

  // Insert new
  const { data, error } = await supabase
    .from("currencies")
    .insert({ ...rest, company_id: companyId })
    .select("id")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/platform/settings/currencies")
  return { data, error: null }
}

const setBaseCurrencySchema = z.object({
  currencyId: z.string().uuid(),
})

export async function setBaseCurrency(
  currencyId: string
): Promise<{ data: null; error: string | null }> {
  const parsed = setBaseCurrencySchema.safeParse({ currencyId })

  if (!parsed.success) {
    return { data: null, error: "Invalid currency ID" }
  }

  const { supabase, companyId, error: adminError } = await getAdminContext()

  if (adminError || !supabase || !companyId) {
    return { data: null, error: adminError ?? "Authorization failed" }
  }

  // Verify the currency belongs to this company
  const { data: currency, error: fetchError } = await supabase
    .from("currencies")
    .select("id")
    .eq("id", parsed.data.currencyId)
    .eq("company_id", companyId)
    .single()

  if (fetchError || !currency) {
    return { data: null, error: "Currency not found in your company" }
  }

  // Clear all base flags for this company
  const { error: clearError } = await supabase
    .from("currencies")
    .update({ is_base: false })
    .eq("company_id", companyId)

  if (clearError) {
    return { data: null, error: clearError.message }
  }

  // Set the new base currency
  const { error: setError } = await supabase
    .from("currencies")
    .update({ is_base: true })
    .eq("id", parsed.data.currencyId)

  if (setError) {
    return { data: null, error: setError.message }
  }

  revalidatePath("/platform/settings/currencies")
  return { data: null, error: null }
}
