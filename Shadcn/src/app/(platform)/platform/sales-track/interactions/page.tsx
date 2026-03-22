"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  demoInteractions, demoClients, demoOpportunities, OWNER_NAMES, demoOwners, clientMap,
  demoEmailTemplates,
  type DemoInteraction, type InteractionType, type InteractionStatus, type InteractionPriority,
} from "@/lib/demo/sales-data"
import { isDemoMode } from "@/lib/demo/data"
import { fetchInteractions, fetchClients, fetchOpportunities, fetchOwners, fetchEmailTemplates } from "@/lib/supabase/salestrack"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Phone, Mail, Users, FileText, CheckSquare2, Edit2 } from "lucide-react"

// ── helpers ────────────────────────────────────────────────────────────────

function formatScheduled(s: string): string {
  return s.replace("T", " ").slice(0, 16)
}

const TYPE_ICONS: Record<InteractionType, React.ElementType> = {
  call:    Phone,
  meeting: Users,
  email:   Mail,
  note:    FileText,
  task:    CheckSquare2,
}

const TYPE_LABELS: Record<InteractionType, string> = {
  call: "Telefon", meeting: "Spotkanie", email: "Email", note: "Notatka", task: "Zadanie",
}

const PRIORITY_BADGE: Record<InteractionPriority, string> = {
  low:    "bg-gray-100 text-gray-600 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high:   "bg-red-100 text-red-700 border-red-200",
}

const PRIORITY_LABELS: Record<InteractionPriority, string> = {
  low: "Niski", medium: "Średni", high: "Wysoki",
}

type LocalInteraction = DemoInteraction

// ── blank new-interaction form ─────────────────────────────────────────────

const BLANK_FORM = {
  type:          "call" as InteractionType,
  title:         "",
  clientId:      "",
  opportunityId: "",
  assignedTo:    "",
  scheduledAt:   "",
  priority:      "medium" as InteractionPriority,
  description:   "",
  emailTo:       "",
  emailSubject:  "",
}

// ── main component ─────────────────────────────────────────────────────────

