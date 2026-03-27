import { isDemoMode } from "@/lib/demo/data"
import { demoCampaigns } from "@/lib/demo/sales-data"
import { fetchCampaigns } from "@/lib/supabase/salestrack-server"
import { CampaignsPageClient } from "./page-client"

export default async function CampaignsPage() {
  const campaigns = isDemoMode ? demoCampaigns : await fetchCampaigns()

  return <CampaignsPageClient initialCampaigns={campaigns as any} />
}
