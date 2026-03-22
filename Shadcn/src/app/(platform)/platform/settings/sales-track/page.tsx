"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  demoPipelineStages,
  demoCloseReasons,
  demoInactivityThresholds,
  demoProducts,
  demoEmailTemplates,
  type SystemFlag,
} from "@/lib/demo/sales-data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, GripVertical, ArrowUp, ArrowDown, Edit2 } from "lucide-react"

// ─── Local types ──────────────────────────────────────────────────────────────

type PipelineStage = {
  id: string
  name: string
  order: number
  systemFlag: SystemFlag
  color: string
  probability: number
  isActive: boolean
}

type CloseReason = {
  id: string
  name: string
  type: "won" | "lost"
  isActive: boolean
}

type InactivityThresholds = {
  amberDays: number
  redDays: number
}

type Product = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  currency: string
  isActive: boolean
  description: string
}

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  isShared: boolean
  createdBy: string
}

// Stages that have linked opportunities in demo data
const STAGES_WITH_OPPORTUNITIES = new Set(["stage-001", "stage-002", "stage-003"])

const SYSTEM_FLAG_LABELS: Record<SystemFlag, string> = {
  in_progress: "W toku",
  won: "Wygrany",
  lost: "Przegrany",
  on_hold: "Wstrzymany",
}

// ─── Tab 1: Etapy pipeline ────────────────────────────────────────────────────

