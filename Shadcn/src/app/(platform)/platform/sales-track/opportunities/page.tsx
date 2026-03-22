"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  demoOpportunities,
  demoPipelineStages,
  demoClients,
  demoOwners,
  OWNER_NAMES,
  clientMap,
  stageMap,
  type InactivityFlag,
} from "@/lib/demo/sales-data"
import { isDemoMode } from "@/lib/demo/data"
import { fetchOpportunities, fetchPipelineStages, fetchClients, fetchOwners } from "@/lib/supabase/salestrack"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Flame, Plus, ExternalLink } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string
  name: string
  clientId: string
  clientName?: string
  stageId: string
  stageName?: string
  stageColor?: string
  ownerId: string
  ownerName?: string
  value: number
  probability: number
  expectedClose: string
  lastActivity: string
  inactivityFlag: InactivityFlag
  notes: string
}

interface NewOpportunityForm {
  name: string
  clientId: string
  stageId: string
  value: string
  probability: string
  ownerId: string
  expectedClose: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPLN = (v: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(v)

function FlameIcon({ flag }: { flag: InactivityFlag }) {
  if (!flag) return null
  return (
    <Flame
      className={`w-4 h-4 inline-block ${
        flag === "red" ? "text-red-500 fill-red-500" : "text-amber-400 fill-amber-400"
      }`}
    />
  )
}

function StageDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

// ─── Kanban Card (draggable) ──────────────────────────────────────────────────

function KanbanCard({ op }: { op: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: op.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const clientName = op.clientName ?? clientMap[op.clientId]?.name ?? op.clientId
  const ownerInitials = (op.ownerName ?? OWNER_NAMES[op.ownerId] ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium leading-snug">{op.name}</p>
        {op.inactivityFlag && <FlameIcon flag={op.inactivityFlag} />}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{clientName}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold">{formatPLN(op.value)}</span>
        <span className="text-xs text-muted-foreground">{op.probability}%</span>
      </div>
      <div className="mt-2 flex justify-end">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
          {ownerInitials}
        </span>
      </div>
    </div>
  )
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm: NewOpportunityForm = {
  name: "",
  clientId: "",
  stageId: "",
  value: "",
  probability: "20",
  ownerId: "",
  expectedClose: "",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    isDemoMode ? (demoOpportunities as Opportunity[]) : []
  )
  const [stages, setStages] = useState(isDemoMode ? demoPipelineStages : [])
  const [clients, setClients] = useState(isDemoMode ? demoClients : [])
  const [owners, setOwners] = useState(isDemoMode ? demoOwners : [])
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [form, setForm] = useState<NewOpportunityForm>(defaultForm)

  useEffect(() => {
    if (isDemoMode) return
    Promise.all([fetchOpportunities(), fetchPipelineStages(), fetchClients(), fetchOwners()]).then(
      ([opps, stgs, clts, ownrs]) => {
        setOpportunities(opps as Opportunity[])
        setStages(stgs as typeof demoPipelineStages)
        setClients(clts as typeof demoClients)
        setOwners(ownrs)
      }
    )
  }, [])

  // build local lookup maps from state (works for both demo and production)
  const localClientMap = Object.fromEntries(clients.map(c => [c.id, c]))
  const localStageMap  = Object.fromEntries(stages.map(s => [s.id, s]))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // ── In-progress stages for kanban columns ────────────────────────────────
  const kanbanStages = stages.filter((s) => s.systemFlag === "in_progress")

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = opportunities.filter((op) => {
    const matchStage = stageFilter === "all" || op.stageId === stageFilter
    const matchOwner = ownerFilter === "all" || op.ownerId === ownerFilter
    return matchStage && matchOwner
  })

  // ── Drag end ─────────────────────────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    // over.id can be either another card id or a column (stage) id
    const overId = String(over.id)
    const activeId = String(active.id)

    // Determine target stageId: if dropped on a column droppable or a card in that column
    let targetStageId: string | null = null

    // Check if overId is a stage id (column droppable)
    if (localStageMap[overId]) {
      targetStageId = overId
    } else {
      // overId is a card id — find its stage
      const overOp = opportunities.find((o) => o.id === overId)
      if (overOp) targetStageId = overOp.stageId
    }

    if (!targetStageId) return

    const activeOp = opportunities.find((o) => o.id === activeId)
    if (!activeOp || activeOp.stageId === targetStageId) return

    setOpportunities((prev) =>
      prev.map((op) => (op.id === activeId ? { ...op, stageId: targetStageId! } : op))
    )
    const stageName = localStageMap[targetStageId]?.name ?? targetStageId
    toast({ title: `Etap zmieniony na: ${stageName}` })
  }

  // ── Add opportunity ───────────────────────────────────────────────────────
  function handleAdd() {
    if (!form.name.trim()) return
    const newOp: Opportunity = {
      id: `op-${Date.now()}`,
      name: form.name.trim(),
      clientId: form.clientId,
      stageId: form.stageId,
      ownerId: form.ownerId,
      value: parseFloat(form.value) || 0,
      probability: parseInt(form.probability, 10) || 0,
      expectedClose: form.expectedClose,
      lastActivity: new Date().toISOString().slice(0, 10),
      inactivityFlag: null,
      notes: "",
    }
    setOpportunities((prev) => [newOp, ...prev])
    setShowAddDialog(false)
    setForm(defaultForm)
    toast({ title: "Szansa dodana", description: newOp.name })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Szanse sprzedażowe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} z {opportunities.length} szans
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj szansę
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie etapy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie etapy</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszyscy opiekunowie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy opiekunowie</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* ── TABLE VIEW ── */}
        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Etap</TableHead>
                    <TableHead>Wartość</TableHead>
                    <TableHead>Prawdop.</TableHead>
                    <TableHead>Opiekun</TableHead>
                    <TableHead>Zamknięcie</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground py-10"
                      >
                        Brak wyników
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((op) => {
                    const client = localClientMap[op.clientId]
                    const stage = localStageMap[op.stageId]
                    return (
                      <TableRow key={op.id}>
                        <TableCell className="font-medium">{op.name}</TableCell>
                        <TableCell className="text-sm">
                          {client?.name ?? op.clientId}
                        </TableCell>
                        <TableCell>
                          {stage ? (
                            <span className="inline-flex items-center text-sm">
                              <StageDot color={stage.color} />
                              {stage.name}
                            </span>
                          ) : (
                            op.stageId
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatPLN(op.value)}
                        </TableCell>
                        <TableCell className="text-sm">{op.probability}%</TableCell>
                        <TableCell className="text-sm">
                          {op.ownerName ?? OWNER_NAMES[op.ownerId] ?? op.ownerId}
                        </TableCell>
                        <TableCell className="text-sm">{op.expectedClose}</TableCell>
                        <TableCell>
                          <FlameIcon flag={op.inactivityFlag} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/platform/sales-track/opportunities/${op.id}`
                              )
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Otwórz
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KANBAN VIEW ── */}
        <TabsContent value="kanban">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanStages.map((stage) => {
                const columnOps = opportunities.filter(
                  (op) => op.stageId === stage.id
                )
                const totalValue = columnOps.reduce((s, o) => s + o.value, 0)

                return (
                  <div
                    key={stage.id}
                    className="flex flex-col min-w-[260px] max-w-[280px] bg-muted/40 rounded-xl p-3 gap-3"
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2">
                      <StageDot color={stage.color} />
                      <span className="font-semibold text-sm">{stage.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {columnOps.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">
                      {formatPLN(totalValue)}
                    </p>

                    {/* Cards */}
                    <SortableContext
                      items={columnOps.map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2 min-h-[60px]">
                        {columnOps.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                            Upuść tutaj
                          </div>
                        )}
                        {columnOps.map((op) => (
                          <KanbanCard key={op.id} op={op} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                )
              })}
            </div>
          </DndContext>
        </TabsContent>
      </Tabs>

      {/* Add Opportunity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj szansę sprzedażową</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Nazwa */}
            <div className="grid gap-1.5">
              <Label htmlFor="op-name">Nazwa *</Label>
              <Input
                id="op-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nazwa szansy"
              />
            </div>
            {/* Klient */}
            <div className="grid gap-1.5">
              <Label>Klient</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Etap */}
            <div className="grid gap-1.5">
              <Label>Etap</Label>
              <Select
                value={form.stageId}
                onValueChange={(v) => setForm((f) => ({ ...f, stageId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Wartość + Prawdopodobieństwo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="op-value">Wartość (PLN)</Label>
                <Input
                  id="op-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="op-prob">Prawdopodobieństwo (%)</Label>
                <Input
                  id="op-prob"
                  type="number"
                  min={0}
                  max={100}
                  value={form.probability}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, probability: e.target.value }))
                  }
                  placeholder="20"
                />
              </div>
            </div>
            {/* Opiekun */}
            <div className="grid gap-1.5">
              <Label>Opiekun</Label>
              <Select
                value={form.ownerId}
                onValueChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Data zamknięcia */}
            <div className="grid gap-1.5">
              <Label htmlFor="op-close">Data zamknięcia</Label>
              <Input
                id="op-close"
                type="date"
                value={form.expectedClose}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedClose: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
