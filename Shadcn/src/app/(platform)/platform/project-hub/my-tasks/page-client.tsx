"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  CheckSquare2, AlertTriangle, Calendar, Clock, ExternalLink,
  ChevronDown, ChevronRight, CheckCircle2, Circle, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, Project } from "@/lib/supabase/projecthub-server"

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<string, string> = {
  low: "Niski", medium: "Średni", high: "Wysoki", urgent: "Pilne",
}
const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400", medium: "bg-blue-400", high: "bg-orange-400", urgent: "bg-red-500",
}
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

const STATUS_LABEL: Record<string, string> = {
  todo: "Do zrobienia", in_progress: "W toku", review: "Review", done: "Gotowe", cancelled: "Anulowane",
}
const STATUS_CLASS: Record<string, string> = {
  todo:        "bg-gray-100  text-gray-600",
  in_progress: "bg-blue-100  text-blue-700",
  review:      "bg-purple-100 text-purple-700",
  done:        "bg-green-100 text-green-700",
  cancelled:   "bg-red-100   text-red-600",
}

const SOURCE_APP_LABEL: Record<string, string> = {
  projecthub: "ProjectHub",
  salestrack:  "SalesTrack",
  helpdesk:    "Helpdesk",
  requestflow: "RequestFlow",
  peoplehub:   "PeopleHub",
  bookit:      "BookIt",
}
const SOURCE_APP_COLOR: Record<string, string> = {
  projecthub:  "bg-purple-100 text-purple-700 border-purple-200",
  salestrack:  "bg-blue-100   text-blue-700   border-blue-200",
  helpdesk:    "bg-orange-100 text-orange-700 border-orange-200",
  requestflow: "bg-green-100  text-green-700  border-green-200",
  peoplehub:   "bg-teal-100   text-teal-700   border-teal-200",
  bookit:      "bg-pink-100   text-pink-700   border-pink-200",
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function today()     { return new Date().toISOString().split("T")[0] }
function endOfWeek() {
  const d = new Date(); const day = d.getDay(); const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff); return d.toISOString().split("T")[0]
}

type Group = "overdue" | "today" | "this_week" | "later" | "no_date" | "done"

function getGroup(task: Task): Group {
  if (task.status === "done" || task.status === "cancelled") return "done"
  if (!task.due_date) return "no_date"
  const t = today(); const ew = endOfWeek()
  if (task.due_date < t)   return "overdue"
  if (task.due_date === t) return "today"
  if (task.due_date <= ew) return "this_week"
  return "later"
}

const GROUP_META: Record<Group, { label: string; icon?: string; className: string; order: number }> = {
  overdue:   { label: "Zaległe",       className: "text-red-600",            order: 0 },
  today:     { label: "Dzisiaj",       className: "text-orange-600",         order: 1 },
  this_week: { label: "Ten tydzień",   className: "text-blue-600",           order: 2 },
  later:     { label: "Później",       className: "text-muted-foreground",   order: 3 },
  no_date:   { label: "Bez terminu",   className: "text-muted-foreground",   order: 4 },
  done:      { label: "Ukończone",     className: "text-muted-foreground",   order: 5 },
}

function formatDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