export default function InteractionsPage() {
  const { toast } = useToast()

  const [interactions,  setInteractions]  = useState<LocalInteraction[]>(isDemoMode ? demoInteractions : [])
  const [clients,       setClients]       = useState(isDemoMode ? demoClients : [])
  const [opportunities, setOpportunities] = useState(isDemoMode ? demoOpportunities : [])
  const [owners,        setOwners]        = useState(isDemoMode ? demoOwners : [])
  const [emailTpls,     setEmailTpls]     = useState(isDemoMode ? demoEmailTemplates : [])

  useEffect(() => {
    if (isDemoMode) return
    Promise.all([fetchInteractions(), fetchClients(), fetchOpportunities(), fetchOwners(), fetchEmailTemplates()])
      .then(([ints, clts, opps, ownrs, tpls]) => {
        setInteractions(ints as LocalInteraction[])
        setClients(clts as typeof demoClients)
        setOpportunities(opps as typeof demoOpportunities)
        setOwners(ownrs)
        setEmailTpls(tpls as typeof demoEmailTemplates)
      })
  }, [])

  const localClientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const [typeFilter,    setTypeFilter]    = useState<"all" | InteractionType>("all")
  const [statusFilter,  setStatusFilter]  = useState<"all" | InteractionStatus>("all")
  const [ownerFilter,   setOwnerFilter]   = useState<string>("all")
  const [searchText,    setSearchText]    = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)

  // new-interaction form state
  const [newInt, setNewInt] = useState({ ...BLANK_FORM })

  // template popover state (add dialog)
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false)

  // edit dialog state
  const [editTarget, setEditTarget] = useState<LocalInteraction | null>(null)
  const [editForm,   setEditForm]   = useState({ ...BLANK_FORM })
  const [editTemplatePopoverOpen, setEditTemplatePopoverOpen] = useState(false)

  // ── derived ───────────────────────────────────────────────────────────────

  const filtered = interactions.filter(i => {
    if (typeFilter   !== "all" && i.type       !== typeFilter)   return false
    if (statusFilter !== "all" && i.status     !== statusFilter) return false
    if (ownerFilter  !== "all" && i.assignedTo !== ownerFilter)  return false
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      const clientName = localClientMap[i.clientId]?.name?.toLowerCase() ?? (i as any).clientName?.toLowerCase() ?? ""
      if (
        !i.title.toLowerCase().includes(q) &&
        !clientName.includes(q) &&
        !((i as any).ownerName ?? OWNER_NAMES[i.assignedTo] ?? "").toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // opportunities filtered by selected client in the add dialog
  const clientOpportunities = newInt.clientId
    ? opportunities.filter(o => o.clientId === newInt.clientId)
    : []

  // opportunities filtered for edit dialog
  const editClientOpportunities = editForm.clientId
    ? opportunities.filter(o => o.clientId === editForm.clientId)
    : []

  // ── handlers ──────────────────────────────────────────────────────────────

  function markDone(id: string) {
    setInteractions(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, status: "done" as const, completedAt: new Date().toISOString() }
          : i
      )
    )
    toast({ title: "Oznaczono jako wykonane" })
  }

  function sendEmail(id: string) {
    setInteractions(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, status: "done" as const, completedAt: new Date().toISOString() }
          : i
      )
    )
    toast({
      title: "E-mail wysłany (demo)",
      description: "W wersji produkcyjnej wiadomość zostałaby wysłana przez serwer SMTP.",
    })
  }

  function applyTemplate(
    t: typeof demoEmailTemplates[number],
    setter: React.Dispatch<React.SetStateAction<typeof BLANK_FORM>>,
    closePopover: () => void
  ) {
    const body = t.body
      .replace(/\{\{contact_name\}\}/g, "Klient")
      .replace(/\{\{sender_name\}\}/g, "Anna Kowalska")
    setter(prev => ({ ...prev, emailSubject: t.subject, description: body }))
    closePopover()
  }

  function saveInteraction() {
    if (!newInt.title) return
    const int: LocalInteraction = {
      id:            `int-new-${Date.now()}`,
      type:          newInt.type,
      title:         newInt.title,
      clientId:      newInt.clientId,
      opportunityId: newInt.opportunityId || null,
      assignedTo:    newInt.assignedTo,
      createdBy:     newInt.assignedTo,
      scheduledAt:   newInt.scheduledAt || new Date().toISOString(),
      completedAt:   null,
      priority:      newInt.priority,
      status:        "todo",
      description:   newInt.description,
      emailTo:       newInt.type === "email" ? newInt.emailTo : null,
      emailSubject:  newInt.type === "email" ? newInt.emailSubject : null,
      campaignId:    null,
    }
    setInteractions(prev => [int, ...prev])
    setShowAddDialog(false)
    setNewInt({ ...BLANK_FORM })
    toast({ title: "Interakcja dodana" })
  }

  function openEditDialog(i: LocalInteraction) {
    setEditTarget(i)
    setEditForm({
      type:          i.type,
      title:         i.title,
      clientId:      i.clientId,
      opportunityId: i.opportunityId ?? "",
      assignedTo:    i.assignedTo,
      scheduledAt:   i.scheduledAt.slice(0, 16),
      priority:      i.priority,
      description:   i.description ?? "",
      emailTo:       i.emailTo ?? "",
      emailSubject:  i.emailSubject ?? "",
    })
  }

  function saveEdit() {
    if (!editTarget) return
    setInteractions(prev =>
      prev.map(i =>
        i.id === editTarget.id
          ? {
              ...i,
              type:          editForm.type,
              title:         editForm.title,
              clientId:      editForm.clientId,
              opportunityId: editForm.opportunityId || null,
              assignedTo:    editForm.assignedTo,
              scheduledAt:   editForm.scheduledAt || i.scheduledAt,
              priority:      editForm.priority,
              description:   editForm.description,
              emailTo:       editForm.type === "email" ? editForm.emailTo : i.emailTo,
              emailSubject:  editForm.type === "email" ? editForm.emailSubject : i.emailSubject,
            }
          : i
      )
    )
    setEditTarget(null)
    toast({ title: "Interakcja zaktualizowana" })
  }

  // ── email section (reusable for both add & edit dialogs) ──────────────────

  function EmailSection({
    form,
    setForm,
    popoverOpen,
    setPopoverOpen,
  }: {
    form: typeof BLANK_FORM
    setForm: React.Dispatch<React.SetStateAction<typeof BLANK_FORM>>
    popoverOpen: boolean
    setPopoverOpen: (v: boolean) => void
  }) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Do</Label>
          <Input
            type="email"
            placeholder="email@firma.pl"
            value={form.emailTo}
            onChange={e => setForm(p => ({ ...p, emailTo: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Temat</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Temat wiadomości"
              value={form.emailSubject}
              onChange={e => setForm(p => ({ ...p, emailSubject: e.target.value }))}
              className="flex-1"
            />
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" type="button">Szablon</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Wybierz szablon</p>
                {emailTpls.map(t => (
                  <button
                    key={t.id}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm"
                    onClick={() => applyTemplate(t, setForm, () => setPopoverOpen(false))}
                  >
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Podgląd treści</Label>
          <Textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Interakcje</h1>
          <p className="text-sm text-muted-foreground">
            Wszystkie aktywności sprzedażowe ({filtered.length})
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>Dodaj interakcję</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Szukaj…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="h-9 w-48"
        />

        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as "all" | InteractionType)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            <SelectItem value="call">Telefon</SelectItem>
            <SelectItem value="meeting">Spotkanie</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="note">Notatka</SelectItem>
            <SelectItem value="task">Zadanie</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as "all" | InteractionStatus)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="todo">Do zrobienia</SelectItem>
            <SelectItem value="done">Wykonane</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Przypisany" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            {owners.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile cards (< md) ── */}
      <div className="md:hidden space-y-2">
        {filtered.map(i => {
          const Icon   = TYPE_ICONS[i.type]
          const client = localClientMap[i.clientId]
          return (
            <Card key={i.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{i.title}</span>
                      {i.type === "task" && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                          ProjectHub
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {client?.name} · {i.scheduledAt?.slice(0, 10)}
                    </p>
                  </div>
                  <Badge className={PRIORITY_BADGE[i.priority]}>{PRIORITY_LABELS[i.priority]}</Badge>
                </div>
                <div className="mt-2 flex gap-2 justify-end">
                  {i.status === "todo" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => markDone(i.id)}
                    >
                      Wykonaj
                    </Button>
                  )}
                  {i.type === "email" && i.status === "todo" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => sendEmail(i.id)}
                    >
                      <Mail className="h-3 w-3 mr-1" />Wyślij
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => openEditDialog(i)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Brak interakcji spełniających kryteria.
          </p>
        )}
      </div>

      {/* ── Desktop table (>= md) ── */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Typ</TableHead>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Szansa</TableHead>
                  <TableHead>Przypisany</TableHead>
                  <TableHead>Zaplanowano</TableHead>
                  <TableHead>Priorytet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Brak interakcji spełniających kryteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(i => {
                    const Icon   = TYPE_ICONS[i.type]
                    const client = localClientMap[i.clientId]
                    const opp    = i.opportunityId
                      ? demoOpportunities.find(o => o.id === i.opportunityId)
                      : null
                    const isTask = i.type === "task"

                    return (
                      <TableRow key={i.id}>
                        {/* Type */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-xs">{TYPE_LABELS[i.type]}</span>
                            {isTask && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 border-blue-300 text-blue-600 shrink-0"
                              >
                                Widoczne w ProjectHub
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Title */}
                        <TableCell className="font-medium text-sm max-w-[180px] truncate">
                          {i.title}
                        </TableCell>

                        {/* Client */}
                        <TableCell className="text-sm text-muted-foreground">
                          {client?.name ?? "—"}
                        </TableCell>

                        {/* Opportunity */}
                        <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                          {opp?.name ?? "—"}
                        </TableCell>

                        {/* Owner */}
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {(i as any).ownerName ?? OWNER_NAMES[i.assignedTo] ?? i.assignedTo}
                        </TableCell>

                        {/* Scheduled */}
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatScheduled(i.scheduledAt)}
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[i.priority]}`}
                          >
                            {PRIORITY_LABELS[i.priority]}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {i.status === "done" ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                              Wykonane
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Do zrobienia
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {i.status === "todo" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => markDone(i.id)}
                              >
                                Wykonaj
                              </Button>
                            )}
                            {i.type === "email" && i.status === "todo" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => sendEmail(i.id)}
                              >
                                <Mail className="h-3 w-3 mr-1" />Wyślij
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(i)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Add Interaction Dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj interakcję</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Type */}
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select
                value={newInt.type}
                onValueChange={v =>
                  setNewInt(p => ({
                    ...p,
                    type: v as InteractionType,
                    emailTo: "",
                    emailSubject: "",
                  }))
                }
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

            {/* Title */}
            <div className="space-y-1">
              <Label>Tytuł</Label>
              <Input
                value={newInt.title}
                onChange={e => setNewInt(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Client */}
            <div className="space-y-1">
              <Label>Klient</Label>
              <Select
                value={newInt.clientId}
                onValueChange={v => setNewInt(p => ({ ...p, clientId: v, opportunityId: "" }))}
              >
                <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opportunity */}
            <div className="space-y-1">
              <Label>Szansa</Label>
              <Select
                value={newInt.opportunityId}
                onValueChange={v => setNewInt(p => ({ ...p, opportunityId: v }))}
                disabled={!newInt.clientId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      newInt.clientId
                        ? "Wybierz szansę (opcjonalnie)"
                        : "Najpierw wybierz klienta"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clientOpportunities.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned to */}
            <div className="space-y-1">
              <Label>Przypisany</Label>
              <Select
                value={newInt.assignedTo}
                onValueChange={v => setNewInt(p => ({ ...p, assignedTo: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Wybierz opiekuna" /></SelectTrigger>
                <SelectContent>
                  {owners.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled at */}
            <div className="space-y-1">
              <Label>Data i czas</Label>
              <Input
                type="datetime-local"
                value={newInt.scheduledAt}
                onChange={e => setNewInt(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <Label>Priorytet</Label>
              <Select
                value={newInt.priority}
                onValueChange={v => setNewInt(p => ({ ...p, priority: v as InteractionPriority }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email section OR plain description */}
            {newInt.type === "email" ? (
              <EmailSection
                form={newInt}
                setForm={setNewInt}
                popoverOpen={templatePopoverOpen}
                setPopoverOpen={setTemplatePopoverOpen}
              />
            ) : (
              <div className="space-y-1">
                <Label>Opis</Label>
                <Textarea
                  rows={3}
                  value={newInt.description}
                  onChange={e => setNewInt(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={saveInteraction}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Interaction Dialog ── */}
      <Dialog open={editTarget !== null} onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edytuj interakcję</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Type */}
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select
                value={editForm.type}
                onValueChange={v =>
                  setEditForm(p => ({
                    ...p,
                    type: v as InteractionType,
                    emailTo: "",
                    emailSubject: "",
                  }))
                }
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

            {/* Title */}
            <div className="space-y-1">
              <Label>Tytuł</Label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Client */}
            <div className="space-y-1">
              <Label>Klient</Label>
              <Select
                value={editForm.clientId}
                onValueChange={v => setEditForm(p => ({ ...p, clientId: v, opportunityId: "" }))}
              >
                <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opportunity */}
            <div className="space-y-1">
              <Label>Szansa</Label>
              <Select
                value={editForm.opportunityId}
                onValueChange={v => setEditForm(p => ({ ...p, opportunityId: v }))}
                disabled={!editForm.clientId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      editForm.clientId
                        ? "Wybierz szansę (opcjonalnie)"
                        : "Najpierw wybierz klienta"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {editClientOpportunities.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned to */}
            <div className="space-y-1">
              <Label>Przypisany</Label>
              <Select
                value={editForm.assignedTo}
                onValueChange={v => setEditForm(p => ({ ...p, assignedTo: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Wybierz opiekuna" /></SelectTrigger>
                <SelectContent>
                  {owners.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled at */}
            <div className="space-y-1">
              <Label>Data i czas</Label>
              <Input
                type="datetime-local"
                value={editForm.scheduledAt}
                onChange={e => setEditForm(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <Label>Priorytet</Label>
              <Select
                value={editForm.priority}
                onValueChange={v => setEditForm(p => ({ ...p, priority: v as InteractionPriority }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email section OR plain description */}
            {editForm.type === "email" ? (
              <EmailSection
                form={editForm}
                setForm={setEditForm}
                popoverOpen={editTemplatePopoverOpen}
                setPopoverOpen={setEditTemplatePopoverOpen}
              />
            ) : (
              <div className="space-y-1">
                <Label>Opis</Label>
                <Textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Anuluj</Button>
            <Button onClick={saveEdit}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
