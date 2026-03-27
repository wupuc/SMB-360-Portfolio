import { isDemoMode } from "@/lib/demo/data"
import { demoClients, demoOwners } from "@/lib/demo/sales-data"
import { fetchClients, fetchOwners } from "@/lib/supabase/salestrack-server"
import { ClientsPageClient } from "./page-client"

export default async function ClientsPage() {
  const [clients, owners] = isDemoMode
    ? [demoClients, demoOwners]
    : await Promise.all([fetchClients(), fetchOwners()])

  return (
    <ClientsPageClient
      initialClients={clients as any}
      initialOwners={owners as any}
    />
  )
}
