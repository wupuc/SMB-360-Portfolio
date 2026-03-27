import { isDemoMode } from "@/lib/demo/data"
import {
  demoInteractions, demoClients, demoOpportunities, demoOwners, demoEmailTemplates,
} from "@/lib/demo/sales-data"
import {
  fetchInteractions, fetchClients, fetchOpportunities, fetchOwners, fetchEmailTemplates,
} from "@/lib/supabase/salestrack-server"
import { InteractionsPageClient } from "./page-client"

export default async function InteractionsPage() {
  const [interactions, clients, opportunities, owners, emailTpls] = isDemoMode
    ? [demoInteractions, demoClients, demoOpportunities, demoOwners, demoEmailTemplates]
    : await Promise.all([
        fetchInteractions(),
        fetchClients(),
        fetchOpportunities(),
        fetchOwners(),
        fetchEmailTemplates(),
      ])

  return (
    <InteractionsPageClient
      initialInteractions={interactions as any}
      initialClients={clients as any}
      initialOpportunities={opportunities as any}
      initialOwners={owners as any}
      initialEmailTpls={emailTpls as any}
    />
  )
}
