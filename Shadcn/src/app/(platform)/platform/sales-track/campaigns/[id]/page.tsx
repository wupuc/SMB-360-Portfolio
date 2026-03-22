"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  demoCampaigns, demoContactSegments, demoInteractions, demoOpportunities,
  OWNER_NAMES, clientMap, type CampaignType, type CampaignStatus,
} from "@/lib/demo/sales-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, Phone, Mail, Users, FileText, CheckSquare2, Send, MessageSquare, CalendarDays,
} from "lucide-react"

// ── helpers ────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(v)
}

const TYPE_LABELS: Record<CampaignType, string> = {
  email_blast:   "E-mail",
  event:         "Event",
  cold_outreach: "Cold Outreach",
  linkedin:      "LinkedIn",
  trade_show:    "Targi",
  webinar:       "Webinar",
}

const TYPE_COLORS: Record<CampaignType, string> = {
  email_blast:   "bg-blue-100 text-blue-800",
  event:         "bg-green-100 text-green-800",
  cold_outreach: "bg-orange-100 text-orange-800",
  linkedin:      "bg-indigo-100 text-indigo-800",
  trade_show:    "bg-pink-100 text-pink-800",
  webinar:       "bg-cyan-100 text-cyan-800",
}

const STAGE_LABELS: Record<string, string> = {
  "stage-001": "Kwalifikacja",
  "stage-002": "Propozycja",
  "stage-003": "Negocjacje",
  "stage-004": "Wygrany",
  "stage-005": "Przegrany",
}

const STAGE_COLORS: Record<string, string> = {
  "stage-001": "bg-indigo-100 text-indigo-800",
  "stage-002": "bg-blue-100 text-blue-800",
  "stage-003": "bg-amber-100 text-amber-800",
  "stage-004": "bg-green-100 text-green-800",
  "stage-005": "bg-red-100 text-red-800",
}

const INT_ICONS: Record<string, React.ElementType> = {
  call:    Phone,
  meeting: Users,
  email:   Mail,
  note:    FileText,
  task:    CheckSquare2,
}

const INT_TYPE_LABELS: Record<string, string> = {
  call: "Telefon", meeting: "Spotkanie", email: "E-mail",
  note: "Notatka", task: "Zadanie",
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === "draft")
    return <Badge variant="outline">Szkic</Badge>
  if (status === "active")
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">Aktywna</span>
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">Zakończona</span>
}

