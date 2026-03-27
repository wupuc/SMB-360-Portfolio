import { isDemoMode } from "@/lib/demo/data"
import {
  demoOpportunities, demoPipelineStages, demoClients, demoInteractions,
} from "@/lib/demo/sales-data"
import {
  fetchOpportunities, fetchPipelineStages, fetchClients, fetchInteractions,
} from "@/lib/supabase/salestrack-server"
import { SalesTrackDashboardClient } from "./page-client"

export default async function SalesTrackDashboard() {
  const [opportunities, stages, clients, interactions] = isDemoMode
    ? [demoOpportunities, demoPipelineStages, demoClients, demoInteractions]
    : await Promise.all([
        fetchOpportunities(),
        fetchPipelineStages(),
        fetchClients(),
        fetchInteractions(),
      ])

  return (
    <SalesTrackDashboardClient
      initialOpportunities={opportunities as any}
      initialStages={stages as any}
      initialClients={clients as any}
      initialInteractions={interactions as any}
    />
  )
}
