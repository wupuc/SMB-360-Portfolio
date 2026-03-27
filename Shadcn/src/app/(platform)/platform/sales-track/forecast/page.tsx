import { isDemoMode } from "@/lib/demo/data"
import { demoOpportunities, demoPipelineStages, demoOwners } from "@/lib/demo/sales-data"
import { fetchOpportunities, fetchPipelineStages, fetchOwners } from "@/lib/supabase/salestrack-server"
import { ForecastPageClient } from "./page-client"

export default async function ForecastPage() {
  const [opportunities, stages, owners] = isDemoMode
    ? [demoOpportunities, demoPipelineStages, demoOwners]
    : await Promise.all([fetchOpportunities(), fetchPipelineStages(), fetchOwners()])

  return (
    <ForecastPageClient
      initialOpportunities={opportunities as any}
      initialStages={stages as any}
      initialOwners={owners as any}
    />
  )
}
