"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ClientType } from "@/lib/demo/sales-data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Download, Plus, ExternalLink, Edit2 } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  type: ClientType
  industry: string
  city: string
  country: string
  assignedTo: string
  ownerName?: string
  leadScore: number
  isActive: boolean
  website: string
  phone: string
  notes: string
  address?: string
  nip?: string
  regon?: string
}

interface Owner { id: string; name: string }
type TypeFilter = "all" | ClientType

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ClientType, string> = {
  lead: "Lead", strategic: "Strategiczny", regular: "Regularny", inactive: "Nieaktywny",
}
const TYPE_CLASS: Record<ClientType, string> = {
  lead: "bg-blue-100 text-blue-800", strategic: "bg-purple-100 text-purple-800",
  regular: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-600",
}
const COUNTRY_LABELS: Record<string, string> = {
  PL: "Polska", DE: "Niemcy", CZ: "Czechy", SK: "Słowacja", US: "USA", GB: "Wielka Brytania",
}

function StarRating({ score, onChange }: { score: number; onChange?: (v: number) => void }) {
  return (
    <span className="text-yellow-400 text-base select-none">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={onChange ? "cursor-pointer" : ""} onClick={() => onChange?.(i)}>
          {i <= score ? "★" : "☆"}
        </span>
      ))}
    </span>
  )
}

