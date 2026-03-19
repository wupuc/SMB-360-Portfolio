"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plane, Home, Briefcase, Clock, Monitor, DollarSign, GraduationCap,
  Plus, Pencil, ChevronRight, CalendarDays, FileText, Trash2, X,
} from "lucide-react"
import {
  requestTypeLabels, requestTypeColors, demoApprovalPaths as initialApprovalPaths,
  type DemoRequestType, type DemoApprovalPath,
} from "@/lib/demo/data"

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeMeta = { icon: React.ReactNode; fields: string[]; path: string }
type PathStep = { order: number; role: string; type: "sequential" | "parallel" }

const ROLE_OPTIONS = [
  "Bezpośredni przełożony",
  "Kierownik HR",
  "Dyrektor",
  "CEO",
]

const STEP_TYPE_OPTIONS: { value: "sequential" | "parallel"; label: string }[] = [
  { value: "sequential", label: "Sekwencyjny" },
  { value: "parallel",   label: "Równoległy" },
]

// ─── Initial TYPE_META ────────────────────────────────────────────────────────

const initialTypeMeta: Record<DemoRequestType, TypeMeta> = {
  vacation:       { icon: <Plane className="h-4 w-4" />,         fields: ["Rodzaj urlopu","Data od","Data do","Uwagi","Załączniki"],                                          path: "path-001" },
  home_office:    { icon: <Home className="h-4 w-4" />,          fields: ["Lokalizacja","Data od","Data do","Uwagi","Załączniki"],                                            path: "path-002" },
  business_trip:  { icon: <Briefcase className="h-4 w-4" />,     fields: ["Cel podróży","Miejsce","Transport","Budżet","Data od","Data do","Uwagi","Załączniki"],              path: "path-002" },
  overtime:       { icon: <Clock className="h-4 w-4" />,         fields: ["Powód","Liczba godzin","Data od","Data do","Uwagi","Załączniki"],                                   path: "path-004" },
  equipment:      { icon: <Monitor className="h-4 w-4" />,       fields: ["Opis sprzętu","Ilość","Cena jednostkowa","Uzasadnienie","Uwagi","Załączniki"],                      path: "path-003" },
  budget_request: { icon: <DollarSign className="h-4 w-4" />,    fields: ["Dział","Kategoria kosztu","Kwota","Uzasadnienie","Uwagi","Załączniki"],                            path: "path-003" },
  training_course:{ icon: <GraduationCap className="h-4 w-4" />, fields: ["Nazwa kursu","Organizator","Format","Koszt","Link","Uwagi","Załączniki"],                          path: "path-004" },
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RequestFlowSettingsPage() {
  const { toast } = useToast()

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"types" | "paths">("types")

  // ── Types state ────────────────────────────────────────────────────────────
  const [typeMeta, setTypeMeta] = useState<Record<DemoRequestType, TypeMeta>>(initialTypeMeta)
  const [activeTypes, setActiveTypes] = useState<Record<DemoRequestType, boolean>>(
    Object.fromEntries(Object.keys(requestTypeLabels).map(k => [k, true])) as Record<DemoRequestType, boolean>
  )
  const [detailType, setDetailType] = useState<DemoRequestType | null>(null)

  // ── New type dialog ────────────────────────────────────────────────────────
  const [newTypeOpen, setNewTypeOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState("")
  const [newTypePath, setNewTypePath] = useState("")

  // ── Field config dialog ────────────────────────────────────────────────────
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false)
  const [editingFields, setEditingFields] = useState<string[]>([])
  const [newFieldName, setNewFieldName] = useState("")

  // ── Approval paths state ───────────────────────────────────────────────────
  const [approvalPaths, setApprovalPaths] = useState<DemoApprovalPath[]>(initialApprovalPaths)

  // ── Path dialog ────────────────────────────────────────────────────────────
  const [pathDialogOpen, setPathDialogOpen] = useState(false)
  const [editingPath, setEditingPath] = useState<DemoApprovalPath | null>(null)
  const [pathName, setPathName] = useState("")
  const [pathSteps, setPathSteps] = useState<PathStep[]>([])
  const [pathLinkedTypes, setPathLinkedTypes] = useState<DemoRequestType[]>([])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleType(type: DemoRequestType) {
    setActiveTypes(prev => ({ ...prev, [type]: !prev[type] }))
    toast({ title: activeTypes[type] ? `Dezaktywowano: ${requestTypeLabels[type]}` : `Aktywowano: ${requestTypeLabels[type]}` })
  }

  const pathById = Object.fromEntries(approvalPaths.map(p => [p.id, p]))

  // ── New type handlers ──────────────────────────────────────────────────────

  function openNewType() {
    setNewTypeName("")
    setNewTypePath(approvalPaths[0]?.id ?? "")
    setNewTypeOpen(true)
  }

  function submitNewType() {
    const trimmed = newTypeName.trim()
    if (!trimmed) return
    const key = `custom_${Date.now()}` as DemoRequestType
    setTypeMeta(prev => ({
      ...prev,
      [key]: { icon: <FileText className="h-4 w-4" />, fields: [], path: newTypePath },
    }))
    setActiveTypes(prev => ({ ...prev, [key]: true }))
    setNewTypeOpen(false)
    toast({ title: "Typ wniosku dodany" })
  }

  // ── Field config handlers ──────────────────────────────────────────────────

  function openFieldConfig() {
    if (!detailType) return
    setEditingFields([...typeMeta[detailType].fields])
    setNewFieldName("")
    setFieldConfigOpen(true)
  }

  function addField() {
    const trimmed = newFieldName.trim()
    if (!trimmed) return
    setEditingFields(prev => [...prev, trimmed])
    setNewFieldName("")
  }

  function removeField(index: number) {
    setEditingFields(prev => prev.filter((_, i) => i !== index))
  }

  function saveFields() {
    if (!detailType) return
    setTypeMeta(prev => ({
      ...prev,
      [detailType]: { ...prev[detailType], fields: editingFields },
    }))
    setFieldConfigOpen(false)
    toast({ title: "Pola formularza zaktualizowane" })
  }

  // ── Path dialog handlers ───────────────────────────────────────────────────

  function openNewPath() {
    setEditingPath(null)
    setPathName("")
    setPathSteps([{ order: 1, role: ROLE_OPTIONS[0], type: "sequential" }])
    setPathLinkedTypes([])
    setPathDialogOpen(true)
  }

  function openEditPath(path: DemoApprovalPath) {
    setEditingPath(path)
    setPathName(path.name)
    setPathSteps(path.steps.map(s => ({ ...s })))
    setPathLinkedTypes([...path.linkedTypes])
    setPathDialogOpen(true)
  }

  function addStep() {
    setPathSteps(prev => [
      ...prev,
      { order: prev.length + 1, role: ROLE_OPTIONS[0], type: "sequential" },
    ])
  }

  function removeStep(index: number) {
    setPathSteps(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  function updateStep(index: number, field: keyof PathStep, value: string | number) {
    setPathSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function toggleLinkedType(type: DemoRequestType) {
    setPathLinkedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function submitPath() {
    const trimmed = pathName.trim()
    if (!trimmed) return
    if (editingPath) {
      setApprovalPaths(prev =>
        prev.map(p =>
          p.id === editingPath.id
            ? { ...p, name: trimmed, steps: pathSteps, linkedTypes: pathLinkedTypes }
            : p
        )
      )
      toast({ title: "Ścieżka akceptacji zaktualizowana" })
    } else {
      const newPath: DemoApprovalPath = {
        id: `path-${Date.now()}`,
        name: trimmed,
        steps: pathSteps,
        linkedTypes: pathLinkedTypes,
        isActive: true,
      }
      setApprovalPaths(prev => [...prev, newPath])
      toast({ title: "Ścieżka akceptacji dodana" })
    }
    setPathDialogOpen(false)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Request Flow — konfiguracja</h2>
          <p className="text-sm text-muted-foreground">Typy wniosków, ścieżki akceptacji i limity urlopowe</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/settings/request-flow/leave-entitlements">
            <CalendarDays className="mr-2 h-4 w-4" />
            Limity urlopowe
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["types", "paths"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "types" ? "Typy wniosków" : "Ścieżki akceptacji"}
          </button>
        ))}
      </div>

      {/* ── Tab: Types ─────────────────────────────────────────────────────── */}
      {tab === "types" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={openNewType}>
              <Plus className="mr-2 h-4 w-4" />Nowy typ wniosku
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_180px_120px_80px_80px] gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Typ wniosku</span>
                <span>Ścieżka akceptacji</span>
                <span>Pola formularza</span>
                <span>Status</span>
                <span></span>
              </div>
              <div className="divide-y">
                {(Object.keys(requestTypeLabels) as DemoRequestType[]).map(type => {
                  const meta = typeMeta[type]
                  if (!meta) return null
                  const path = pathById[meta.path]
                  const isActive = activeTypes[type]
                  return (
                    <div key={type} className="grid grid-cols-1 md:grid-cols-[1fr_180px_120px_80px_80px] gap-3 md:gap-4 items-center px-6 py-4">
                      {/* Type */}
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center rounded-md p-1.5 ${requestTypeColors[type]}`}>
                          {meta.icon}
                        </span>
                        <span className="font-medium text-sm">{requestTypeLabels[type]}</span>
                      </div>
                      {/* Path */}
                      <span className="text-sm text-muted-foreground hidden md:block">
                        {path?.name ?? "—"}
                      </span>
                      {/* Fields count */}
                      <span className="text-sm text-muted-foreground hidden md:block">
                        {meta.fields.length} pól
                      </span>
                      {/* Active toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleType(type)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            isActive ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            isActive ? "translate-x-4" : "translate-x-0.5"
                          }`} />
                        </button>
                        <span className="text-xs text-muted-foreground md:hidden">{isActive ? "Aktywny" : "Nieaktywny"}</span>
                      </div>
                      {/* Edit */}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                        onClick={() => setDetailType(type)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── New type dialog ──────────────────────────────────────────── */}
          <Dialog open={newTypeOpen} onOpenChange={setNewTypeOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nowy typ wniosku</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-type-name">Nazwa</Label>
                  <Input
                    id="new-type-name"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    placeholder="np. Wniosek o zmianę stanowiska"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-type-path">Ścieżka akceptacji</Label>
                  <Select value={newTypePath} onValueChange={setNewTypePath}>
                    <SelectTrigger id="new-type-path">
                      <SelectValue placeholder="Wybierz ścieżkę…" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalPaths.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewTypeOpen(false)}>Anuluj</Button>
                <Button onClick={submitNewType} disabled={!newTypeName.trim()}>Dodaj typ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Type detail dialog ───────────────────────────────────────── */}
          <Dialog open={detailType !== null} onOpenChange={() => setDetailType(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {detailType && requestTypeLabels[detailType]}
                </DialogTitle>
              </DialogHeader>
              {detailType && (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pola formularza</p>
                    <ul className="space-y-1">
                      {typeMeta[detailType].fields.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                          <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Przypisana ścieżka</p>
                    <p className="text-muted-foreground">{pathById[typeMeta[detailType].path]?.name ?? "—"}</p>
                  </div>
                  <Button className="w-full" variant="outline" onClick={openFieldConfig}>
                    Konfiguruj pola formularza
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── Field config dialog ──────────────────────────────────────── */}
          <Dialog open={fieldConfigOpen} onOpenChange={setFieldConfigOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Pola formularza — {detailType && requestTypeLabels[detailType]}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {editingFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Brak pól. Dodaj pierwsze pole poniżej.</p>
                )}
                <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                  {editingFields.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                      <span className="text-muted-foreground text-xs w-4 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-sm">{f}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeField(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newFieldName}
                    onChange={e => setNewFieldName(e.target.value)}
                    placeholder="Nazwa pola…"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addField() } }}
                  />
                  <Button variant="outline" onClick={addField} disabled={!newFieldName.trim()}>
                    Dodaj pole
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFieldConfigOpen(false)}>Anuluj</Button>
                <Button onClick={saveFields}>Zapisz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ── Tab: Approval paths ─────────────────────────────────────────────── */}
      {tab === "paths" && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={openNewPath}>
              <Plus className="mr-2 h-4 w-4" />Nowa ścieżka
            </Button>
          </div>

          <div className="grid gap-4">
            {approvalPaths.map(path => (
              <ApprovalPathCard key={path.id} path={path} onEdit={() => openEditPath(path)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Path create / edit dialog ──────────────────────────────────────── */}
      <Dialog open={pathDialogOpen} onOpenChange={setPathDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPath ? "Edytuj ścieżkę akceptacji" : "Nowa ścieżka akceptacji"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Path name */}
            <div className="space-y-1.5">
              <Label htmlFor="path-name">Nazwa ścieżki</Label>
              <Input
                id="path-name"
                value={pathName}
                onChange={e => setPathName(e.target.value)}
                placeholder="np. Ścieżka standardowa"
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kroki akceptacji</p>
              {pathSteps.length === 0 && (
                <p className="text-sm text-muted-foreground">Brak kroków. Dodaj pierwszy krok poniżej.</p>
              )}
              <div className="space-y-2">
                {pathSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {step.order}
                    </span>
                    <Select
                      value={step.role}
                      onValueChange={val => updateStep(i, "role", val)}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={step.type}
                      onValueChange={val => updateStep(i, "type", val as "sequential" | "parallel")}
                    >
                      <SelectTrigger className="w-36 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEP_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStep(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Dodaj krok
              </Button>
            </div>

            {/* Linked types */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Powiązane typy wniosków</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(requestTypeLabels) as DemoRequestType[]).map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={pathLinkedTypes.includes(type)}
                      onCheckedChange={() => toggleLinkedType(type)}
                    />
                    <span className="text-sm">{requestTypeLabels[type]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPathDialogOpen(false)}>Anuluj</Button>
            <Button onClick={submitPath} disabled={!pathName.trim()}>
              {editingPath ? "Zapisz zmiany" : "Dodaj ścieżkę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Approval path card ───────────────────────────────────────────────────────

function ApprovalPathCard({ path, onEdit }: { path: DemoApprovalPath; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{path.name}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-1">
              {path.linkedTypes.map(t => (
                <span key={t} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestTypeColors[t]}`}>
                  {requestTypeLabels[t]}
                </span>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />Edytuj
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center flex-wrap gap-2">
          {path.steps.map((step, i) => (
            <div key={step.order} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {step.order}
                </span>
                <span className="font-medium">{step.role}</span>
                <Badge variant="outline" className="ml-1 text-xs py-0">
                  {step.type === "sequential" ? "sekwencyjny" : "równoległy"}
                </Badge>
              </div>
              {i < path.steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
