"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  OWNER_NAMES,
  type CampaignType, type CampaignStatus,
} from "@/lib/demo/sales-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, CalendarDays, Target, Users, Link2, Edit2, Trash2 } from "lucide-react"

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v)
}

const TYPE_LABELS: Record<CampaignType, string> = {
  email_blast: "E-mail", event: "Event", cold_outreach: "Cold Outreach",
  linkedin: "LinkedIn", trade_show: "Targi", webinar: "Webinar",
}
const TYPE_COLORS: Record<CampaignType, string> = {
  email_blast: "bg-blue-100 text-blue-800", event: "bg-green-100 text-green-800",
  cold_outreach: "bg-orange-100 text-orange-800", linkedin: "bg-indigo-100 text-indigo-800",
  trade_show: "bg-pink-100 text-pink-800", webinar: "bg-cyan-100 text-cyan-800",
}

interface Campaign {
  id: string; name: string; type: CampaignType; status: CampaignStatus
  ownerId: string; ownerName?: string; startDate: string; endDate: string
  budget: number; goal: string; description: string
  segmentIds: string[]; linkedOpportunityIds: string[]
  metrics: { sent: number; responded: number; openRate: number; clickRate: number }
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === "draft") return <Badge variant="outline">Szkic</Badge>
  if (status === "active") return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">Aktywna</span>
  )
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">Zakończona</span>
}
function TypeBadge({ type }: { type: CampaignType }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</span>
}

const EMPTY_FORM = {
  name: "", type: "email_blast" as CampaignType, startDate: "", endDate: "",
  budget: "", goal: "", description: "",
}
type FormState = typeof EMPTY_FORM

function campaignToForm(c: Campaign): FormState {
  return { name: c.name, type: c.type, startDate: c.startDate, endDate: c.endDate ?? "",
    budget: String(c.budget), goal: c.goal, description: c.description }
}

interface Props { initialCampaigns: Campaign[] }

export function CampaignsPageClient({ initialCampaigns }: Props) {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editTarget, setEditTarget] = useState<Campaign | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)

  const filtered = campaigns.filter(c => statusFilter === "all" ? true : c.status === statusFilter)

  function handleAdd() {
    if (!form.name.trim()) return
    const newCampaign: Campaign = {
      id: `camp-new-${Date.now()}`, name: form.name.trim(), type: form.type,
      status: "draft", ownerId: "u1", startDate: form.startDate, endDate: form.endDate,
      budget: Number(form.budget) || 0, goal: form.goal, description: form.description,
      segmentIds: [], linkedOpportunityIds: [],
      metrics: { sent: 0, responded: 0, openRate: 0, clickRate: 0 },
    }
    setCampaigns(prev => [newCampaign, ...prev])
    setShowAddDialog(false); setForm(EMPTY_FORM)
    toast({ title: "Kampania dodana", description: newCampaign.name })
  }

  function handleEditSave() {
    if (!editTarget || !editForm.name.trim()) return
    setCampaigns(prev => prev.map(c => c.id === editTarget.id ? {
      ...c, name: editForm.name.trim(), type: editForm.type, startDate: editForm.startDate,
      endDate: editForm.endDate, budget: Number(editForm.budget) || 0,
      goal: editForm.goal, description: editForm.description,
    } : c))
    setEditTarget(null)
    toast({ title: "Kampania zaktualizowana", description: editForm.name.trim() })
  }

  function handleDelete(c: Campaign) {
    setCampaigns(prev => prev.filter(x => x.id !== c.id))
    toast({ title: "Kampania usunięta", description: c.name })
  }

  function FormFields({ values, onChange }: { values: FormState; onChange: (patch: Partial<FormState>) => void }) {
    return (
      <div className="grid gap-3 py-2">
        <div className="space-y-1">
          <Label>Nazwa *</Label>
          <Input value={values.name} onChange={e => onChange({ name: e.target.value })} placeholder="Nazwa kampanii" />
        </div>
        <div className="space-y-1">
          <Label>Typ</Label>
          <Select value={values.type} onValueChange={v => onChange({ type: v as CampaignType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email_blast">E-mail</SelectItem><SelectItem value="event">Event</SelectItem>
              <SelectItem value="cold_outreach">Cold Outreach</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="trade_show">Targi</SelectItem><SelectItem value="webinar">Webinar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Data od</Label>
            <Input type="date" value={values.startDate} onChange={e => onChange({ startDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Data do</Label>
            <Input type="date" value={values.endDate} onChange={e => onChange({ endDate: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Budżet (PLN)</Label>
          <Input type="number" min={0} value={values.budget} onChange={e => onChange({ budget: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label>Cel</Label>
          <Input value={values.goal} onChange={e => onChange({ goal: e.target.value })} placeholder="Cel kampanii" />
        </div>
        <div className="space-y-1">
          <Label>Opis</Label>
          <Textarea rows={3} value={values.description} onChange={e => onChange({ description: e.target.value })} placeholder="Opis kampanii…" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kampanie</h1>
          <p className="text-sm text-muted-foreground">Zarządzaj kampaniami marketingowymi</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />Dodaj kampanię
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm shrink-0">Status:</Label>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as "all" | CampaignStatus)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem><SelectItem value="draft">Szkic</SelectItem>
            <SelectItem value="active">Aktywna</SelectItem><SelectItem value="completed">Zakończona</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} kampanii</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Brak kampanii spełniających kryteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    <Link href={`/platform/sales-track/campaigns/${c.id}`} className="hover:underline hover:text-primary">{c.name}</Link>
                  </CardTitle>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0"
                      onClick={() => { setEditTarget(c); setEditForm(campaignToForm(c)) }} title="Edytuj kampanię">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c)} title="Usuń kampanię">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <TypeBadge type={c.type} /><StatusBadge status={c.status} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{(c as any).ownerName ?? OWNER_NAMES[c.ownerId] ?? c.ownerId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.startDate} – {c.endDate || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">Budżet:</span>
                    <span>{formatPLN(c.budget)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Target className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.goal}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.linkedOpportunityIds.length} szans powiązanych</span>
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  <Button asChild size="sm" variant="outline" className="w-full h-9">
                    <Link href={`/platform/sales-track/campaigns/${c.id}`}>Szczegóły</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nowa kampania</DialogTitle></DialogHeader>
          <FormFields values={form} onChange={patch => setForm(p => ({ ...p, ...patch }))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget !== null} onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edytuj kampanię</DialogTitle></DialogHeader>
          <FormFields values={editForm} onChange={patch => setEditForm(p => ({ ...p, ...patch }))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Anuluj</Button>
            <Button onClick={handleEditSave} disabled={!editForm.name.trim()}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