// ─── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, sourceApps }: { task: Task; sourceApps: string[] }) {
  const isDone    = task.status === "done"
  const isOverdue = !isDone && task.due_date && task.due_date < today()
  const src       = (task as any).source_app as string | undefined

  return (
    <div className={cn(
      "group flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors",
      isDone ? "opacity-60" : ""
    )}>
      {/* Done indicator */}
      <div className="shrink-0 text-muted-foreground">
        {isDone
          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
          : <Circle className="w-4 h-4" />
        }
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/platform/project-hub/tasks/${task.id}`}
          className={cn(
            "text-sm font-medium hover:underline truncate block",
            isDone ? "line-through text-muted-foreground" : ""
          )}
        >
          {task.title}
        </Link>
        {task.project?.name && (
          <p className="text-xs text-muted-foreground truncate">{task.project.name}</p>
        )}
      </div>

      {/* Source app badge — only if multiple sources active */}
      {sourceApps.length > 1 && src && SOURCE_APP_LABEL[src] && (
        <span className={cn("hidden sm:inline-flex text-[10px] border rounded-full px-2 py-0.5 font-medium shrink-0", SOURCE_APP_COLOR[src] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
          {SOURCE_APP_LABEL[src]}
        </span>
      )}

      {/* Status */}
      <span className={cn("hidden md:inline-flex text-xs rounded-full px-2 py-0.5 font-medium shrink-0", STATUS_CLASS[task.status])}>
        {STATUS_LABEL[task.status]}
      </span>

      {/* Priority dot */}
      <span className="flex items-center gap-1 shrink-0" title={PRIORITY_LABEL[task.priority]}>
        <span className={cn("w-2 h-2 rounded-full", PRIORITY_DOT[task.priority])} />
        <span className="hidden lg:inline text-xs text-muted-foreground">{PRIORITY_LABEL[task.priority]}</span>
      </span>

      {/* Due date */}
      {task.due_date && (
        <span className={cn("hidden sm:flex items-center gap-1 text-xs shrink-0", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </span>
      )}

      {/* Estimated hours */}
      {task.estimated_hours != null && (
        <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          {task.estimated_hours}h
        </span>
      )}

      {/* Open link */}
      <Link
        href={`/platform/project-hub/tasks/${task.id}`}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Otwórz zadanie"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Group section ─────────────────────────────────────────────────────────────

function GroupSection({ group, tasks, sourceApps, defaultOpen = true }: {
  group: Group; tasks: Task[]; sourceApps: string[]; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = GROUP_META[group]

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          }
          <span className={cn("text-sm font-semibold", meta.className)}>{meta.label}</span>
          <span className="text-xs text-muted-foreground bg-background border rounded-full px-1.5 py-0.5 leading-none">
            {tasks.length}
          </span>
          {group === "overdue" && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>
        {group === "overdue" && tasks.length > 0 && (
          <span className="text-xs text-red-500 font-medium">{tasks.length} zaległych</span>
        )}
      </button>
      {open && (
        <div className="bg-background">
          {tasks.map(t => <TaskRow key={t.id} task={t} sourceApps={sourceApps} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialTasks: Task[]
  initialProjects: Project[]
  activeModules?: string[]  // which source apps are enabled
}

export function MyTasksPageClient({ initialTasks, initialProjects, activeModules = ["projecthub"] }: Props) {
  const [tasks]  = useState(initialTasks)
  const [search,          setSearch]          = useState("")
  const [statusFilter,    setStatusFilter]    = useState("all")
  const [priorityFilter,  setPriorityFilter]  = useState("all")
  const [projectFilter,   setProjectFilter]   = useState("all")
  const [sourceFilter,    setSourceFilter]    = useState("all")
  const [showDone,        setShowDone]        = useState(false)

  // Unique source apps in tasks
  const sourceApps = useMemo(() => {
    const seen = new Set<string>()
    for (const t of tasks) { const s = (t as any).source_app; if (s) seen.add(s) }
    return Array.from(seen)
  }, [tasks])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(t => {
      if (!q && !showDone && (t.status === "done" || t.status === "cancelled")) return false
      if (q && !t.title.toLowerCase().includes(q) && !(t.project?.name ?? "").toLowerCase().includes(q)) return false
      if (statusFilter   !== "all" && t.status   !== statusFilter)   return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      if (projectFilter  !== "all" && t.project_id !== projectFilter) return false
      if (sourceFilter   !== "all" && (t as any).source_app !== sourceFilter) return false
      return true
    })
  }, [tasks, search, statusFilter, priorityFilter, projectFilter, sourceFilter, showDone])

  // Group and sort
  const groups = useMemo(() => {
    const map = new Map<Group, Task[]>()
    for (const t of filtered) {
      const g = getGroup(t)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(t)
    }
    // Sort each group by priority then due date
    for (const tasks of map.values()) {
      tasks.sort((a, b) => {
        const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
        if (pd !== 0) return pd
        return (a.due_date ?? "9999") < (b.due_date ?? "9999") ? -1 : 1
      })
    }
    return map
  }, [filtered])

  const totalActive = tasks.filter(t => t.status !== "done" && t.status !== "cancelled").length
  const doneCount   = tasks.filter(t => t.status === "done").length

  const groupOrder: Group[] = ["overdue","today","this_week","later","no_date","done"]

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckSquare2 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Moje zadania</h1>
            <p className="text-sm text-muted-foreground">
              {totalActive} aktywnych · {doneCount} ukończonych
            </p>
          </div>
        </div>
      </div>

      {/* Source app filter chips */}
      {sourceApps.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSourceFilter("all")}
            className={cn("text-xs px-3 py-1 rounded-full border font-medium transition-colors",
              sourceFilter === "all" ? "bg-foreground text-background border-foreground" : "hover:bg-muted")}
          >
            Wszystkie
          </button>
          {sourceApps.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(sourceFilter === s ? "all" : s)}
              className={cn("text-xs px-3 py-1 rounded-full border font-medium transition-colors",
                sourceFilter === s
                  ? SOURCE_APP_COLOR[s] + " font-semibold"
                  : "hover:bg-muted"
              )}
            >
              {SOURCE_APP_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Szukaj…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm w-52"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Wszystkie statusy</SelectItem>
            <SelectItem value="todo"        className="text-xs">Do zrobienia</SelectItem>
            <SelectItem value="in_progress" className="text-xs">W toku</SelectItem>
            <SelectItem value="review"      className="text-xs">Review</SelectItem>
            <SelectItem value="done"        className="text-xs">Gotowe</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="Priorytet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all"    className="text-xs">Wszystkie</SelectItem>
            <SelectItem value="urgent" className="text-xs">Pilne</SelectItem>
            <SelectItem value="high"   className="text-xs">Wysoki</SelectItem>
            <SelectItem value="medium" className="text-xs">Średni</SelectItem>
            <SelectItem value="low"    className="text-xs">Niski</SelectItem>
          </SelectContent>
        </Select>

        {initialProjects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="Projekt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Wszystkie projekty</SelectItem>
              {initialProjects.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant={showDone ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs ml-auto"
          onClick={() => setShowDone(v => !v)}
        >
          {showDone ? "Ukryj ukończone" : "Pokaż ukończone"}
        </Button>
      </div>

      {/* Task groups */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <CheckSquare2 className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Brak zadań</p>
          <p className="text-xs text-muted-foreground mt-1">Zmień filtry lub przypisz sobie zadanie w projekcie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupOrder.map(g => {
            const gt = groups.get(g)
            if (!gt || gt.length === 0) return null
            if (g === "done" && !showDone && !search) return null
            return (
              <GroupSection
                key={g}
                group={g}
                tasks={gt}
                sourceApps={sourceApps}
                defaultOpen={g !== "done" && g !== "later"}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