// ── component ──────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const campaignId = Array.isArray(params.id) ? params.id[0] : (params.id as string)
  const base = demoCampaigns.find(c => c.id === campaignId)

  // ── state ─────────────────────────────────────────────────────────────────
  const [segmentIds, setSegmentIds] = useState<string[]>(base?.segmentIds ?? [])
  const [showAddSegDialog, setShowAddSegDialog] = useState(false)
  const [newSegId, setNewSegId] = useState("")

  // ── guard ─────────────────────────────────────────────────────────────────
  if (!base) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg font-medium">Kampania nie znaleziona</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Wróć
        </Button>
      </div>
    )
  }

  // ── derived data ──────────────────────────────────────────────────────────
  const linkedSegments  = demoContactSegments.filter(s => segmentIds.includes(s.id))
  const availableSegs   = demoContactSegments.filter(s => !segmentIds.includes(s.id))
  const campaignInts    = demoInteractions.filter(i => i.campaignId === base.id)
  const linkedOpps      = demoOpportunities.filter(o => base.linkedOpportunityIds.includes(o.id))

  const sentCount     = campaignInts.filter(i => i.type === "email").length
  const repliedCount  = campaignInts.filter(i => i.status === "done").length
  const meetingCount  = campaignInts.filter(i => i.type === "meeting").length

  const totalContacts = linkedSegments.reduce((sum, s) => sum + s.estimatedCount, 0)
  const costPerContact = totalContacts > 0 ? base.budget / totalContacts : 0

  // ── handlers ──────────────────────────────────────────────────────────────
  function addSegment() {
    if (!newSegId) return
    setSegmentIds(prev => [...prev, newSegId])
    setShowAddSegDialog(false)
    setNewSegId("")
    const seg = demoContactSegments.find(s => s.id === newSegId)
    toast({ title: "Segment dodany", description: seg?.name })
  }

  function removeSegment(id: string) {
    setSegmentIds(prev => prev.filter(s => s !== id))
    toast({ title: "Segment usunięty" })
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 w-fit">
        <ArrowLeft className="mr-1 h-4 w-4" />Wróć
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold flex-1 min-w-0">{base.name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[base.type]}`}>
              {TYPE_LABELS[base.type]}
            </span>
            <StatusBadge status={base.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Opiekun</p>
            <p className="font-medium">{OWNER_NAMES[base.ownerId] ?? base.ownerId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Okres</p>
            <p className="font-medium">{base.startDate} – {base.endDate || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Budżet</p>
            <p className="font-medium">{formatPLN(base.budget)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Cel</p>
            <p className="font-medium line-clamp-2">{base.goal}</p>
          </div>
        </div>

        {base.description && (
          <p className="text-sm text-muted-foreground">{base.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recipients">
        <TabsList>
          <TabsTrigger value="recipients">Odbiorcy</TabsTrigger>
          <TabsTrigger value="interactions">Interakcje</TabsTrigger>
          <TabsTrigger value="metrics">Metryki</TabsTrigger>
        </TabsList>

        {/* ── Tab: Odbiorcy ── */}
        <TabsContent value="recipients" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{linkedSegments.length} segmentów</p>
            <Button size="sm" onClick={() => setShowAddSegDialog(true)} disabled={availableSegs.length === 0}>
              Dodaj segment
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa segmentu</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead className="text-right">Est. kontakty</TableHead>
                  <TableHead>Udostępniony</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedSegments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Brak segmentów
                    </TableCell>
                  </TableRow>
                ) : (
                  linkedSegments.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.description}</TableCell>
                      <TableCell className="text-right">{s.estimatedCount}</TableCell>
                      <TableCell>
                        {s.isShared
                          ? <Badge variant="outline" className="text-xs">Tak</Badge>
                          : <span className="text-xs text-muted-foreground">Nie</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeSegment(s.id)}
                        >
                          Usuń
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Tab: Interakcje ── */}
        <TabsContent value="interactions" className="mt-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Send className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{sentCount}</p>
                <p className="text-xs text-muted-foreground">Wysłane</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{repliedCount}</p>
                <p className="text-xs text-muted-foreground">Odpowiedzi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <CalendarDays className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                <p className="text-2xl font-bold">{meetingCount}</p>
                <p className="text-xs text-muted-foreground">Spotkania</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Przypisany</TableHead>
                  <TableHead>Zaplanowano</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignInts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Brak interakcji powiązanych z kampanią
                    </TableCell>
                  </TableRow>
                ) : (
                  campaignInts.map(i => {
                    const Icon = INT_ICONS[i.type] ?? FileText
                    const client = clientMap[i.clientId]
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {INT_TYPE_LABELS[i.type]}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{i.title}</TableCell>
                        <TableCell className="text-sm">{client?.name ?? i.clientId}</TableCell>
                        <TableCell className="text-sm">{OWNER_NAMES[i.assignedTo] ?? i.assignedTo}</TableCell>
                        <TableCell className="text-sm">{i.scheduledAt.replace("T", " ").slice(0, 16)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={i.status === "done" ? "default" : "outline"}
                            className={`text-xs ${i.status === "done" ? "bg-green-500 hover:bg-green-600" : ""}`}
                          >
                            {i.status === "done" ? "Wykonane" : "Do zrobienia"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Tab: Metryki ── */}
        <TabsContent value="metrics" className="mt-4 space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Liczba kontaktów
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{totalContacts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Odpowiedzi
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{base.metrics.responded}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Koszt / kontakt
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">
                  {totalContacts > 0 ? formatPLN(costPerContact) : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Szanse powiązane
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{base.linkedOpportunityIds.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Email-specific metrics */}
          {(base.type === "email_blast" || base.type === "cold_outreach") && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                    Open Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">{base.metrics.openRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                    Click Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">{base.metrics.clickRate}%</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Linked opportunities */}
          {linkedOpps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Powiązane szanse sprzedaży</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Szansa</TableHead>
                      <TableHead className="text-right">Wartość</TableHead>
                      <TableHead>Etap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedOpps.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium text-sm">{o.name}</TableCell>
                        <TableCell className="text-right text-sm">{formatPLN(o.value)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[o.stageId] ?? "bg-gray-100 text-gray-700"}`}>
                            {STAGE_LABELS[o.stageId] ?? o.stageId}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Segment Dialog */}
      <Dialog open={showAddSegDialog} onOpenChange={setShowAddSegDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Segment</Label>
            <Select value={newSegId} onValueChange={setNewSegId}>
              <SelectTrigger><SelectValue placeholder="Wybierz segment" /></SelectTrigger>
              <SelectContent>
                {availableSegs.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSegDialog(false)}>Anuluj</Button>
            <Button onClick={addSegment} disabled={!newSegId}>Dodaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
