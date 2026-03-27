import { isDemoMode } from "@/lib/demo/data"
import { demoOpportunities, demoPipelineStages, demoClients, demoOwners } from "@/lib/demo/sales-data"
import {
  fetchOpportunities, fetchPipelineStages, fetchClients, fetchOwners,
} from "@/lib/supabase/salestrack-server"
import { OpportunitiesPageClient } from "./page-client"

export default async function OpportunitiesPage() {
  const [opportunities, stages, clients, owners] = isDemoMode
    ? [demoOpportunities, demoPipelineStages, demoClients, demoOwners]
    : await Promise.all([
        fetchOpportunities(),
        fetchPipelineStages(),
        fetchClients(),
        fetchOwners(),
      ])

  return (
    <OpportunitiesPageClient
      initialOpportunities={opportunities as any}
      initialStages={stages as any}
      initialClients={clients as any}
      initialOwners={owners as any}
    />
  )
}
