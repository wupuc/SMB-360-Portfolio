"use client"

import { useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, Check, X, Send,
  FileText, CalendarDays, User, Hash, MessageSquare, CornerDownLeft,
  UserCheck, AlertCircle, Paperclip,
} from "lucide-react"
import {
  demoRequests, demoApprovalChains, demoTeam,
  requestTypeLabels, requestTypeColors,
  type DemoApprovalStep, type DemoRequestType,
} from "@/lib/demo/data"

// ─── Status config ─────────────────────────────────────────────────────────────

const requestStatusConfig: Record<string, { label: string; className: string }> = {
  draft:       { label: "Szkic",        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  pending:     { label: "Oczekuje",     className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  approved:    { label: "Zatwierdzone", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  rejected:    { label: "Odrzucone",    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  in_progress: { label: "W toku",       className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  completed:   { label: "Zakończone",   className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
}

const stepStatusConfig: Record<DemoApprovalStep["status"], {
  label: string; icon: React.ReactNode; ringClass: string; bgClass: string; textClass: string
}> = {
  approved:  { label: "Zatwierdzone",        icon: <Check className="h-3.5 w-3.5" />,          ringClass: "ring-emerald-500", bgClass: "bg-emerald-500",  textClass: "text-emerald-700 dark:text-emerald-400" },
  rejected:  { label: "Odrzucone",           icon: <X className="h-3.5 w-3.5" />,              ringClass: "ring-red-500",     bgClass: "bg-red-500",      textClass: "text-red-700 dark:text-red-400" },
  pending:   { label: "Oczekuje",            icon: <Clock className="h-3.5 w-3.5" />,          ringClass: "ring-amber-400",   bgClass: "bg-amber-400",    textClass: "text-amber-700 dark:text-amber-400" },
  returned:  { label: "Zwrócono do poprawy", icon: <CornerDownLeft className="h-3.5 w-3.5" />, ringClass: "ring-orange-400",  bgClass: "bg-orange-400",   textClass: "text-orange-700 dark:text-orange-400" },
  delegated: { label: "Delegowano",          icon: <UserCheck className="h-3.5 w-3.5" />,      ringClass: "ring-purple-400",  bgClass: "bg-purple-400",   textClass: "text-purple-700 dark:text-purple-400" },
}

// ─── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

// ─── Approval chain ────────────────────────────────────────────────────────────

type ExtraComment = { text: string; at: string }

function ApprovalTimeline({
  steps,
  extras,
  onAdd,
}: {
  steps: DemoApprovalStep[]
  extras: ExtraComment[]
  onAdd: (t: string) => void
}) {
  const [text, setText] = useState("")

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Brak ścieżki akceptacji — wniosek w szkicu</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const cfg = stepStatusConfig[step.status]
        const isLast = i === steps.length - 1

        return (
          <div key={i} className="flex gap-4">
            {/* Left: connector + icon */}
            <div className="flex flex-col items-center">
              <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2 ${cfg.ringClass} bg-background text-white`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${cfg.bgClass}`}>
                  {cfg.icon}
                </div>
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 28 }} />}
            </div>

            {/* Right: content */}
            <div className={`pb-5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                {/* Left of row: avatar + name */}
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs font-semibold">{step.approverInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{step.approverName}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.role}
                      {step.delegatedTo && ` → ${step.delegatedTo}`}
                    </p>
                  </div>
                </div>
                {/* Right of row: status + timestamp */}
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-semibold ${cfg.textClass}`}>{cfg.label}</span>
                  {step.decidedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(step.decidedAt)}</p>
                  )}
                </div>
              </div>

              {/* Comment bubble */}
              {step.comment && (
                <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed">
                  <MessageSquare className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground/60" />
                  {step.comment}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Extra comments */}
      {extras.map((c, i) => (
        <div key={`extra-${i}`} className="flex gap-4 mt-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-blue-400 bg-background">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">Anna Kowalska</span>
              <span className="text-xs text-muted-foreground">{c.at}</span>
            </div>
            <div className="mt-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm">
              {c.text}
            </div>
          </div>
        </div>
      ))}

      {/* Add comment */}
      <div className="mt-4 flex gap-4">
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-border bg-background">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">AK</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Dodaj komentarz do wniosku..."
            rows={2}
            className="text-sm resize-none"
          />
          <Button size="sm" onClick={() => { if (text.trim()) { onAdd(text.trim()); setText("") } }} disabled={!text.trim()}>
            <Send className="mr-2 h-3.5 w-3.5" />Wyślij komentarz
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Action dialog ─────────────────────────────────────────────────────────────

type ActionType = "approve" | "reject" | "return" | "delegate" | null

const actionConfig: Record<NonNullable<ActionType>, {
  title: string; description: string; commentLabel: string; commentPlaceholder: string
  confirmLabel: string; confirmClass: string; icon: React.ReactNode
}> = {
  approve: {
    title: "Zatwierdź wniosek",
    description: "Decyzja zostanie zapisana i wniosek przejdzie do kolejnego etapu.",
    commentLabel: "Komentarz (opcjonalny)",
    commentPlaceholder: "Np. OK, zatwierdzone.",
    confirmLabel: "Zatwierdź",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    icon: <Check className="h-4 w-4" />,
  },
  reject: {
    title: "Odrzuć wniosek",
    description: "Wnioskodawca zostanie powiadomiony o odrzuceniu i powodzie.",
    commentLabel: "Powód odrzucenia (zalecane)",
    commentPlaceholder: "Np. Przekroczony budżet działu w tym kwartale.",
    confirmLabel: "Odrzuć",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    icon: <X className="h-4 w-4" />,
  },
  return: {
    title: "Zwróć do poprawy",
    description: "Wniosek wróci do wnioskodawcy lub poprzedniego etapu z Twoim komentarzem.",
    commentLabel: "Co wymaga poprawy? (wymagane)",
    commentPlaceholder: "Np. Brakuje kosztorysu porównawczego.",
    confirmLabel: "Zwróć do poprawy",
    confirmClass: "bg-orange-600 hover:bg-orange-700 text-white",
    icon: <CornerDownLeft className="h-4 w-4" />,
  },
  delegate: {
    title: "Deleguj decyzję",
    description: "Przekaż decyzję innemu członkowi zespołu w swoim zastępstwie.",
    commentLabel: "Powód delegacji (opcjonalny)",
    commentPlaceholder: "Np. Jestem na urlopie — przekazuję do zastępcy.",
    confirmLabel: "Deleguj",
    confirmClass: "bg-purple-600 hover:bg-purple-700 text-white",
    icon: <UserCheck className="h-4 w-4" />,
  },
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const canApprove = searchParams.get("action") === "approve"
  const request = demoRequests.find(r => r.id === id)
  const steps = demoApprovalChains[id] ?? []
  const owner = demoTeam.find(m => m.id === request?.userId)

  const [extras, setExtras] = useState<ExtraComment[]>([])
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [actionComment, setActionComment] = useState("")

  function addComment(text: string) {
    setExtras(prev => [...prev, { text, at: fmtDateShort(new Date().toISOString()) }])
    toast({ title: "Komentarz dodany" })
  }

  function handleConfirmAction() {
    if (!activeAction) return
    const cfg = actionConfig[activeAction]
    const messages: Record<NonNullable<ActionType>, string> = {
      approve:  "Wniosek zatwierdzony",
      reject:   "Wniosek odrzucony",
      return:   "Zwrócono do poprawy",
      delegate: "Decyzja delegowana",
    }
    const isDestructive = activeAction === "reject"
    toast({ title: messages[activeAction], variant: isDestructive ? "destructive" : "default" })
    setActiveAction(null)
    setActionComment("")
    if (activeAction !== "delegate") {
      setTimeout(() => router.push("/platform/request-flow/approvals"), 900)
    }
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="font-medium">Wniosek nie znaleziony</p>
        <Button variant="outline" asChild>
          <Link href="/platform/request-flow/my-requests">Wróć do listy</Link>
        </Button>
      </div>
    )
  }

  const statusCfg = requestStatusConfig[request.status] ?? requestStatusConfig.draft
  const typeCfg   = requestTypeColors[request.type as DemoRequestType]

  // Count approved / total steps (skip "pending" duplicates caused by return)
  const decidedSteps  = steps.filter(s => s.status !== "pending").length
  const totalSteps    = steps.length

  return (
    <>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">

        {/* ── Breadcrumb / back ──────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/platform/request-flow" className="hover:text-foreground transition-colors">
            Request Flow
          </Link>
          <span>/</span>
          <Link
            href={canApprove ? "/platform/request-flow/approvals" : "/platform/request-flow/my-requests"}
            className="hover:text-foreground transition-colors"
          >
            {canApprove ? "Skrzynka zatwierdzeń" : "Moje wnioski"}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{request.reference_number}</span>
        </nav>

        {/* ── Hero header card ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Colour accent strip */}
          <div className={`h-1.5 w-full ${
            request.status === "approved"    ? "bg-emerald-500" :
            request.status === "rejected"    ? "bg-red-500" :
            request.status === "pending"     ? "bg-amber-400" :
            request.status === "in_progress" ? "bg-blue-500" :
            "bg-slate-300"
          }`} />

          <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: type + title */}
            <div className="flex items-start gap-4">
              {/* Type icon block */}
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold ${typeCfg}`}>
                {requestTypeLabels[request.type as DemoRequestType]?.charAt(0) ?? "?"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeCfg}`}>
                    {requestTypeLabels[request.type as DemoRequestType]}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{request.reference_number}</span>
                </div>
                <h1 className="text-xl font-bold leading-snug">{request.title}</h1>
                {owner && owner.id !== "u1" && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {owner.name} · {owner.department}
                  </p>
                )}
              </div>
            </div>

            {/* Right: status badge */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              {totalSteps > 0 && (
                <span className="text-xs text-muted-foreground">
                  {decidedSteps} / {totalSteps} kroków
                </span>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="border-t px-6 py-3 flex flex-wrap gap-x-6 gap-y-2 bg-muted/30">
            <MetaChip icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Okres" value={`${fmtDate(request.start_date)} – ${fmtDate(request.end_date)}`} />
            <MetaChip icon={<Hash className="h-3.5 w-3.5" />}
              label="Złożono" value={fmtDateTime(request.submitted_at)} />
            {request.notes && (
              <MetaChip icon={<MessageSquare className="h-3.5 w-3.5" />}
                label="Uwagi" value={request.notes} />
            )}
          </div>
        </div>

        {/* ── Main content: two columns ──────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── Left: approval chain ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-5">
                Ścieżka akceptacji
              </h2>
              <ApprovalTimeline steps={steps} extras={extras} onAdd={addComment} />
            </div>

            {/* Approve / Reject / Return / Delegate actions */}
            {canApprove && (
              <div className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-semibold">Twoja decyzja wymagana</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActiveAction("approve")}
                  >
                    <Check className="h-4 w-4" />Zatwierdź
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => setActiveAction("reject")}
                  >
                    <X className="h-4 w-4" />Odrzuć
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                    onClick={() => setActiveAction("return")}
                  >
                    <CornerDownLeft className="h-4 w-4" />Zwróć do poprawy
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    onClick={() => setActiveAction("delegate")}
                  >
                    <UserCheck className="h-4 w-4" />Deleguj
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: request fields ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Key facts */}
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Szczegóły wniosku
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldCard label="Typ wniosku">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeCfg}`}>
                    {requestTypeLabels[request.type as DemoRequestType]}
                  </span>
                </FieldCard>
                <FieldCard label="Status">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </FieldCard>
                <FieldCard label="Data od" value={fmtDate(request.start_date)} />
                <FieldCard label="Data do"  value={fmtDate(request.end_date)} />
                <FieldCard label="Złożono"  value={fmtDateTime(request.submitted_at)} />
                {owner && (
                  <FieldCard label="Wnioskodawca">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{owner.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{owner.name}</p>
                        <p className="text-xs text-muted-foreground">{owner.department}</p>
                      </div>
                    </div>
                  </FieldCard>
                )}
              </dl>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Uwagi wnioskodawcy
                </h2>
                <p className="text-sm leading-relaxed text-foreground/80">{request.notes}</p>
              </div>
            )}

            {/* Attachments placeholder */}
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Załączniki
              </h2>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-6 text-center">
                <Paperclip className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Brak załączników</p>
                <p className="text-xs text-muted-foreground/60">W wersji produkcyjnej pliki będą wyświetlane tutaj</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action dialog ───────────────────────────────────────────────────── */}
      {activeAction && (
        <Dialog open onOpenChange={() => { setActiveAction(null); setActionComment("") }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionConfig[activeAction].icon}
                {actionConfig[activeAction].title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{actionConfig[activeAction].description}</p>
              <div>
                <p className="text-sm font-medium mb-1.5">{actionConfig[activeAction].commentLabel}</p>
                <Textarea
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder={actionConfig[activeAction].commentPlaceholder}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setActiveAction(null); setActionComment("") }}>
                Anuluj
              </Button>
              <Button
                className={actionConfig[activeAction].confirmClass}
                onClick={handleConfirmAction}
                disabled={activeAction === "return" && !actionComment.trim()}
              >
                {actionConfig[activeAction].icon}
                <span className="ml-1.5">{actionConfig[activeAction].confirmLabel}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ─── Small helpers ──────────────────────────────────────────────────────────────

function MetaChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span className="font-medium text-foreground/70">{label}:</span>
      <span>{value}</span>
    </div>
  )
}

function FieldCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm font-medium">{children ?? value}</dd>
    </div>
  )
}
