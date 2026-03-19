import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LanguageForm } from "./language-form"
import { isDemoMode } from "@/lib/demo/data"

export default async function LanguageSettingsPage() {
  if (isDemoMode) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Język i region</h2>
          <p className="text-muted-foreground text-sm">
            Wybierz preferowany język. To ustawienie nadpisuje domyślny język firmy.
          </p>
        </div>
        <LanguageForm currentLocale="pl" companyLocale="pl" />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("locale_override, company_id")
    .eq("id", user.id)
    .single()

  const { data: company } = profile?.company_id
    ? await supabase
        .from("companies")
        .select("locale")
        .eq("id", profile.company_id)
        .single()
    : { data: null }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Language & Region</h2>
        <p className="text-muted-foreground text-sm">
          Choose your preferred language. This setting overrides the company default.
        </p>
      </div>
      <LanguageForm
        currentLocale={profile?.locale_override ?? company?.locale ?? "pl"}
        companyLocale={company?.locale ?? "pl"}
      />
    </div>
  )
}
