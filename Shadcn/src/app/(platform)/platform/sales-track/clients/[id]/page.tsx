"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  demoClients, demoClientContacts, demoOpportunities, demoInteractions,
  demoPipelineStages, OWNER_NAMES, demoOwners, demoProducts, clientMap, stageMap,
  type DemoInteraction, type DemoOpportunity, type ClientType, type InteractionType,
} from "@/lib/demo/sales-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft, Phone, Globe, ExternalLink, CheckSquare2, FileText,
  Mail, Users, Download, Upload, Edit2,
} from "lucide-react"

// ── helpers ────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(v)
}

function clientTypeBadge(type: ClientType) {
  const map: Record<ClientType, string> = {
    lead:      "bg-blue-100 text-blue-700 border-blue-200",
    strategic: "bg-purple-100 text-purple-700 border-purple-200",
    regular:   "bg-green-100 text-green-700 border-green-200",
    inactive:  "bg-gray-100 text-gray-500 border-gray-200",
  }
  const labels: Record<ClientType, string> = {
    lead: "Lead", strategic: "Strategiczny", regular: "Regularny", inactive: "Nieaktywny",
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[type]}`}>
      {labels[type]}
    </span>
  )
}

function LeadStars({ score, onChange }: { score: number; onChange?: (v: number) => void }) {
  return (
    <span className="text-lg leading-none">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`${i < score ? "text-yellow-400" : "text-muted-foreground/30"} ${onChange ? "cursor-pointer" : ""}`}
          onClick={() => onChange?.(i + 1)}
        >
          {i < score ? "★" : "☆"}
        </span>
      ))}
    </span>
  )
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone, meeting: Users, email: Mail, note: FileText, task: CheckSquare2,
}

const COUNTRY_LABELS: Record<string, string> = {
  PL: "Polska",
  DE: "Niemcy",
  CZ: "Czechy",
  SK: "Słowacja",
  US: "USA",
  GB: "Wielka Brytania",
}

type LocalContact = typeof demoClientContacts[number]
type LocalOpp = DemoOpportunity
type LocalInteraction = DemoInteraction

const PLACEHOLDER_DOCS = [
  { name: "Oferta_Q1_2026.pdf",   size: "245 KB", date: "2026-03-01", icon: FileText },
  { name: "Umowa_ramowa.docx",    size: "118 KB", date: "2026-01-15", icon: FileText },
  { name: "Prezentacja.pptx",     size: "3.2 MB", date: "2026-02-20", icon: FileText },
]

// ── extended local client type ─────────────────────────────────────────────

interface LocalClient {
  id: string
  name: string
  type: ClientType
  industry: string
  city: string
  country: string
  assignedTo: string
  leadScore: number
  isActive: boolean
  website: string
  phone: string
  notes: string
  address: string
  nip: string
  regon: string
}

// ── main component ─────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const params    = useParams()
  const router    = useRouter()
  const { toast } = useToast()

  const clientId   = Array.isArray(params.id) ? params.id[0] : params.id as string
  const baseClient = demoClients.find(c => c.id === clientId)

  // ── state ───────────────────────────────────────────────────────────────
  const [client, setClient] = useState<LocalClient>(() => ({
    id:         baseClient?.id ?? "",
    name:       baseClient?.name ?? "",
    type:       (baseClient?.type ?? "lead") as ClientType,
    industry:   baseClient?.industry ?? "",
    city:       baseClient?.city ?? "",
    country:    baseClient?.country ?? "PL",
    assignedTo: baseClient?.assignedTo ?? "",
    leadScore:  baseClient?.leadScore ?? 3,
    isActive:   baseClient?.isActive ?? true,
    website:    baseClient?.website ?? "",
    phone:      baseClient?.phone ?? "",
    notes:      baseClient?.notes ?? "",
    address:    (baseClient as any)?.address ?? "",
    nip:        (baseClient as any)?.nip ?? "",
    regon:      (baseClient as any)?.regon ?? "",
  }))

  const [notes,         setNotes]         = useState(baseClient?.notes ?? "")
  const [contacts,      setContacts]      = useState<LocalContact[]>(
    demoClientContacts.filter(c => c.clientId === clientId)
  )
  const [opportunities, setOpportunities] = useState<LocalOpp[]>(
    demoOpportunities.filter(o => o.clientId === clientId)
  )
  const [interactions,  setInteractions]  = useState<LocalInteraction[]>(
    demoInteractions.filter(i => i.clientId === clientId)
  )
  const [interactionTypeFilter, setInteractionTypeFilter] = useState<"all" | InteractionType>("all")

  // details edit dialog
  const [showDetailsEdit, setShowDetailsEdit] = useState(false)
  const [detailsForm, setDetailsForm] = useState({
    name:       client.name,
    type:       client.type,
    industry:   client.industry,
    city:       client.city,
    country:    client.country,
    assignedTo: client.assignedTo,
    leadScore:  client.leadScore,
    website:    client.website,
    phone:      client.phone,
    notes:      client.notes,
    address:    client.address,
    nip:        client.nip,
    regon:      client.regon,
  })

  // add-contact dialog
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [newContact, setNewContact] = useState({
    firstName: "", lastName: "", email: "", phone: "", role: "", isPrimary: false,
  })

  // add-opportunity dialog
  const [showOppDialog, setShowOppDialog] = useState(false)
  const [newOpp, setNewOpp] = useState({
    name: "", stageId: "", value: "", probability: "", expectedClose: "",
  })

  // edit-opportunity dialog
  const [editingOpp, setEditingOpp] = useState<LocalOpp | null>(null)
  const [editOppForm, setEditOppForm] = useState({
    name: "", stageId: "", value: "", probability: "", expectedClose: "",
  })

  // add-interaction dialog
  const [showIntDialog, setShowIntDialog] = useState(false)
  const [newInt, setNewInt] = useState({
    type: "call" as InteractionType,
    title: "", description: "", scheduledAt: "", priority: "medium" as "low" | "medium" | "high",
  })

  // ── guard ────────────────────────────────────────────────────────────────
  if (!baseClient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg font-medium">Klient nie znaleziony</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Wróć
        </Button>
      </div>
    )
  }

  // ── handlers ─────────────────────────────────────────────────────────────
  function toggleActive() {
    const next = !client.isActive
    setClient(prev => ({ ...prev, isActive: next }))
    toast({ title: next ? "Klient oznaczony jako aktywny" : "Klient oznaczony jako nieaktywny" })
  }

  function saveNotes() {
    setClient(prev => ({ ...prev, notes }))
    toast({ title: "Notatki zapisane" })
  }

  function openDetailsEdit() {
    setDetailsForm({
      name:       client.name,
      type:       client.type,
      industry:   client.industry,
      city:       client.city,
      country:    client.country,
      assignedTo: client.assignedTo,
      leadScore:  client.leadScore,
      website:    client.website,
      phone:      client.phone,
      notes:      client.notes,
      address:    client.address,
      nip:        client.nip,
      regon:      client.regon,
    })
    setShowDetailsEdit(true)
  }

  function saveDetails() {
    setClient(prev => ({ ...prev, ...detailsForm }))
    setShowDetailsEdit(false)
    toast({ title: "Dane klienta zaktualizowane" })
  }

  function saveContact() {
    if (!newContact.firstName || !newContact.lastName) return
    const contact: LocalContact = {
      id:        `cc-new-${Date.now()}`,
      clientId,
      firstName: newContact.firstName,
      lastName:  newContact.lastName,
      email:     newContact.email,
      phone:     newContact.phone,
      role:      newContact.role,
      isPrimary: newContact.isPrimary,
    }
    setContacts(prev => [...prev, contact])
    setShowContactDialog(false)
    setNewContact({ firstName: "", lastName: "", email: "", phone: "", role: "", isPrimary: false })
    toast({ title: "Kontakt dodany" })
  }

  function saveOpp() {
    if (!newOpp.name || !newOpp.stageId) return
    const opp: LocalOpp = {
      id:            `op-new-${Date.now()}`,
      name:          newOpp.name,
      clientId,
      stageId:       newOpp.stageId,
      ownerId:       client.assignedTo,
      value:         Number(newOpp.value) || 0,
      probability:   Number(newOpp.probability) || 0,
      expectedClose: newOpp.expectedClose,
      lastActivity:  new Date().toISOString().slice(0, 10),
      inactivityFlag: null,
      notes:         "",
    }
    setOpportunities(prev => [...prev, opp])
    setShowOppDialog(false)
    setNewOpp({ name: "", stageId: "", value: "", probability: "", expectedClose: "" })
    toast({ title: "Szansa dodana" })
  }

  function openEditOpp(o: LocalOpp) {
    setEditingOpp(o)
    setEditOppForm({
      name:          o.name,
      stageId:       o.stageId,
      value:         String(o.value),
      probability:   String(o.probability),
      expectedClose: o.expectedClose,
    })
  }

  function saveEditOpp() {
    if (!editingOpp || !editOppForm.name || !editOppForm.stageId) return
    setOpportunities(prev =>
      prev.map(o =>
        o.id === editingOpp.id
          ? {
              ...o,
              name:          editOppForm.name,
              stageId:       editOppForm.stageId,
              value:         Number(editOppForm.value) || 0,
              probability:   Number(editOppForm.probability) || 0,
              expectedClose: editOppForm.expectedClose,
            }
          : o
      )
    )
    setEditingOpp(null)
    toast({ title: "Szansa zaktualizowana" })
  }

  function saveInteraction() {
    if (!newInt.title) return
    const int: LocalInteraction = {
      id:            `int-new-${Date.now()}`,
      type:          newInt.type,
      title:         newInt.title,
      clientId,
      opportunityId: null,
      assignedTo:    client.assignedTo,
      createdBy:     client.assignedTo,
      scheduledAt:   newInt.scheduledAt || new Date().toISOString(),
      completedAt:   null,
      priority:      newInt.priority,
      status:        "todo",
      description:   newInt.description,
      emailTo:       null,
      emailSubject:  null,
      campaignId:    null,
    }
    setInteractions(prev => [int, ...prev])
    setShowIntDialog(false)
    setNewInt({ type: "call", title: "", description: "", scheduledAt: "", priority: "medium" })
    toast({ title: "Interakcja dodana" })
  }

  const activeStages         = demoPipelineStages.filter(s => s.isActive)
  const filteredInteractions = interactions
    .filter(i => interactionTypeFilter === "all" || i.type === interactionTypeFilter)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />Wróć
        </Button>

        {/* Hero — stacks vertically on mobile */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1 min-w-0">
            {/* Name + badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {clientTypeBadge(client.type)}
            </div>
            {/* City + country */}
            <p className="text-sm text-muted-foreground">
              {client.city}{client.country ? `, ${COUNTRY_LABELS[client.country] ?? client.country}` : ""}
            </p>
            {/* Phone + website */}
            <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
              {client.phone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />{client.phone}
                </span>
              )}
              {client.website && (
                <a
                  href={`https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />{client.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {/* Stars + assigned */}
            <div className="flex items-center gap-3 mt-1">
              <LeadStars score={client.leadScore} />
              <span className="text-sm text-muted-foreground">
                {OWNER_NAMES[client.assignedTo] ?? client.assignedTo}
              </span>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant={client.isActive ? "outline" : "secondary"}
              size="sm"
              onClick={toggleActive}
              className={client.isActive ? "border-green-400 text-green-700" : ""}
            >
              {client.isActive ? "Aktywny — dezaktywuj" : "Nieaktywny — aktywuj"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="details">Szczegóły</TabsTrigger>
          <TabsTrigger value="contacts">Kontakty</TabsTrigger>
          <TabsTrigger value="opportunities">Szanse</TabsTrigger>
          <TabsTrigger value="interactions">Interakcje</TabsTrigger>
          <TabsTrigger value="notes">Notatki</TabsTrigger>
          <TabsTrigger value="documents">Dokumenty</TabsTrigger>
        </TabsList>

        {/* ── TAB: Szczegóły ── */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Dane firmy</CardTitle>
              <Button size="sm" variant="outline" onClick={openDetailsEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Nazwa firmy</p>
                  <p className="text-sm font-medium mt-0.5">{client.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Typ</p>
                  <div className="mt-0.5">{clientTypeBadge(client.type)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Branża</p>
                  <p className="text-sm mt-0.5">{client.industry || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Strona WWW</p>
                  {client.website ? (
                    <a
                      href={`https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {client.website}<ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm mt-0.5">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Telefon</p>
                  <p className="text-sm mt-0.5">{client.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Adres</p>
                  <p className="text-sm mt-0.5">{client.address || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Miasto</p>
                  <p className="text-sm mt-0.5">{client.city || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Kraj</p>
                  <p className="text-sm mt-0.5">
                    {client.country ? (COUNTRY_LABELS[client.country] ?? client.country) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">NIP</p>
                  <p className="text-sm mt-0.5">{client.nip || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">REGON</p>
                  <p className="text-sm mt-0.5">{client.regon || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lead Score</p>
                <LeadStars score={client.leadScore} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                {client.isActive ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktywny</Badge>
                ) : (
                  <Badge variant="secondary">Nieaktywny</Badge>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Przypisany handlowiec</p>
                <p className="text-sm">{OWNER_NAMES[client.assignedTo] ?? client.assignedTo}</p>
              </div>

              {client.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notatki</p>
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Edit Dialog */}
          <Dialog open={showDetailsEdit} onOpenChange={setShowDetailsEdit}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edytuj dane klienta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>Nazwa *</Label>
                  <Input
                    value={detailsForm.name}
                    onChange={e => setDetailsForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Typ</Label>
                  <Select
                    value={detailsForm.type}
                    onValueChange={v => setDetailsForm(f => ({ ...f, type: v as ClientType }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="strategic">Strategiczny</SelectItem>
                      <SelectItem value="regular">Regularny</SelectItem>
                      <SelectItem value="inactive">Nieaktywny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Branża</Label>
                  <Input
                    value={detailsForm.industry}
                    onChange={e => setDetailsForm(f => ({ ...f, industry: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Strona WWW</Label>
                  <Input
                    value={detailsForm.website}
                    onChange={e => setDetailsForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="domena.pl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Telefon</Label>
                  <Input
                    value={detailsForm.phone}
                    onChange={e => setDetailsForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+48 …"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Adres</Label>
                  <Input
                    value={detailsForm.address}
                    onChange={e => setDetailsForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="ul. Przykładowa 1"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Miasto</Label>
                  <Input
                    value={detailsForm.city}
                    onChange={e => setDetailsForm(f => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Kraj</Label>
                  <Select
                    value={detailsForm.country}
                    onValueChange={v => setDetailsForm(f => ({ ...f, country: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                        <SelectItem key={code} value={code}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>NIP</Label>
                    <Input
                      value={detailsForm.nip}
                      onChange={e => setDetailsForm(f => ({ ...f, nip: e.target.value }))}
                      placeholder="000-000-00-00"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>REGON</Label>
                    <Input
                      value={detailsForm.regon}
                      onChange={e => setDetailsForm(f => ({ ...f, regon: e.target.value }))}
                      placeholder="000000000"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Lead Score</Label>
                  <LeadStars
                    score={detailsForm.leadScore}
                    onChange={v => setDetailsForm(f => ({ ...f, leadScore: v }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Notatki</Label>
                  <Textarea
                    rows={3}
                    value={detailsForm.notes}
                    onChange={e => setDetailsForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Przypisany handlowiec</Label>
                  <Select
                    value={detailsForm.assignedTo}
                    onValueChange={v => setDetailsForm(f => ({ ...f, assignedTo: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {demoOwners.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsEdit(false)}>Anuluj</Button>
                <Button onClick={saveDetails} disabled={!detailsForm.name.trim()}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── TAB: Kontakty ── */}
        <TabsContent value="contacts" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Kontakty ({contacts.length})</h2>
            <Button size="sm" onClick={() => setShowContactDialog(true)}>Dodaj kontakt</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Główny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Brak kontaktów
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-sm">{c.role}</TableCell>
                      <TableCell>
                        {c.isPrimary && (
                          <Badge variant="secondary" className="text-xs">Główny</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj kontakt</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Imię</Label>
                    <Input value={newContact.firstName}
                      onChange={e => setNewContact(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nazwisko</Label>
                    <Input value={newContact.lastName}
                      onChange={e => setNewContact(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={newContact.email}
                    onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Telefon</Label>
                  <Input value={newContact.phone}
                    onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Rola</Label>
                  <Input value={newContact.role}
                    onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="isPrimary"
                    checked={newContact.isPrimary}
                    onCheckedChange={v => setNewContact(p => ({ ...p, isPrimary: v }))}
                  />
                  <Label htmlFor="isPrimary">Kontakt główny</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContactDialog(false)}>Anuluj</Button>
                <Button onClick={saveContact}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── TAB: Szanse ── */}
        <TabsContent value="opportunities" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Szanse ({opportunities.length})</h2>
            <Button size="sm" onClick={() => setShowOppDialog(true)}>Dodaj szansę</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2">Brak szans sprzedaży.</p>
            ) : (
              opportunities.map(o => {
                const stage = stageMap[o.stageId]
                return (
                  <Card key={o.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/platform/sales-track/opportunities/${o.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {o.name}
                        </Link>
                        <div className="flex items-center gap-1 shrink-0">
                          {stage && (
                            <span className="flex items-center gap-1">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="text-xs text-muted-foreground">{stage.name}</span>
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditOpp(o)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{formatPLN(o.value)}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Praw.: {o.probability}%</span>
                        <span>Zamknięcie: {o.expectedClose}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Add Opportunity Dialog */}
          <Dialog open={showOppDialog} onOpenChange={setShowOppDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj szansę</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label>Nazwa</Label>
                  <Input value={newOpp.name}
                    onChange={e => setNewOpp(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Etap</Label>
                  <Select value={newOpp.stageId} onValueChange={v => setNewOpp(p => ({ ...p, stageId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Wybierz etap" /></SelectTrigger>
                    <SelectContent>
                      {activeStages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Wartość (PLN)</Label>
                    <Input type="number" value={newOpp.value}
                      onChange={e => setNewOpp(p => ({ ...p, value: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Prawdopodobieństwo (%)</Label>
                    <Input type="number" min={0} max={100} value={newOpp.probability}
                      onChange={e => setNewOpp(p => ({ ...p, probability: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Data zamknięcia</Label>
                  <Input type="date" value={newOpp.expectedClose}
                    onChange={e => setNewOpp(p => ({ ...p, expectedClose: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOppDialog(false)}>Anuluj</Button>
                <Button onClick={saveOpp}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Opportunity Dialog */}
          <Dialog open={!!editingOpp} onOpenChange={open => { if (!open) setEditingOpp(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edytuj szansę</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label>Nazwa</Label>
                  <Input value={editOppForm.name}
                    onChange={e => setEditOppForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Etap</Label>
                  <Select value={editOppForm.stageId} onValueChange={v => setEditOppForm(p => ({ ...p, stageId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Wybierz etap" /></SelectTrigger>
                    <SelectContent>
                      {activeStages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Wartość (PLN)</Label>
                    <Input type="number" value={editOppForm.value}
                      onChange={e => setEditOppForm(p => ({ ...p, value: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Prawdopodobieństwo (%)</Label>
                    <Input type="number" min={0} max={100} value={editOppForm.probability}
                      onChange={e => setEditOppForm(p => ({ ...p, probability: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Data zamknięcia</Label>
                  <Input type="date" value={editOppForm.expectedClose}
                    onChange={e => setEditOppForm(p => ({ ...p, expectedClose: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingOpp(null)}>Anuluj</Button>
                <Button onClick={saveEditOpp}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── TAB: Interakcje ── */}
        <TabsContent value="interactions" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Interakcje</h2>
              <Select
                value={interactionTypeFilter}
                onValueChange={v => setInteractionTypeFilter(v as "all" | InteractionType)}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="call">Telefon</SelectItem>
                  <SelectItem value="meeting">Spotkanie</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="note">Notatka</SelectItem>
                  <SelectItem value="task">Zadanie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => setShowIntDialog(true)}>Dodaj interakcję</Button>
          </div>

          <div className="space-y-2">
            {filteredInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak interakcji.</p>
            ) : (
              filteredInteractions.map(i => {
                const Icon = TYPE_ICONS[i.type] ?? FileText
                return (
                  <div key={i.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {i.type === "task" && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                          ProjectHub
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{i.title}</p>
                        <Badge
                          variant={i.status === "done" ? "default" : "outline"}
                          className={`shrink-0 text-xs ${i.status === "done" ? "bg-green-500 hover:bg-green-600" : ""}`}
                        >
                          {i.status === "done" ? "Wykonane" : "Do zrobienia"}
                        </Badge>
                      </div>
                      {i.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{i.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.scheduledAt.replace("T", " ").slice(0, 16)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Dialog open={showIntDialog} onOpenChange={setShowIntDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj interakcję</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label>Typ</Label>
                  <Select
                    value={newInt.type}
                    onValueChange={v => setNewInt(p => ({ ...p, type: v as InteractionType }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Telefon</SelectItem>
                      <SelectItem value="meeting">Spotkanie</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="note">Notatka</SelectItem>
                      <SelectItem value="task">Zadanie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tytuł</Label>
                  <Input value={newInt.title}
                    onChange={e => setNewInt(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Opis</Label>
                  <Textarea rows={3} value={newInt.description}
                    onChange={e => setNewInt(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Data i czas</Label>
                  <Input type="datetime-local" value={newInt.scheduledAt}
                    onChange={e => setNewInt(p => ({ ...p, scheduledAt: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Priorytet</Label>
                  <Select
                    value={newInt.priority}
                    onValueChange={v => setNewInt(p => ({ ...p, priority: v as "low" | "medium" | "high" }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niski</SelectItem>
                      <SelectItem value="medium">Średni</SelectItem>
                      <SelectItem value="high">Wysoki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowIntDialog(false)}>Anuluj</Button>
                <Button onClick={saveInteraction}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── TAB: Notatki ── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Wpisz notatki dotyczące klienta…"
              />
              <Button onClick={saveNotes}>Zapisz notatki</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Dokumenty ── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Dokumenty</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: "Demo: wgrywanie niedostępne" })}
            >
              <Upload className="mr-2 h-4 w-4" />Wgraj dokument
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Rozmiar</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLACEHOLDER_DOCS.map(doc => (
                  <TableRow key={doc.name}>
                    <TableCell className="flex items-center gap-2">
                      <doc.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{doc.name}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.date}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast({ title: "Demo: pobieranie niedostępne" })}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
