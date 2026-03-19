"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Star, Trash2, Check } from "lucide-react"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  rate: number
  is_base: boolean
  active: boolean
}

const INITIAL: Currency[] = [
  { id: "c1", code: "PLN", name: "Złoty polski",     symbol: "zł", rate: 1,    is_base: true,  active: true },
  { id: "c2", code: "EUR", name: "Euro",              symbol: "€",  rate: 0.23, is_base: false, active: true },
  { id: "c3", code: "USD", name: "Dolar amerykański", symbol: "$",  rate: 0.25, is_base: false, active: true },
]

type DialogMode = "add" | "edit"

interface FormState {
  code: string
  name: string
  symbol: string
  rate: string
}

const EMPTY_FORM: FormState = { code: "", name: "", symbol: "", rate: "" }

function currencyToForm(c: Currency): FormState {
  return { code: c.code, name: c.name, symbol: c.symbol, rate: String(c.rate) }
}

export default function CurrenciesSettingsPage() {
  const { toast } = useToast()
  const [currencies, setCurrencies] = useState<Currency[]>(INITIAL)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("add")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function openAdd() {
    setDialogMode("add")
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(c: Currency) {
    setDialogMode("edit")
    setEditingId(c.id)
    setForm(currencyToForm(c))
    setDialogOpen(true)
  }

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "code" ? value.toUpperCase().slice(0, 3) : field === "symbol" ? value.slice(0, 3) : value,
    }))
  }

  function handleSubmit() {
    const rate = parseFloat(form.rate)
    if (!form.code || !form.name || !form.symbol || isNaN(rate) || rate <= 0) {
      toast({ title: "Wypełnij wszystkie pola poprawnie", variant: "destructive" })
      return
    }

    if (dialogMode === "add") {
      const newCurrency: Currency = {
        id: `c${Date.now()}`,
        code: form.code,
        name: form.name,
        symbol: form.symbol,
        rate,
        is_base: false,
        active: true,
      }
      setCurrencies((prev) => [...prev, newCurrency])
      toast({ title: "Waluta dodana" })
    } else if (dialogMode === "edit" && editingId) {
      setCurrencies((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, code: form.code, name: form.name, symbol: form.symbol, rate }
            : c
        )
      )
      toast({ title: "Waluta zaktualizowana" })
    }

    setDialogOpen(false)
  }

  function handleSetBase(id: string) {
    setCurrencies((prev) => {
      const target = prev.find((c) => c.id === id)
      if (!target || target.is_base) return prev
      const oldRate = target.rate
      return prev.map((c) => {
        if (c.id === id) return { ...c, is_base: true, rate: 1 }
        return { ...c, is_base: false, rate: parseFloat((c.rate / oldRate).toFixed(4)) }
      })
    })
    toast({ title: "Waluta bazowa zmieniona" })
  }

  function handleDelete(id: string) {
    setCurrencies((prev) => prev.filter((c) => c.id !== id))
    toast({ title: "Waluta usunięta", variant: "destructive" })
  }

  function handleToggleActive(id: string) {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    )
    const currency = currencies.find((c) => c.id === id)
    if (currency) {
      toast({ title: currency.active ? "Waluta dezaktywowana" : "Waluta aktywowana" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Waluty</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Zarządzaj walutami i kursami wymiany używanymi w platformie.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj walutę
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kod</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nazwa</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Symbol</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kurs</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bazowa</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currencies.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.name}</td>
                <td className="px-4 py-3">{c.symbol}</td>
                <td className="px-4 py-3">
                  {c.is_base ? "—" : c.rate.toFixed(4)}
                </td>
                <td className="px-4 py-3">
                  {c.is_base && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(c.id)}
                    className="focus:outline-none"
                    type="button"
                  >
                    {c.active ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border-0">
                        Aktywna
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="cursor-pointer">
                        Nieaktywna
                      </Badge>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!c.is_base && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetBase(c.id)}
                        title="Ustaw jako bazową"
                      >
                        <Star className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                      disabled={c.is_base}
                      title="Usuń"
                      className="text-destructive hover:text-destructive"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Dodaj walutę" : "Edytuj walutę"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Kod ISO</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => handleFormChange("code", e.target.value)}
                maxLength={3}
                placeholder="np. EUR"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nazwa</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="np. Euro"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={form.symbol}
                onChange={(e) => handleFormChange("symbol", e.target.value)}
                maxLength={3}
                placeholder="np. €"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rate">Kurs wymiany</Label>
              <Input
                id="rate"
                type="number"
                step={0.0001}
                min={0.0001}
                value={form.rate}
                onChange={(e) => handleFormChange("rate", e.target.value)}
                placeholder="np. 0.2300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit}>
              <Check className="mr-2 h-4 w-4" />
              {dialogMode === "add" ? "Dodaj" : "Zapisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
