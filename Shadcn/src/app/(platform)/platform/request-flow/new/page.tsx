"use client"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plane, Home, Briefcase, Clock, Monitor, DollarSign, GraduationCap,
  ArrowLeft, ArrowRight, CheckCircle2, Paperclip, X as XIcon,
} from "lucide-react"
import { requestTypeLabels, requestTypeColors, type DemoRequestType } from "@/lib/demo/data"

// ─── Type definitions ─────────────────────────────────────────────────────────

const REQUEST_TYPES: { key: DemoRequestType; icon: React.ReactNode; description: string }[] = [
  { key: "vacation",       icon: <Plane className="h-6 w-6" />,        description: "Urlop wypoczynkowy, okolicznościowy lub na żądanie" },
  { key: "home_office",    icon: <Home className="h-6 w-6" />,         description: "Praca zdalna z domu lub innej lokalizacji" },
  { key: "business_trip",  icon: <Briefcase className="h-6 w-6" />,    description: "Wyjazd służbowy krajowy lub zagraniczny" },
  { key: "overtime",       icon: <Clock className="h-6 w-6" />,        description: "Nadgodziny lub odbiór czasu wolnego" },
  { key: "equipment",      icon: <Monitor className="h-6 w-6" />,      description: "Sprzęt, akcesoria lub licencje" },
  { key: "budget_request", icon: <DollarSign className="h-6 w-6" />,   description: "Wniosek budżetowy lub zakupowy" },
  { key: "training_course",icon: <GraduationCap className="h-6 w-6" />,description: "Szkolenie, kurs lub konferencja" },
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormValues {
  title: string
  notes: string
  // dates
  startDate: string
  endDate: string
  // vacation
  vacationSubtype: string
  // business trip
  destination: string
  purpose: string
  budget: string
  transport: string
  // home office
  workLocation: string
  // overtime
  overtimeReason: string
  overtimeHours: string
  // equipment
  itemDescription: string
  quantity: string
  unitPrice: string
  justification: string
  // budget request
  department: string
  costCategory: string
  // training
  courseName: string
  provider: string
  format: string
  courseCost: string
  courseLink: string
}

const INITIAL: FormValues = {
  title: "", notes: "",
  startDate: "", endDate: "",
  vacationSubtype: "wypoczynkowy",
  destination: "", purpose: "", budget: "", transport: "PKP",
  workLocation: "Dom",
  overtimeReason: "", overtimeHours: "",
  itemDescription: "", quantity: "1", unitPrice: "", justification: "",
  department: "IT", costCategory: "IT",
  courseName: "", provider: "", format: "online", courseCost: "", courseLink: "",
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Typ wniosku", "Szczegóły", "Podsumowanie"]
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((label, i) => {
        const num = (i + 1) as 1 | 2 | 3
        const done = num < step
        const active = num === step
        return (
          <div key={num} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            </div>
            {i < 2 && <div className={`h-px w-8 ${done ? "bg-primary" : "bg-border"}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Row component for summary ────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const preselected = searchParams.get("type") as DemoRequestType | null
  const [step, setStep] = useState<1 | 2 | 3>(preselected ? 2 : 1)
  const [selectedType, setSelectedType] = useState<DemoRequestType | null>(preselected)
  const [values, setValues] = useState<FormValues>({ ...INITIAL, title: preselected ? requestTypeLabels[preselected] : "" })
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(field: keyof FormValues, value: string) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  function handleSelectType(type: DemoRequestType) {
    setSelectedType(type)
    setValues({ ...INITIAL, title: requestTypeLabels[type] })
    setStep(2)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
      e.target.value = ""
    }
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  function canAdvance(): boolean {
    if (!selectedType || !values.title.trim()) return false
    if (["vacation", "home_office", "business_trip", "overtime"].includes(selectedType)) {
      if (!values.startDate || !values.endDate) return false
      if (values.endDate < values.startDate) return false
    }
    if (selectedType === "training_course" && !values.courseName.trim()) return false
    if (selectedType === "equipment" && !values.itemDescription.trim()) return false
    return true
  }

  function handleSubmit() {
    toast({
      title: "Wniosek złożony",
      description: `"${values.title}" wysłany do akceptacji.`,
    })
    setTimeout(() => router.push("/platform/request-flow/my-requests"), 1200)
  }

  const typeInfo = REQUEST_TYPES.find(t => t.key === selectedType)

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nowy wniosek</h1>
        <p className="text-muted-foreground text-sm">Wypełnij formularz i wyślij wniosek do akceptacji</p>
      </div>

      <StepIndicator step={step} />

      {/* ── Step 1: type selection ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REQUEST_TYPES.map(({ key, icon, description }) => (
            <button
              key={key}
              onClick={() => handleSelectType(key)}
              className="flex items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={`mt-0.5 rounded-md p-1.5 ${requestTypeColors[key]}`}>{icon}</span>
              <div>
                <p className="font-medium text-sm">{requestTypeLabels[key]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: details form ────────────────────────────────────────────── */}
      {step === 2 && selectedType && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Type badge + change */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${requestTypeColors[selectedType]}`}>
                {typeInfo?.icon}{requestTypeLabels[selectedType]}
              </span>
              <button onClick={() => { setStep(1); setSelectedType(null) }}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                Zmień typ
              </button>
            </div>

            {/* Title */}
            <Field label="Tytuł wniosku" required>
              <Input value={values.title} onChange={e => set("title", e.target.value)}
                placeholder="Np. Urlop wakacyjny 2026" />
            </Field>

            {/* ── Vacation ── */}
            {selectedType === "vacation" && (
              <Field label="Rodzaj urlopu">
                <Select value={values.vacationSubtype} onValueChange={v => set("vacationSubtype", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wypoczynkowy">Urlop wypoczynkowy</SelectItem>
                    <SelectItem value="okolicznościowy">Urlop okolicznościowy</SelectItem>
                    <SelectItem value="na żądanie">Urlop na żądanie</SelectItem>
                    <SelectItem value="bezpłatny">Urlop bezpłatny</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* ── Business trip extra ── */}
            {selectedType === "business_trip" && (
              <>
                <Field label="Miejsce docelowe" required>
                  <Input value={values.destination} onChange={e => set("destination", e.target.value)}
                    placeholder="Np. Warszawa, ul. Marszałkowska" />
                </Field>
                <Field label="Cel wyjazdu">
                  <Textarea value={values.purpose} onChange={e => set("purpose", e.target.value)}
                    placeholder="Opis celu wyjazdu..." rows={2} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Budżet szacunkowy (PLN)">
                    <Input type="number" min="0" value={values.budget} onChange={e => set("budget", e.target.value)} placeholder="0.00" />
                  </Field>
                  <Field label="Środek transportu">
                    <Select value={values.transport} onValueChange={v => set("transport", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKP">Pociąg (PKP)</SelectItem>
                        <SelectItem value="samolot">Samolot</SelectItem>
                        <SelectItem value="własny samochód">Własny samochód</SelectItem>
                        <SelectItem value="samochód firmowy">Samochód firmowy</SelectItem>
                        <SelectItem value="bus">Bus / autokar</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            {/* ── Home office extra ── */}
            {selectedType === "home_office" && (
              <Field label="Lokalizacja pracy">
                <Input value={values.workLocation} onChange={e => set("workLocation", e.target.value)}
                  placeholder="Np. Dom, kawiarnia, coworking" />
              </Field>
            )}

            {/* ── Overtime extra ── */}
            {selectedType === "overtime" && (
              <>
                <Field label="Powód nadgodzin">
                  <Textarea value={values.overtimeReason} onChange={e => set("overtimeReason", e.target.value)}
                    placeholder="Opisz powód nadgodzin..." rows={2} />
                </Field>
                <Field label="Liczba godzin">
                  <Input type="number" min="1" max="24" value={values.overtimeHours}
                    onChange={e => set("overtimeHours", e.target.value)} placeholder="Np. 4" />
                </Field>
              </>
            )}

            {/* ── Equipment extra ── */}
            {selectedType === "equipment" && (
              <>
                <Field label="Opis sprzętu / pozycji" required>
                  <Input value={values.itemDescription} onChange={e => set("itemDescription", e.target.value)}
                    placeholder="Np. Monitor 27 cali 4K LG" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ilość">
                    <Input type="number" min="1" value={values.quantity}
                      onChange={e => set("quantity", e.target.value)} />
                  </Field>
                  <Field label="Cena jedn. (PLN)">
                    <Input type="number" min="0" value={values.unitPrice}
                      onChange={e => set("unitPrice", e.target.value)} placeholder="0.00" />
                  </Field>
                </div>
                <Field label="Uzasadnienie">
                  <Textarea value={values.justification} onChange={e => set("justification", e.target.value)}
                    placeholder="Dlaczego potrzebujesz tego sprzętu?" rows={2} />
                </Field>
              </>
            )}

            {/* ── Budget request extra ── */}
            {selectedType === "budget_request" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Dział">
                    <Select value={values.department} onValueChange={v => set("department", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Sprzedaż">Sprzedaż</SelectItem>
                        <SelectItem value="Operacje">Operacje</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Kategoria kosztu">
                    <Select value={values.costCategory} onValueChange={v => set("costCategory", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT / Oprogramowanie</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="HR">Szkolenia / HR</SelectItem>
                        <SelectItem value="Operacje">Operacje</SelectItem>
                        <SelectItem value="Inne">Inne</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Kwota (PLN)">
                  <Input type="number" min="0" value={values.budget}
                    onChange={e => set("budget", e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Uzasadnienie">
                  <Textarea value={values.justification} onChange={e => set("justification", e.target.value)}
                    placeholder="Opisz cel wydatku i uzasadnienie biznesowe..." rows={2} />
                </Field>
              </>
            )}

            {/* ── Training extra ── */}
            {selectedType === "training_course" && (
              <>
                <Field label="Nazwa kursu / szkolenia" required>
                  <Input value={values.courseName} onChange={e => set("courseName", e.target.value)}
                    placeholder="Np. React Advanced Patterns" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Organizator">
                    <Input value={values.provider} onChange={e => set("provider", e.target.value)}
                      placeholder="Np. Udemy, Pluralsight" />
                  </Field>
                  <Field label="Format">
                    <Select value={values.format} onValueChange={v => set("format", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online (samodzielny)</SelectItem>
                        <SelectItem value="e-learning">E-learning (prowadzony)</SelectItem>
                        <SelectItem value="stacjonarny">Stacjonarne</SelectItem>
                        <SelectItem value="hybrydowy">Hybrydowe</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Koszt (PLN)">
                    <Input type="number" min="0" value={values.courseCost}
                      onChange={e => set("courseCost", e.target.value)} placeholder="0.00" />
                  </Field>
                  <Field label="Link do kursu">
                    <Input type="url" value={values.courseLink}
                      onChange={e => set("courseLink", e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </>
            )}

            {/* ── Date range (shared by date-based types) ── */}
            {["vacation", "home_office", "business_trip", "overtime"].includes(selectedType) && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data od" required>
                  <Input type="date" value={values.startDate} onChange={e => set("startDate", e.target.value)} />
                </Field>
                <Field label="Data do" required>
                  <Input type="date" value={values.endDate} min={values.startDate}
                    onChange={e => set("endDate", e.target.value)} />
                </Field>
              </div>
            )}

            {/* ── Notes (all types) ── */}
            <Field label="Uwagi">
              <Textarea value={values.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Dodatkowe informacje dla przełożonego..." rows={3} />
            </Field>

            {/* ── Attachments (all types) ── */}
            <div className="space-y-2">
              <Label>Załączniki</Label>
              <div className="rounded-lg border border-dashed p-3">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" className="gap-2"
                    onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                    Dodaj pliki
                  </Button>
                  <span className="text-xs text-muted-foreground">PDF, Word, Excel, obrazy — maks. 10 MB / plik</span>
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange} />
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {attachments.map((f, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                        <span className="truncate max-w-xs">{f.name}</span>
                        <button onClick={() => removeAttachment(i)}
                          className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0">
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {attachments.length === 0 && (
                <p className="text-xs text-muted-foreground">Brak załączników</p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />Wstecz
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canAdvance()}>
                Dalej<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: summary ─────────────────────────────────────────────────── */}
      {step === 3 && selectedType && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Podsumowanie wniosku</p>
            <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
              <Row label="Typ" value={
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestTypeColors[selectedType]}`}>
                  {requestTypeLabels[selectedType]}
                </span>
              } />
              <Row label="Tytuł" value={values.title} />

              {selectedType === "vacation" && <Row label="Rodzaj" value={values.vacationSubtype} />}
              {selectedType === "business_trip" && (
                <>
                  {values.destination && <Row label="Cel podróży" value={values.destination} />}
                  {values.transport   && <Row label="Transport"   value={values.transport} />}
                  {values.budget      && <Row label="Budżet"      value={`${values.budget} PLN`} />}
                </>
              )}
              {selectedType === "overtime" && values.overtimeHours && (
                <Row label="Liczba godzin" value={`${values.overtimeHours} h`} />
              )}
              {selectedType === "equipment" && (
                <>
                  <Row label="Pozycja" value={values.itemDescription} />
                  <Row label="Ilość"   value={values.quantity} />
                  {values.unitPrice && <Row label="Cena jedn." value={`${values.unitPrice} PLN`} />}
                </>
              )}
              {selectedType === "budget_request" && (
                <>
                  <Row label="Dział"    value={values.department} />
                  <Row label="Kategoria" value={values.costCategory} />
                  {values.budget && <Row label="Kwota" value={`${values.budget} PLN`} />}
                </>
              )}
              {selectedType === "training_course" && (
                <>
                  <Row label="Kurs"       value={values.courseName} />
                  {values.provider   && <Row label="Organizator" value={values.provider} />}
                  <Row label="Format"    value={values.format} />
                  {values.courseCost && <Row label="Koszt" value={`${values.courseCost} PLN`} />}
                </>
              )}

              {["vacation","home_office","business_trip","overtime"].includes(selectedType) && (
                <>
                  <Row label="Data od" value={values.startDate} />
                  <Row label="Data do" value={values.endDate} />
                </>
              )}
              {values.notes && <Row label="Uwagi" value={values.notes} />}
              {attachments.length > 0 && (
                <Row label="Załączniki" value={`${attachments.length} plik${attachments.length > 1 ? "i" : ""}`} />
              )}
            </div>

            {attachments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Pliki zostaną przesłane na serwer po złożeniu wniosku.
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />Edytuj
              </Button>
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />Złóż wniosek
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