function exportCSV(clients: Client[]) {
  const headers = ["Nazwa", "Typ", "Branża", "Miasto", "Opiekun", "Lead Score", "Aktywny"]
  const rows = clients.map(c => [
    c.name, TYPE_LABELS[c.type], c.industry, c.city,
    c.ownerName ?? c.assignedTo, String(c.leadScore), c.isActive ? "Tak" : "Nie",
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "klienci.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ─── Client Form ─────────────────────────────────────────────────────────────

interface ClientForm {
  name: string; type: ClientType; industry: string; city: string; country: string
  website: string; phone: string; leadScore: number; assignedTo: string
  address: string; nip: string; regon: string; notes: string
}

const defaultForm: ClientForm = {
  name: "", type: "lead", industry: "", city: "", country: "PL",
  website: "", phone: "", leadScore: 3, assignedTo: "",
  address: "", nip: "", regon: "", notes: "",
}

// ─── Page Client ──────────────────────────────────────────────────────────────

interface Props {
  initialClients: Client[]
  initialOwners: Owner[]
}

export function ClientsPageClient({ initialClients, initialOwners }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [clients, setClients] = useState<Client[]>(initialClients)
  const owners = initialOwners

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [form, setForm] = useState<ClientForm>(defaultForm)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState<ClientForm>(defaultForm)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)
    return matchSearch && (typeFilter === "all" || c.type === typeFilter)
  })

  function handleAdd() {
    if (!form.name.trim()) return
    const newClient: Client = {
      id: `cl-${Date.now()}`, name: form.name.trim(), type: form.type,
      industry: form.industry.trim(), city: form.city.trim(), country: form.country,
      assignedTo: form.assignedTo, leadScore: form.leadScore, isActive: true,
      website: form.website.trim(), phone: form.phone.trim(), notes: form.notes.trim(),
      address: form.address.trim(), nip: form.nip.trim(), regon: form.regon.trim(),
    }
    setClients(prev => [newClient, ...prev])
    setShowAddDialog(false); setForm(defaultForm)
    toast({ title: "Klient dodany", description: newClient.name })
  }

  function openEditDialog(c: Client) {
    setEditingClient(c)
    setEditForm({
      name: c.name, type: c.type, industry: c.industry, city: c.city,
      country: c.country || "PL", website: c.website, phone: c.phone,
      leadScore: c.leadScore, assignedTo: c.assignedTo,
      address: c.address ?? "", nip: c.nip ?? "", regon: c.regon ?? "", notes: c.notes,
    })
  }

  function handleEdit() {
    if (!editingClient || !editForm.name.trim()) return
    setClients(prev => prev.map(c => c.id === editingClient.id ? {
      ...c, name: editForm.name.trim(), type: editForm.type,
      industry: editForm.industry.trim(), city: editForm.city.trim(),
      country: editForm.country, assignedTo: editForm.assignedTo,
      leadScore: editForm.leadScore, website: editForm.website.trim(),
      phone: editForm.phone.trim(), notes: editForm.notes.trim(),
      address: editForm.address.trim(), nip: editForm.nip.trim(), regon: editForm.regon.trim(),
    } : c))
    setEditingClient(null)
    toast({ title: "Klient zaktualizowany", description: editForm.name.trim() })
  }

  function ClientFormFields({ form, setForm, idPrefix }: {
    form: ClientForm; setForm: React.Dispatch<React.SetStateAction<ClientForm>>; idPrefix: string
  }) {
    return (
      <div className="grid gap-4 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Nazwa *</Label>
          <Input id={`${idPrefix}-name`} value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nazwa firmy" />
        </div>
        <div className="grid gap-1.5">
          <Label>Typ</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ClientType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="strategic">Strategiczny</SelectItem>
              <SelectItem value="regular">Regularny</SelectItem>
              <SelectItem value="inactive">Nieaktywny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-industry`}>Branża</Label>
            <Input id={`${idPrefix}-industry`} value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="np. IT" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-city`}>Miasto</Label>
            <Input id={`${idPrefix}-city`} value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="np. Warszawa" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-address`}>Adres</Label>
          <Input id={`${idPrefix}-address`} value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="ul. Przykładowa 1" />
        </div>
        <div className="grid gap-1.5">
          <Label>Kraj</Label>
          <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
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
            <Label htmlFor={`${idPrefix}-website`}>Strona WWW</Label>
            <Input id={`${idPrefix}-website`} value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="domena.pl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-phone`}>Telefon</Label>
            <Input id={`${idPrefix}-phone`} value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+48 …" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-nip`}>NIP</Label>
            <Input id={`${idPrefix}-nip`} value={form.nip}
              onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} placeholder="000-000-00-00" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-regon`}>REGON</Label>
            <Input id={`${idPrefix}-regon`} value={form.regon}
              onChange={e => setForm(f => ({ ...f, regon: e.target.value }))} placeholder="000000000" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Lead Score</Label>
          <StarRating score={form.leadScore} onChange={v => setForm(f => ({ ...f, leadScore: v }))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Przypisany opiekun</Label>
          <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-notes`}>Notatki</Label>
          <Textarea id={`${idPrefix}-notes`} rows={3} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Dodatkowe informacje o kliencie…" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Klienci</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} z {clients.length} klientów</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
            <Download className="w-4 h-4 mr-2" />Eksportuj CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Dodaj klienta
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Szukaj po nazwie, mieście, branży…" value={search}
          onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Typ klienta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="strategic">Strategiczny</SelectItem>
            <SelectItem value="regular">Regularny</SelectItem>
            <SelectItem value="inactive">Nieaktywny</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Brak wyników</p>
        )}
        {filtered.map(c => (
          <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/platform/sales-track/clients/${c.id}`)}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.industry} · {c.city}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${TYPE_CLASS[c.type]}`}>
                  {TYPE_LABELS[c.type]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <StarRating score={c.leadScore} />
                <span>{c.ownerName ?? c.assignedTo}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead><TableHead>Typ</TableHead>
                  <TableHead>Branża</TableHead><TableHead>Miasto</TableHead>
                  <TableHead>Opiekun</TableHead><TableHead>Lead Score</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Brak wyników</TableCell></TableRow>
                )}
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/platform/sales-track/clients/${c.id}`} className="hover:underline text-primary">{c.name}</Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASS[c.type]}`}>
                        {TYPE_LABELS[c.type]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{c.industry}</TableCell>
                    <TableCell className="text-sm">{c.city}</TableCell>
                    <TableCell className="text-sm">{c.ownerName ?? c.assignedTo}</TableCell>
                    <TableCell><StarRating score={c.leadScore} /></TableCell>
                    <TableCell>
                      {c.isActive
                        ? <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Aktywny</Badge>
                        : <Badge variant="secondary">Nieaktywny</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEditDialog(c) }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/platform/sales-track/clients/${c.id}`)}>
                          <ExternalLink className="w-4 h-4 mr-1" />Otwórz
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Dodaj klienta</DialogTitle></DialogHeader>
          <ClientFormFields form={form} setForm={setForm} idPrefix="add" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>Dodaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingClient} onOpenChange={open => { if (!open) setEditingClient(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edytuj klienta</DialogTitle></DialogHeader>
          <ClientFormFields form={editForm} setForm={setEditForm} idPrefix="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Anuluj</Button>
            <Button onClick={handleEdit} disabled={!editForm.name.trim()}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