function PipelineStagesTab() {
  const { toast } = useToast()
  const [stages, setStages] = useState<PipelineStage[]>(
    demoPipelineStages.map((s) => ({ ...s }))
  )
  const [addOpen, setAddOpen] = useState(false)
  const [newStage, setNewStage] = useState<{
    name: string
    color: string
    systemFlag: SystemFlag
    probability: number
  }>({ name: "", color: "#6366f1", systemFlag: "in_progress", probability: 20 })

  function moveStage(index: number, direction: "up" | "down") {
    const next = [...stages]
    const swapIdx = direction === "up" ? index - 1 : index + 1
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    setStages(next)
  }

  function updateStage(id: string, patch: Partial<PipelineStage>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function deleteStage(id: string) {
    setStages((prev) => prev.filter((s) => s.id !== id))
    toast({ title: "Etap usunięty" })
  }

  function handleAddStage() {
    const id = `stage-${Date.now()}`
    setStages((prev) => [
      ...prev,
      {
        id,
        name: newStage.name,
        order: prev.length + 1,
        systemFlag: newStage.systemFlag,
        color: newStage.color,
        probability: newStage.probability,
        isActive: true,
      },
    ])
    setNewStage({ name: "", color: "#6366f1", systemFlag: "in_progress", probability: 20 })
    setAddOpen(false)
    toast({ title: "Etap dodany", description: newStage.name })
  }

  function handleSaveOrder() {
    toast({ title: "Kolejność zapisana" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Etapy pipeline</CardTitle>
          <CardDescription>
            Zarządzaj etapami lejka sprzedaży — kolejność, kolory i prawdopodobieństwo.
          </CardDescription>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleSaveOrder}>
            Zapisz kolejność
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Dodaj etap
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowy etap pipeline</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nazwa</Label>
                  <Input
                    value={newStage.name}
                    onChange={(e) => setNewStage((p) => ({ ...p, name: e.target.value }))}
                    placeholder="np. Analiza potrzeb"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Kolor</Label>
                  <input
                    type="color"
                    value={newStage.color}
                    onChange={(e) => setNewStage((p) => ({ ...p, color: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input cursor-pointer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Flaga systemowa</Label>
                  <Select
                    value={newStage.systemFlag}
                    onValueChange={(v) =>
                      setNewStage((p) => ({ ...p, systemFlag: v as SystemFlag }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SYSTEM_FLAG_LABELS) as SystemFlag[]).map((f) => (
                        <SelectItem key={f} value={f}>
                          {SYSTEM_FLAG_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prawdopodobieństwo (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newStage.probability}
                    onChange={(e) =>
                      setNewStage((p) => ({ ...p, probability: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleAddStage} disabled={!newStage.name.trim()}>
                  Dodaj
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const hasOpportunities = STAGES_WITH_OPPORTUNITIES.has(stage.id)
            return (
              <div
                key={stage.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === 0}
                    onClick={() => moveStage(index, "up")}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, "down")}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Name */}
                <Input
                  value={stage.name}
                  onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                  className="h-8 w-36 shrink-0"
                />

                {/* Color */}
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                  className="h-8 w-10 rounded-md border border-input cursor-pointer shrink-0"
                  title="Kolor etapu"
                />

                {/* System flag */}
                <Select
                  value={stage.systemFlag}
                  onValueChange={(v) => updateStage(stage.id, { systemFlag: v as SystemFlag })}
                >
                  <SelectTrigger className="h-8 w-36 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SYSTEM_FLAG_LABELS) as SystemFlag[]).map((f) => (
                      <SelectItem key={f} value={f}>
                        {SYSTEM_FLAG_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Probability */}
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={stage.probability}
                    onChange={(e) =>
                      updateStage(stage.id, { probability: Number(e.target.value) })
                    }
                    className="h-8 w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>

                {/* Active toggle */}
                <Switch
                  checked={stage.isActive}
                  onCheckedChange={(v) => updateStage(stage.id, { isActive: v })}
                />

                {/* Delete */}
                <div title={hasOpportunities ? "Etap ma powiązane szanse" : undefined}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    disabled={hasOpportunities}
                    onClick={() => deleteStage(stage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab 2: Powody zamknięcia ─────────────────────────────────────────────────

function CloseReasonsTab() {
  const { toast } = useToast()
  const [reasons, setReasons] = useState<CloseReason[]>(
    demoCloseReasons.map((r) => ({ ...r }))
  )
  const [wonOpen, setWonOpen] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)
  const [newReasonName, setNewReasonName] = useState("")

  function updateReason(id: string, patch: Partial<CloseReason>) {
    setReasons((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function deleteReason(id: string) {
    setReasons((prev) => prev.filter((r) => r.id !== id))
    toast({ title: "Powód usunięty" })
  }

  function addReason(type: "won" | "lost") {
    const id = `cr-${Date.now()}`
    setReasons((prev) => [
      ...prev,
      { id, name: newReasonName, type, isActive: true },
    ])
    toast({ title: "Powód dodany", description: newReasonName })
    setNewReasonName("")
    if (type === "won") setWonOpen(false)
    else setLostOpen(false)
  }

  function ReasonRow({ reason }: { reason: CloseReason }) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Input
          value={reason.name}
          onChange={(e) => updateReason(reason.id, { name: e.target.value })}
          className="h-8 flex-1"
        />
        <Switch
          checked={reason.isActive}
          onCheckedChange={(v) => updateReason(reason.id, { isActive: v })}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
          onClick={() => deleteReason(reason.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  function AddReasonDialog({
    open,
    onOpenChange,
    type,
  }: {
    open: boolean
    onOpenChange: (v: boolean) => void
    type: "won" | "lost"
  }) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Dodaj powód
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nowy powód — {type === "won" ? "wygrana" : "przegrana"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nazwa</Label>
              <Input
                value={newReasonName}
                onChange={(e) => setNewReasonName(e.target.value)}
                placeholder="np. Długi czas wdrożenia"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => addReason(type)}
              disabled={!newReasonName.trim()}
            >
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const wonReasons = reasons.filter((r) => r.type === "won")
  const lostReasons = reasons.filter((r) => r.type === "lost")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Powody zamknięcia</CardTitle>
        <CardDescription>
          Definiuj powody wygranych i przegranych szans sprzedaży.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        {/* Won */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400">
                Wygrane szanse
              </Badge>
            </h3>
            <AddReasonDialog
              open={wonOpen}
              onOpenChange={(v) => {
                setWonOpen(v)
                if (!v) setNewReasonName("")
              }}
              type="won"
            />
          </div>
          <div className="space-y-2">
            {wonReasons.map((r) => (
              <ReasonRow key={r.id} reason={r} />
            ))}
            {wonReasons.length === 0 && (
              <p className="text-sm text-muted-foreground">Brak powodów.</p>
            )}
          </div>
        </div>

        {/* Lost */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Badge className="bg-red-500/15 text-red-700 border-red-200 dark:text-red-400">
                Przegrane szanse
              </Badge>
            </h3>
            <AddReasonDialog
              open={lostOpen}
              onOpenChange={(v) => {
                setLostOpen(v)
                if (!v) setNewReasonName("")
              }}
              type="lost"
            />
          </div>
          <div className="space-y-2">
            {lostReasons.map((r) => (
              <ReasonRow key={r.id} reason={r} />
            ))}
            {lostReasons.length === 0 && (
              <p className="text-sm text-muted-foreground">Brak powodów.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab 3: Progi nieaktywności ───────────────────────────────────────────────

function InactivityThresholdsTab() {
  const { toast } = useToast()
  const [thresholds, setThresholds] = useState<InactivityThresholds>({
    ...demoInactivityThresholds,
  })

  function handleSave() {
    toast({ title: "Progi nieaktywności zapisane" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progi nieaktywności</CardTitle>
        <CardDescription>
          Ustaw, po ilu dniach braku aktywności szansa otrzyma alert amber lub red.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="amberDays">Amber alert po X dniach</Label>
            <Input
              id="amberDays"
              type="number"
              min={1}
              value={thresholds.amberDays}
              onChange={(e) =>
                setThresholds((p) => ({ ...p, amberDays: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Szanse bez aktywności przez{" "}
              <strong>{thresholds.amberDays}</strong> dni otrzymają status amber.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="redDays">Red alert po X dniach</Label>
            <Input
              id="redDays"
              type="number"
              min={1}
              value={thresholds.redDays}
              onChange={(e) =>
                setThresholds((p) => ({ ...p, redDays: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Szanse bez aktywności przez{" "}
              <strong>{thresholds.redDays}</strong> dni otrzymają status red.
            </p>
          </div>

          <Button onClick={handleSave}>Zapisz</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab 4: Produkty ──────────────────────────────────────────────────────────

type ProductFormState = {
  name: string
  sku: string
  category: string
  price: number
  description: string
  isActive: boolean
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  sku: "",
  category: "",
  price: 0,
  description: "",
  isActive: true,
}

function ProductsTab() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>(
    demoProducts.map((p) => ({ ...p }))
  )
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM)

  function openAdd() {
    setForm(EMPTY_PRODUCT_FORM)
    setAddOpen(true)
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      description: product.description,
      isActive: product.isActive,
    })
    setEditTarget(product)
  }

  function handleAdd() {
    const id = `prod-${Date.now()}`
    setProducts((prev) => [
      ...prev,
      { id, currency: "PLN", ...form },
    ])
    toast({ title: "Produkt dodany", description: form.name })
    setAddOpen(false)
  }

  function handleEdit() {
    if (!editTarget) return
    setProducts((prev) =>
      prev.map((p) => (p.id === editTarget.id ? { ...p, ...form } : p))
    )
    toast({ title: "Produkt zaktualizowany", description: form.name })
    setEditTarget(null)
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    toast({ title: "Produkt usunięty" })
  }

  function toggleActive(id: string, value: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: value } : p)))
  }

  function ProductForm() {
    return (
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>Nazwa</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="np. Licencja roczna"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              placeholder="np. RF-LIC-01"
            />
          </div>
          <div className="grid gap-2">
            <Label>Kategoria</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="np. Licencja"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Cena (PLN)</Label>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
          />
        </div>
        <div className="grid gap-2">
          <Label>Opis</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Krótki opis produktu..."
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="product-active"
            checked={form.isActive}
            onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
          />
          <Label htmlFor="product-active">Aktywny</Label>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Produkty</CardTitle>
          <CardDescription>
            Zarządzaj katalogiem produktów i usług dołączanych do szans sprzedaży.
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Dodaj produkt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowy produkt</DialogTitle>
            </DialogHeader>
            <ProductForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleAdd} disabled={!form.name.trim()}>
                Dodaj
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Nazwa</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Kategoria</th>
                <th className="px-4 py-3 text-right font-medium">Cena (PLN)</th>
                <th className="px-4 py-3 text-center font-medium">Aktywny</th>
                <th className="px-4 py-3 text-center font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{product.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {product.price.toLocaleString("pl-PL")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={(v) => toggleActive(product.id, v)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit dialog */}
                      <Dialog
                        open={editTarget?.id === product.id}
                        onOpenChange={(open) => {
                          if (!open) setEditTarget(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edytuj produkt</DialogTitle>
                          </DialogHeader>
                          <ProductForm />
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setEditTarget(null)}
                            >
                              Anuluj
                            </Button>
                            <Button
                              onClick={handleEdit}
                              disabled={!form.name.trim()}
                            >
                              Zapisz
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Tab 5: Szablony e-mail ───────────────────────────────────────────────────

type TemplateFormState = {
  name: string
  subject: string
  body: string
  isShared: boolean
}

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  name: "",
  subject: "",
  body: "",
  isShared: false,
}

function EmailTemplatesTab() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>(
    demoEmailTemplates.map((t) => ({ ...t }))
  )
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM)

  function openAdd() {
    setForm(EMPTY_TEMPLATE_FORM)
    setAddOpen(true)
  }

  function openEdit(template: EmailTemplate) {
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      isShared: template.isShared,
    })
    setEditTarget(template)
  }

  function handleAdd() {
    const id = `et-${Date.now()}`
    setTemplates((prev) => [
      ...prev,
      { id, createdBy: "u1", ...form },
    ])
    toast({ title: "Szablon dodany", description: form.name })
    setAddOpen(false)
  }

  function handleEdit() {
    if (!editTarget) return
    setTemplates((prev) =>
      prev.map((t) => (t.id === editTarget.id ? { ...t, ...form } : t))
    )
    toast({ title: "Szablon zaktualizowany", description: form.name })
    setEditTarget(null)
  }

  function handleDelete(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    toast({ title: "Szablon usunięty" })
  }

  function TemplateForm() {
    return (
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>Nazwa</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="np. Powitanie leada"
          />
        </div>
        <div className="grid gap-2">
          <Label>Temat</Label>
          <Input
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            placeholder="np. Witamy w SMB 360 — {{company_name}}"
          />
        </div>
        <div className="grid gap-2">
          <Label>Treść</Label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            rows={7}
            placeholder="Treść wiadomości e-mail..."
            className="resize-y"
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="template-shared"
            checked={form.isShared}
            onCheckedChange={(v) => setForm((p) => ({ ...p, isShared: v }))}
          />
          <Label htmlFor="template-shared">Udostępniony całemu zespołowi</Label>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Szablony e-mail</CardTitle>
          <CardDescription>
            Zarządzaj szablonami wiadomości używanymi w kontakcie z klientami.
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Dodaj szablon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nowy szablon e-mail</DialogTitle>
            </DialogHeader>
            <TemplateForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleAdd} disabled={!form.name.trim()}>
                Dodaj
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{template.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {template.subject}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    template.isShared
                      ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40 shrink-0"
                      : "text-muted-foreground shrink-0"
                  }
                >
                  {template.isShared ? "Udostępniony" : "Prywatny"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.body.slice(0, 80)}
                {template.body.length > 80 ? "…" : ""}
              </p>

              <div className="flex gap-2 mt-auto">
                {/* Edit dialog */}
                <Dialog
                  open={editTarget?.id === template.id}
                  onOpenChange={(open) => {
                    if (!open) setEditTarget(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(template)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edytuj
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edytuj szablon</DialogTitle>
                    </DialogHeader>
                    <TemplateForm />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setEditTarget(null)}
                      >
                        Anuluj
                      </Button>
                      <Button
                        onClick={handleEdit}
                        disabled={!form.name.trim()}
                      >
                        Zapisz
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesTrackSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia SalesTrack</h1>
        <p className="text-muted-foreground mt-1">
          Konfiguracja modułu CRM — etapy pipeline, powody zamknięcia, progi alertów,
          produkty i szablony e-mail.
        </p>
      </div>

      <Tabs defaultValue="stages">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="stages">Etapy pipeline</TabsTrigger>
          <TabsTrigger value="close-reasons">Powody zamknięcia</TabsTrigger>
          <TabsTrigger value="inactivity">Progi nieaktywności</TabsTrigger>
          <TabsTrigger value="products">Produkty</TabsTrigger>
          <TabsTrigger value="email-templates">Szablony e-mail</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="stages">
            <PipelineStagesTab />
          </TabsContent>

          <TabsContent value="close-reasons">
            <CloseReasonsTab />
          </TabsContent>

          <TabsContent value="inactivity">
            <InactivityThresholdsTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="email-templates">
            <EmailTemplatesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
