"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckSquare2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, Project } from "@/lib/supabase/projecthub-server"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<string, string> = {
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
  urgent: "Pilny",
}

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "Do zrobienia",
  in_progress: "W toku",
  review: "Przegląd",
  done: "Gotowe",
  cancelled: "Anulowane",
}

const TASK_STATUS_CLASS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
}

type StatusFilter = "all" | "todo" | "in_progress" | "review" | "done"
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent"

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

// ─── Task Detail Sheet ────────────────────────────────────────────────────────

interface TaskSheetProps {
  task: Task | null
  onClose: () => void
  onUpdate: (updated: Task) => void
}

function TaskDetailSheet({ task, onClose, onUpdate }: TaskSheetProps) {
  const [local, setLocal] = useState<Task | null>(task)

  if (task?.id !== local?.id) {
    setLocal(task)
  }

  function handleStatusChange(status: string) {
    if (!local) return
    const updated = { ...local, status }
    setLocal(updated)
    onUpdate(updated)
  }

  return (
    <Sheet open={!!task} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {local && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left pr-8">{local.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opis</Label>
                <Textarea
                  rows={3}
                  value={local.description ?? ""}
                  onChange={(e) => setLocal((t) => t ? { ...t, description: e.target.value } : t)}
                  placeholder="Brak opisu…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Status</p>
                  <Select value={local.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS_LABEL).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Priorytet</p>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[local.priority])}>
                    {PRIORITY_LABEL[local.priority] ?? local.priority}
                  </span>
                </div>
              </div>
              {local.due_date && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Termin</p>
                  <p className={cn("text-sm", isOverdue(local.due_date) && local.status !== "done" ? "text-red-600 font-medium" : "")}>
                    {local.due_date}
                  </p>
                </div>
              )}
              {local.project && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Projekt</p>
                  <p className="text-sm">{local.project.name}</p>
                </div>
              )}
              {(local.labels ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Etykiety</p>
                  <div className="flex flex-wrap gap-1">
                    {local.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Page Client ──────────────────────────────────────────────────────────────

interface Props {
  initialTasks: Task[]
  initialProjects: Project[]
}

export function MyTasksPageClient({ initialTasks, initialProjects }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  // Unique projects from tasks for filter dropdown
  const projectOptions = initialProjects

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.title.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter
    const matchProject = projectFilter === "all" || t.project_id === projectFilter
    return matchSearch && matchStatus && matchPriority && matchProject
  })

  function handleTaskUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
          <CheckSquare2 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Moje zadania</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} z {tasks.length} zadań</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input
          placeholder="Szukaj zadania…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="todo">Do zrobienia</SelectItem>
            <SelectItem value="in_progress">W toku</SelectItem>
            <SelectItem value="review">Przegląd</SelectItem>
            <SelectItem value="done">Gotowe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Priorytet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie priorytety</SelectItem>
            <SelectItem value="low">Niski</SelectItem>
            <SelectItem value="medium">Średni</SelectItem>
            <SelectItem value="high">Wysoki</SelectItem>
            <SelectItem value="urgent">Pilny</SelectItem>
          </SelectContent>
        </Select>
        {projectOptions.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Projekt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie projekty</SelectItem>
              {projectOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
            <CheckSquare2 className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Brak zadań</p>
            <p className="text-xs text-muted-foreground mt-1">Zmień filtry lub przypisz sobie zadanie.</p>
          </div>
        )}
        {filtered.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              isOverdue(task.due_date) && task.status !== "done" ? "border-red-300" : ""
            )}
            onClick={() => setSelectedTask(task)}
          >
            <CardContent className="pt-3 pb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{task.title}</p>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", TASK_STATUS_CLASS[task.status])}>
                  {TASK_STATUS_LABEL[task.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {task.project && (
                  <span className="text-xs text-muted-foreground">{task.project.name}</span>
                )}
                <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                {task.due_date && (
                  <span className={cn("text-xs", isOverdue(task.due_date) && task.status !== "done" ? "text-red-600 font-medium" : "text-muted-foreground")}>
                    {task.due_date}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <CheckSquare2 className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Brak zadań</p>
            <p className="text-xs text-muted-foreground mt-1">Zmień filtry lub przypisz sobie zadanie.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priorytet</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Etykiety</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow
                    key={task.id}
                    className={cn(
                      "cursor-pointer",
                      isOverdue(task.due_date) && task.status !== "done" ? "bg-red-50/50 dark:bg-red-950/10" : ""
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="font-medium max-w-[220px] truncate">{task.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {task.project?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_STATUS_CLASS[task.status])}>
                        {TASK_STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                        {PRIORITY_LABEL[task.priority] ?? task.priority}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-sm", isOverdue(task.due_date) && task.status !== "done" ? "text-red-600 font-medium" : "")}>
                      {task.due_date ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(task.labels ?? []).slice(0, 2).map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                        ))}
                        {(task.labels ?? []).length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{task.labels.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
      />
    </div>
  )
}
