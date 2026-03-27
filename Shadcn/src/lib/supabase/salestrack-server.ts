/**
 * SalesTrack — Server-side Supabase query functions (use in Server Components only)
 * Mirror of salestrack.ts but uses the server client (cookie-based session).
 */
import { createClient as createTypedClient } from "@/lib/supabase/server"
import type {
  ClientType, InactivityFlag,
  InteractionType, InteractionStatus, InteractionPriority,
  CampaignType, CampaignStatus, SystemFlag,
} from "@/lib/demo/sales-data"

// Untyped helper — SalesTrack tables are not in database.types.ts yet
async function createClient() {
  return (await createTypedClient()) as any
}

export async function fetchOwners() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .order("first_name")
  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim(),
  }))
}

export async function fetchPipelineStages() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("stage_order")
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    order: r.stage_order,
    systemFlag: r.system_flag as SystemFlag,
    color: r.color ?? "#3b82f6",
    probability: r.probability_default ?? 50,
    isActive: r.is_active ?? true,
  }))
}

export async function fetchClients() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("clients")
    .select("*, owner:users!assigned_to(id, first_name, last_name)")
    .order("name")
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type as ClientType,
    industry: r.industry ?? "",
    city: r.city ?? "",
    country: r.country ?? "PL",
    assignedTo: r.assigned_to ?? "",
    ownerName: r.owner ? `${r.owner.first_name} ${r.owner.last_name}`.trim() : "",
    leadScore: r.lead_score ?? 0,
    isActive: r.is_active ?? true,
    website: r.website ?? "",
    phone: r.phone ?? "",
    notes: r.notes ?? "",
    address: r.address ?? "",
  }))
}

export async function fetchOpportunities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("opportunities")
    .select(`
      *,
      owner:users!owner_id(id, first_name, last_name),
      client:clients!client_id(id, name),
      stage:pipeline_stages!stage_id(id, name, system_flag, color, probability_default)
    `)
    .order("created_at", { ascending: false })
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    clientId: r.client_id ?? "",
    clientName: r.client?.name ?? "",
    stageId: r.stage_id ?? "",
    stageName: r.stage?.name ?? "",
    stageColor: r.stage?.color ?? "#3b82f6",
    stageFlag: (r.stage?.system_flag ?? "in_progress") as SystemFlag,
    ownerId: r.owner_id ?? "",
    ownerName: r.owner ? `${r.owner.first_name} ${r.owner.last_name}`.trim() : "",
    value: Number(r.estimated_value ?? 0),
    probability: r.probability ?? 50,
    expectedClose: r.expected_close_date ?? "",
    lastActivity: r.last_activity_at ? r.last_activity_at.slice(0, 10) : "",
    inactivityFlag: r.inactivity_flag as InactivityFlag,
    notes: r.notes ?? "",
  }))
}

export async function fetchInteractions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("interactions")
    .select(`
      *,
      assignee:users!assigned_to(id, first_name, last_name),
      client:clients!client_id(id, name)
    `)
    .order("scheduled_at", { ascending: false })
  return (data ?? []).map((r: any) => ({
    id: r.id,
    type: r.type as InteractionType,
    title: r.title,
    clientId: r.client_id ?? "",
    clientName: r.client?.name ?? "",
    opportunityId: r.opportunity_id ?? null,
    assignedTo: r.assigned_to ?? "",
    ownerName: r.assignee ? `${r.assignee.first_name} ${r.assignee.last_name}`.trim() : "",
    createdBy: r.created_by ?? "",
    scheduledAt: r.scheduled_at ?? "",
    completedAt: r.completed_at ?? null,
    priority: r.priority as InteractionPriority,
    status: r.status as InteractionStatus,
    description: r.description ?? "",
    emailTo: r.email_to ?? null,
    emailSubject: r.email_subject ?? null,
    campaignId: r.campaign_id ?? null,
  }))
}

export async function fetchCampaigns() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("campaigns")
    .select("*, owner:users!owner_id(id, first_name, last_name)")
    .order("created_at", { ascending: false })
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type as CampaignType,
    status: r.status as CampaignStatus,
    ownerId: r.owner_id ?? "",
    ownerName: r.owner ? `${r.owner.first_name} ${r.owner.last_name}`.trim() : "",
    startDate: r.start_date ?? "",
    endDate: r.end_date ?? "",
    budget: Number(r.budget ?? 0),
    goal: r.goal ?? "",
    description: r.description ?? "",
    segmentIds: [] as string[],
    linkedOpportunityIds: [] as string[],
    metrics: { sent: 0, responded: 0, openRate: 0, clickRate: 0 },
  }))
}

export async function fetchEmailTemplates() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .order("name")
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    body: r.body,
    isShared: r.is_shared ?? true,
    createdBy: r.created_by ?? "",
  }))
}
