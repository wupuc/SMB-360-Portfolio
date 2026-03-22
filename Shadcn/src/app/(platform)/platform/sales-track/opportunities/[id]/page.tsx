"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  demoOpportunities, demoPipelineStages, demoClients, demoInteractions,
  demoOpportunityProducts, demoProducts, demoCloseReasons, OWNER_NAMES, demoOwners,
  clientMap, stageMap, productMap, demoEmailTemplates,
  type DemoInteraction, type InteractionType,
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft, Phone, Mail, Users, FileText, CheckSquare2, AlertTriangle, Info, Edit2,
} from "lucide-react"

// ── helpers ────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(v)
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone, meeting: Users, email: Mail, note: FileText, task: CheckSquare2,
}

type LocalInteraction = DemoInteraction
type LocalOppProduct  = typeof demoOpportunityProducts[number]

// blank new-interaction form shape
const BLANK_INT = {
  type:         "call" as InteractionType,
  title:        "",
  description:  "",
  scheduledAt:  "",
  priority:     "medium" as "low" | "medium" | "high",
  emailTo:      "",
  emailSubject: "",
}

// ── main component ─────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const params    = useParams()
  const router    = useRouter()
  const { toast } = useToast()

  const oppId   = Array.isArray(params.id) ? params.id[0] : params.id as string
  const baseOpp = demoOpportunities.find(o => o.id === oppId)

  // ── opportunity header edit state ─────────────────────────────────────────
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editOpp, setEditOpp] = useState({
    name:          baseOpp?.name ?? "",
    clientId:      baseOpp?.clientId ?? "",
    stageId:       baseOpp?.stageId ?? "",
    value:         String(baseOpp?.value ?? ""),
    probability:   String(baseOpp?.probability ?? ""),
    expectedClose: baseOpp?.expectedClose ?? "",
    ownerId:       baseOpp?.ownerId ?? "",
  })

  // displayed opp name (mutated on save)
  const [oppName, setOppName] = useState(baseOpp?.name ?? "")

  // ── stage / probability / notes state ────────────────────────────────────
  const [stageId,      setStageId]      = useState(baseOpp?.stageId ?? "")
  const [probability,  setProbability]  = useState(baseOpp?.probability ?? 0)
  const [notes,        setNotes]        = useState(baseOpp?.notes ?? "")
  const [interactions, setInteractions] = useState<LocalInteraction[]>(
    demoInteractions.filter(i => i.opportunityId === oppId)
  )
  const [oppProducts, setOppProducts]   = useState<LocalOppProduct[]>(
    demoOpportunityProducts.filter(p => p.opportunityId === oppId)
  )

  // add-product dialog
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [newProduct, setNewProduct] = useState({
    productId: "", quantity: "1", unitPrice: "", discountPercent: "0",
  })

  // add-interaction dialog
  const [showIntDialog, setShowIntDialog]               = useState(false)
  const [newInt,        setNewInt]                      = useState({ ...BLANK_INT })
  const [intTemplateOpen, setIntTemplateOpen]           = useState(false)

  // edit-interaction dialog
  const [editIntTarget, setEditIntTarget]               = useState<LocalInteraction | null>(null)
  const [editIntForm,   setEditIntForm]                 = useState({ ...BLANK_INT })
  const [editIntTemplateOpen, setEditIntTemplateOpen]   = useState(false)

  // close-deal dialog
  const [showCloseDealDialog, setShowCloseDealDialog] = useState(false)
  const [closeOutcome,  setCloseOutcome]  = useState<"won" | "lost">("won")
  const [closeReasonId, setCloseReasonId] = useState("")
  const [closeDate,     setCloseDate]     = useState(new Date().toISOString().slice(0, 10))

  // ── guard ────────────────────────────────────────────────────────────────
  if (!baseOpp) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg font-medium">Szansa nie znaleziona</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Wróć
        </Button>
      </div>
    )
  }

  const client       = clientMap[baseOpp.clientId]
  const currentStage = stageMap[stageId]
  const isWon        = currentStage?.systemFlag === "won"
  const highValue    = baseOpp.value > 50000

  // ── handlers ─────────────────────────────────────────────────────────────

  function handleStageChange(newStageId: string) {
    setStageId(newStageId)
    const stage = stageMap[newStageId]
    toast({ title: `Etap zmieniony na: ${stage?.name ?? newStageId}` })
  }

  function saveNotes() {
    toast({ title: "Notatki zapisane" })
  }

  function saveOppEdit() {
    setOppName(editOpp.name)
    setStageId(editOpp.stageId)
    setProbability(Number(editOpp.probability))
    setShowEditDialog(false)
    toast({ title: "Szansa zaktualizowana" })
  }

  function saveProduct() {
    if (!newProduct.productId) return
    const prod: LocalOppProduct = {
      opportunityId:   oppId,
      productId:       newProduct.productId,
      quantity:        Number(newProduct.quantity) || 1,
      unitPrice:       Number(newProduct.unitPrice) || 0,
      discountPercent: Number(newProduct.discountPercent) || 0,
    }
    setOppProducts(prev => [...prev, prod])
    setShowProductDialog(false)
    setNewProduct({ productId: "", quantity: "1", unitPrice: "", discountPercent: "0" })
    toast({ title: "Produkt dodany" })
  }

  function handleProductSelect(productId: string) {
    const prod = productMap[productId]
    setNewProduct(p => ({
      ...p,
      productId,
      unitPrice: prod ? String(prod.price) : "",
    }))
  }

  // apply email template helper
  function applyTemplate(
    t: typeof demoEmailTemplates[number],
    setter: React.Dispatch<React.SetStateAction<typeof BLANK_INT>>,
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
      clientId:      baseOpp!.clientId,
      opportunityId: oppId,
      assignedTo:    baseOpp!.ownerId,
      createdBy:     baseOpp!.ownerId,
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
    setShowIntDialog(false)
    setNewInt({ ...BLANK_INT })
    toast({ title: "Interakcja dodana" })
  }

  function openEditInt(i: LocalInteraction) {
    setEditIntTarget(i)
    setEditIntForm({
      type:         i.type,
      title:        i.title,
      description:  i.description ?? "",
      scheduledAt:  i.scheduledAt.slice(0, 16),
      priority:     i.priority,
      emailTo:      i.emailTo ?? "",
      emailSubject: i.emailSubject ?? "",
    })
  }

  function saveEditInt() {
    if (!editIntTarget) return
    setInteractions(prev =>
      prev.map(i =>
        i.id === editIntTarget.id
          ? {
              ...i,
              type:         editIntForm.type,
              title:        editIntForm.title,
              description:  editIntForm.description,
              scheduledAt:  editIntForm.scheduledAt || i.scheduledAt,
              priority:     editIntForm.priority,
              emailTo:      editIntForm.type === "email" ? editIntForm.emailTo : i.emailTo,
              emailSubject: editIntForm.type === "email" ? editIntForm.emailSubject : i.emailSubject,
            }
          : i
      )
    )
    setEditIntTarget(null)
    toast({ title: "Interakcja zaktualizowana" })
  }

  function markIntDone(id: string) {
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

  function confirmCloseDeal() {
    const wonStageId  = "stage-004"
    const lostStageId = "stage-005"
    const newStageId  = closeOutcome === "won" ? wonStageId : lostStageId
    setStageId(newStageId)
    setProbability(closeOutcome === "won" ? 100 : 0)
    setShowCloseDealDialog(false)
    toast({
      title: closeOutcome === "won" ? "Szansa wygrana!" : "Szansa przegrana",
      description: `Etap zmieniony na: ${stageMap[newStageId]?.name}`,
    })
  }

  const filteredCloseReasons = demoCloseReasons.filter(r => r.type === closeOutcome && r.isActive)

  // ── email section component (for add/edit int dialogs) ────────────────────

  function EmailSection({
    form,
    setForm,
    popoverOpen,
    setPopoverOpen,
  }: {
    form: typeof BLANK_INT
    setForm: React.Dispatch<React.SetStateAction<typeof BLANK_INT>>
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
                {demoEmailTemplates.map(t => (
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

      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 w-fit">
        <ArrowLeft className="mr-1 h-4 w-4" />Wróć
      </Button>

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{oppName}</h1>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setEditOpp({
                  name:          oppName,
                  clientId:      baseOpp.clientId,
                  stageId,
                  value:         String(baseOpp.value),
                  probability:   String(probability),
                  expectedClose: baseOpp.expectedClose,
                  ownerId:       baseOpp.ownerId,
                })
                setShowEditDialog(true)
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          {client && (
            <Link
              href={`/platform/sales-track/clients/${baseOpp.clientId}`}
              className="text-sm text-blue-600 hover:underline w-fit"
            >
              {client.name}
            </Link>
          )}
        </div>

        {/* Stage selector + probability */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Etap:</Label>
            <Select value={stageId} onValueChange={handleStageChange}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoPipelineStages.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Label className="text-sm text-muted-foreground shrink-0">Praw.:</Label>
            <input
              type="range"
              min={0}
              max={100}
              value={probability}
              onChange={e => setProbability(Number(e.target.value))}
              className="flex-1 h-2 accent-primary"
            />
            <span className="text-sm font-medium w-10 text-right">{probability}%</span>
          </div>
          <div className="text-xl font-bold">{formatPLN(baseOpp.value)}</div>
        </div>

        {/* High value banner */}
        {highValue && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0" />
            <span>Wymaga akceptacji budżetu.</span>
            <Button asChild size="sm" variant="outline" className="ml-auto h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link href="/platform/request-flow">Przejdź do RequestFlow</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* ── Left (col-span-2) ── */}
        <div className="md:col-span-2 space-y-6">

          {/* Products card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Produkty</CardTitle>
              <Button size="sm" onClick={() => setShowProductDialog(true)}>Dodaj produkt</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead className="text-right">Ilość</TableHead>
                    <TableHead className="text-right">Cena jedn.</TableHead>
                    <TableHead className="text-right">Rabat%</TableHead>
                    <TableHead className="text-right">Wartość</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oppProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Brak produktów
                      </TableCell>
                    </TableRow>
                  ) : (
                    oppProducts.map((p, idx) => {
                      const prod      = productMap[p.productId]
                      const lineValue = p.unitPrice * p.quantity * (1 - p.discountPercent / 100)
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-sm font-medium">
                            {prod?.name ?? p.productId}
                          </TableCell>
                          <TableCell className="text-right text-sm">{p.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatPLN(p.unitPrice)}</TableCell>
                          <TableCell className="text-right text-sm">{p.discountPercent}%</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{formatPLN(lineValue)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Won banner */}
          {isWon && (
            <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-300">
              <span className="font-semibold">Szansa wygrana!</span>
              <span>Możesz utworzyć projekt w ProjectHub.</span>
              <Button asChild size="sm" variant="outline" className="ml-auto h-7 text-xs border-green-400 text-green-700 hover:bg-green-100">
                <Link href="/platform/project-hub">Utwórz projekt</Link>
              </Button>
            </div>
          )}

          {/* Interactions card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Interakcje</CardTitle>
              <Button size="sm" onClick={() => setShowIntDialog(true)}>Dodaj interakcję</Button>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak interakcji.</p>
              ) : (
                <div className="space-y-2">
                  {interactions
                    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
                    .map(i => {
                      const Icon = TYPE_ICONS[i.type] ?? FileText
                      return (
                        <div key={i.id} className="flex items-start gap-3 rounded-lg border p-3">
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">{i.title}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge
                                  variant={i.status === "done" ? "default" : "outline"}
                                  className={`text-xs ${i.status === "done" ? "bg-green-500 hover:bg-green-600" : ""}`}
                                >
                                  {i.status === "done" ? "Wykonane" : "Do zrobienia"}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {i.scheduledAt.replace("T", " ").slice(0, 16)}
                            </p>
                            {/* Action buttons */}
                            <div className="mt-2 flex gap-1.5 flex-wrap">
                              {i.status === "todo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => markIntDone(i.id)}
                                >
                                  Wykonaj
                                </Button>
                              )}
                              {i.type === "email" && i.status === "todo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => sendEmail(i.id)}
                                >
                                  <Mail className="h-3 w-3 mr-1" />Wyślij
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => openEditInt(i)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right (col-span-1) ── */}
        <div className="space-y-4">

          {/* Key info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opiekun</span>
                <span className="font-medium">{OWNER_NAMES[baseOpp.ownerId] ?? baseOpp.ownerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data zamknięcia</span>
                <span className="font-medium">{baseOpp.expectedClose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ostatnia aktywność</span>
                <span className="font-medium">{baseOpp.lastActivity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs text-muted-foreground">{baseOpp.id}</span>
              </div>
            </CardContent>
          </Card>

          {/* Inactivity banner */}
          {baseOpp.inactivityFlag === "red" && (
            <div className="rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Brak aktywności — wymagana natychmiastowa reakcja</span>
            </div>
          )}
          {baseOpp.inactivityFlag === "amber" && (
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Brak aktywności — sprawdź status szansy</span>
            </div>
          )}

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                rows={5}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notatki dotyczące szansy…"
              />
              <Button size="sm" onClick={saveNotes} className="w-full">Zapisz notatki</Button>
            </CardContent>
          </Card>

          {/* Close deal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Zamknij szansę</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { setCloseOutcome("won"); setShowCloseDealDialog(true) }}
              >
                Wygraj
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => { setCloseOutcome("lost"); setShowCloseDealDialog(true) }}
              >
                Przegraj
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Edit Opportunity Dialog ── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edytuj szansę</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Nazwa</Label>
              <Input
                value={editOpp.name}
                onChange={e => setEditOpp(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Klient</Label>
              <Select value={editOpp.clientId} onValueChange={v => setEditOpp(p => ({ ...p, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                <SelectContent>
                  {demoClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Etap</Label>
              <Select value={editOpp.stageId} onValueChange={v => setEditOpp(p => ({ ...p, stageId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {demoPipelineStages.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Wartość (PLN)</Label>
              <Input
                type="number"
                value={editOpp.value}
                onChange={e => setEditOpp(p => ({ ...p, value: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Prawdopodobieństwo (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editOpp.probability}
                onChange={e => setEditOpp(p => ({ ...p, probability: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Data zamknięcia</Label>
              <Input
                type="date"
                value={editOpp.expectedClose}
                onChange={e => setEditOpp(p => ({ ...p, expectedClose: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Opiekun</Label>
              <Select value={editOpp.ownerId} onValueChange={v => setEditOpp(p => ({ ...p, ownerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Wybierz opiekuna" /></SelectTrigger>
                <SelectContent>
                  {demoOwners.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Anuluj</Button>
            <Button onClick={saveOppEdit}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Product Dialog ── */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj produkt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Produkt</Label>
              <Select value={newProduct.productId} onValueChange={handleProductSelect}>
                <SelectTrigger><SelectValue placeholder="Wybierz produkt" /></SelectTrigger>
                <SelectContent>
                  {demoProducts.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Ilość</Label>
                <Input type="number" min={1} value={newProduct.quantity}
                  onChange={e => setNewProduct(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Cena (PLN)</Label>
                <Input type="number" value={newProduct.unitPrice}
                  onChange={e => setNewProduct(p => ({ ...p, unitPrice: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Rabat %</Label>
                <Input type="number" min={0} max={100} value={newProduct.discountPercent}
                  onChange={e => setNewProduct(p => ({ ...p, discountPercent: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Anuluj</Button>
            <Button onClick={saveProduct}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Interaction Dialog ── */}
      <Dialog open={showIntDialog} onOpenChange={setShowIntDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj interakcję</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select
                value={newInt.type}
                onValueChange={v => setNewInt(p => ({
                  ...p,
                  type: v as InteractionType,
                  emailTo: "",
                  emailSubject: "",
                }))}
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
            {newInt.type === "email" ? (
              <EmailSection
                form={newInt}
                setForm={setNewInt}
                popoverOpen={intTemplateOpen}
                setPopoverOpen={setIntTemplateOpen}
              />
            ) : (
              <div className="space-y-1">
                <Label>Opis</Label>
                <Textarea rows={3} value={newInt.description}
                  onChange={e => setNewInt(p => ({ ...p, description: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntDialog(false)}>Anuluj</Button>
            <Button onClick={saveInteraction}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Interaction Dialog ── */}
      <Dialog open={editIntTarget !== null} onOpenChange={open => { if (!open) setEditIntTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj interakcję</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select
                value={editIntForm.type}
                onValueChange={v => setEditIntForm(p => ({
                  ...p,
                  type: v as InteractionType,
                  emailTo: "",
                  emailSubject: "",
                }))}
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
              <Input value={editIntForm.title}
                onChange={e => setEditIntForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data i czas</Label>
              <Input type="datetime-local" value={editIntForm.scheduledAt}
                onChange={e => setEditIntForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Priorytet</Label>
              <Select
                value={editIntForm.priority}
                onValueChange={v => setEditIntForm(p => ({ ...p, priority: v as "low" | "medium" | "high" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editIntForm.type === "email" ? (
              <EmailSection
                form={editIntForm}
                setForm={setEditIntForm}
                popoverOpen={editIntTemplateOpen}
                setPopoverOpen={setEditIntTemplateOpen}
              />
            ) : (
              <div className="space-y-1">
                <Label>Opis</Label>
                <Textarea rows={3} value={editIntForm.description}
                  onChange={e => setEditIntForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIntTarget(null)}>Anuluj</Button>
            <Button onClick={saveEditInt}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Close Deal Dialog ── */}
      <Dialog open={showCloseDealDialog} onOpenChange={setShowCloseDealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamknij szansę</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Wynik</Label>
              <RadioGroup
                value={closeOutcome}
                onValueChange={v => {
                  setCloseOutcome(v as "won" | "lost")
                  setCloseReasonId("")
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="won" id="outcome-won" />
                  <Label htmlFor="outcome-won" className="text-green-700 font-medium cursor-pointer">
                    Wygrana
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="lost" id="outcome-lost" />
                  <Label htmlFor="outcome-lost" className="text-red-700 font-medium cursor-pointer">
                    Przegrana
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-1">
              <Label>Powód zamknięcia</Label>
              <Select value={closeReasonId} onValueChange={setCloseReasonId}>
                <SelectTrigger><SelectValue placeholder="Wybierz powód" /></SelectTrigger>
                <SelectContent>
                  {filteredCloseReasons.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data zamknięcia</Label>
              <Input type="date" value={closeDate}
                onChange={e => setCloseDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDealDialog(false)}>Anuluj</Button>
            <Button
              onClick={confirmCloseDeal}
              className={closeOutcome === "won"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}
            >
              Potwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
