"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { WorkloadUser, WorkloadTask } from "@/lib/supabase/projecthub-server"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PL_DAYS_SHORT   = ["Nd","Pn","Wt","Śr","Cz","Pt","Sb"]
const PL_MONTHS_SHORT = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"]

// Parse date string as LOCAL time (avoids UTC midnight → DST shift bugs)
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function addDays(dateStr: string, n: number) {
  const d = parseLocal(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

function startOfWeek(dateStr: string) {
  const d = parseLocal(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateStr(d)
}

function startOfMonth(dateStr: string) {
  return dateStr.slice(0, 7) + "-01"
}

function daysInMonth(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}

function formatDayLabel(dateStr: string, short = false) {
  const d = parseLocal(dateStr)
  return short
    ? `${d.getDate()}`
    : `${PL_DAYS_SHORT[d.getDay()]} ${d.getDate()}`
}

function formatMonthLabel(dateStr: string) {
  const d = parseLocal(dateStr)
  return `${PL_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function isWeekend(dateStr: string) {
  const day = parseLocal(dateStr).getDay()
  return day === 0 || day === 6
}

// ─── Priority styles ──────────────────────────────────────────────────────────

const PRIORITY_CHIP: Record<string, string> = {
  urgent: "bg-red-100   text-red-800   border-red-300",
  high:   "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-blue-100  text-blue-800  border-blue-300",
  low:    "bg-gray-100  text-gray-600  border-gray-300",
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500", high: "bg-orange-400", medium: "bg-blue-400", low: "bg-gray-400",
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Pilne", high: "Wysoki", medium: "Średni", low: "Niski",
}

const STATUS_LABEL: Record<string, string> = {
  todo: "Do zrobienia", in_progress: "W toku", review: "Review", done: "Gotowe",
}

// ─── Absence display ─────────────────────────────────────────────────────────

export type WorkloadAbsence = {
  user_id: string
  date: string
  type: "leave" | "trip" | "sick"
  label: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialUsers: WorkloadUser[]
  initialTasks: WorkloadTask[]
  initialAbsences?: WorkloadAbsence[]
  today: string
}

// ─── Task chip ───────────────────────────────────────────────────────────────

function TaskChip({ task, compact }: { task: WorkloadTask; compact?: boolean }) {
  const chipClass = PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.medium
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-full text-left text-[11px] border rounded px-1.5 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity ${chipClass}`}
          title={task.title}
        >
          {compact ? (
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${PRIORITY_DOT[task.priority]}`} />
          ) : null}
          {task.title}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs space-y-1.5 p-3" side="bottom" align="start">
        <p className="font-semibold text-sm leading-snug">{task.title}</p>
        {task.project_name && <p className="text-muted-foreground">{task.project_name}</p>}
        <div className="flex gap-3 flex-wrap">
          <span><span className="text-muted-foreground">Priorytet: </span>{PRIORITY_LABEL[task.priority] ?? task.priority}</span>
          <span><span className="text-muted-foreground">Status: </span>{STATUS_LABEL[task.status] ?? task.status}</span>
        </div>
        {task.estimated_hours != null && (
          <p><span className="text-muted-foreground">Szac. godz.: </span>{task.estimated_hours}h</p>
        )}
        <p><span className="text-muted-foreground">Termin: </span>{task.due_date}</p>
      </PopoverContent>
    </Popover>
  )
}

// ─── Absence chip ─────────────────────────────────────────────────────────────

function AbsenceChip({ absence }: { absence: WorkloadAbsence }) {
  const cls = absence.type === "leave"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : absence.type === "trip"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-rose-50 text-rose-700 border-rose-200"
  return (
    <div className={`w-full text-[10px] border rounded px-1.5 py-0.5 truncate italic ${cls}`}>
      {absence.label}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorkloadPageClient({ initialUsers, initialTasks, initialAbsences = [], today }: Props) {
  const [view, setView] = useState<"week" | "month">("week")
  const [anchor, setAnchor] = useState<string>(startOfWeek(today))
  const [showAbsences, setShowAbsences] = useState(true)

  function switchView(v: "week" | "month") {
    setView(v)
    setAnchor(v === "week" ? startOfWeek(today) : startOfMonth(today))
  }

  function navigate(dir: 1 | -1) {
    if (view === "week") {
      setAnchor(prev => addDays(prev, dir * 7))
    } else {
      const d = new Date(anchor)
      d.setMonth(d.getMonth() + dir)
      d.setDate(1)
      setAnchor(d.toISOString().split("T")[0])
    }
  }

  function goToday() {
    setAnchor(view === "week" ? startOfWeek(today) : startOfMonth(today))
  }

  // Column dates
  const columns: string[] = useMemo(() => {
    if (view === "week") return Array.from({ length: 7 }, (_, i) => addDays(anchor, i))
    const count = daysInMonth(anchor)
    return Array.from({ length: count }, (_, i) => addDays(anchor, i))
  }, [view, anchor])

  // Task index: user_id → date → tasks
  const taskIndex = useMemo(() => {
    const idx: Record<string, Record<string, WorkloadTask[]>> = {}
    for (const t of initialTasks) {
      if (!idx[t.user_id]) idx[t.user_id] = {}
      if (!idx[t.user_id][t.due_date]) idx[t.user_id][t.due_date] = []
      idx[t.user_id][t.due_date].push(t)
    }
    return idx
  }, [initialTasks])

  // Absence index: user_id → date → absences
  const absenceIndex = useMemo(() => {
    const idx: Record<string, Record<string, WorkloadAbsence[]>> = {}
    for (const a of initialAbsences) {
      if (!idx[a.user_id]) idx[a.user_id] = {}
      if (!idx[a.user_id][a.date]) idx[a.user_id][a.date] = []
      idx[a.user_id][a.date].push(a)
    }
    return idx
  }, [initialAbsences])

  // Day totals
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of initialTasks) {
      totals[t.due_date] = (totals[t.due_date] ?? 0) + 1
    }
    return totals
  }, [initialTasks])

  const compact = view === "month"
  const colMinPx = compact ? 52 : 120

  // Grid template: sticky user col + fluid day cols
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `160px repeat(${columns.length}, minmax(${colMinPx}px, 1fr))`,
    minWidth: `${160 + columns.length * colMinPx}px`,
  }

  const headerLabel = view === "week"
    ? `${formatDayLabel(columns[0])} – ${formatDayLabel(columns[6])}, ${parseLocal(columns[0]).getFullYear()}`
    : formatMonthLabel(anchor)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-background shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Obciążenie zespołu</h1>
          <p className="text-xs text-muted-foreground">{headerLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {initialAbsences.length > 0 || true ? (
            <Button
              variant={showAbsences ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowAbsences(v => !v)}
            >
              Nieobecności
            </Button>
          ) : null}
          <Tabs value={view} onValueChange={v => switchView(v as "week" | "month")}>
            <TabsList className="h-8">
              <TabsTrigger value="week"  className="text-xs px-3">Tydzień</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Miesiąc</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>
            Dzisiaj
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="flex-1 overflow-auto">
        {/* Header row */}
        <div className="sticky top-0 z-20 bg-muted/95 backdrop-blur border-b" style={gridStyle}>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-r flex items-center">
            Pracownik
          </div>
          {columns.map(date => {
            const isToday   = date === today
            const isWknd    = isWeekend(date)
            return (
              <div
                key={date}
                className={[
                  "py-2 text-center text-xs font-semibold border-r select-none",
                  isToday ? "text-purple-700 bg-purple-50" : isWknd ? "text-muted-foreground/50" : "text-muted-foreground",
                ].join(" ")}
              >
                {compact ? (
                  <>
                    <div className="text-[10px] leading-none">{PL_DAYS_SHORT[parseLocal(date).getDay()]}</div>
                    <div className={isToday ? "mt-0.5 mx-auto w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold" : "mt-0.5"}>
                      {parseLocal(date).getDate()}
                    </div>
                  </>
                ) : (
                  <span>{formatDayLabel(date)}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* User rows */}
        {initialUsers.map(user => {
          const userTasks    = taskIndex[user.id]    ?? {}
          const userAbsences = absenceIndex[user.id] ?? {}
          return (
            <div key={user.id} className="border-b hover:bg-muted/10 transition-colors" style={gridStyle}>
              {/* Name */}
              <div className="px-3 py-2 border-r flex flex-col justify-center min-h-[52px]">
                <p className="text-sm font-medium leading-tight truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>

              {/* Day cells */}
              {columns.map(date => {
                const tasks    = userTasks[date]    ?? []
                const absences = showAbsences ? (userAbsences[date] ?? []) : []
                const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
                const overloaded = totalHours > 8
                const isToday    = date === today
                const isWknd     = isWeekend(date)
                const hasAbsence = absences.length > 0

                return (
                  <div
                    key={date}
                    className={[
                      "border-r px-0.5 py-0.5 flex flex-col gap-0.5 min-h-[52px]",
                      isToday    ? "bg-purple-50/70" : "",
                      overloaded ? "bg-red-50"       : "",
                      isWknd && !isToday ? "bg-muted/30" : "",
                    ].join(" ")}
                  >
                    {absences.map((a, i) => <AbsenceChip key={i} absence={a} />)}
                    {!hasAbsence && tasks.map(t => <TaskChip key={t.id} task={t} compact={compact} />)}
                    {hasAbsence && tasks.length > 0 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{tasks.length} zad.</div>
                    )}
                    {overloaded && !hasAbsence && (
                      <p className="text-[10px] text-red-600 font-semibold px-1">{totalHours}h ⚠</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Totals row */}
        <div className="sticky bottom-0 bg-muted/95 backdrop-blur border-t z-10" style={gridStyle}>
          <div className="px-3 py-2 border-r text-xs font-semibold text-muted-foreground flex items-center">
            Łącznie
          </div>
          {columns.map(date => {
            const count   = dayTotals[date] ?? 0
            const isToday = date === today
            const isWknd  = isWeekend(date)
            return (
              <div
                key={date}
                className={[
                  "px-1 py-2 text-center border-r text-xs font-semibold",
                  count > 0 ? "text-foreground" : "text-muted-foreground/30",
                  isToday ? "bg-purple-50/70" : isWknd ? "bg-muted/30" : "",
                ].join(" ")}
              >
                {count > 0 ? count : "—"}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
