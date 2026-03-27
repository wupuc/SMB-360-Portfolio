"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Plus, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project, Task, Member, Sprint, Milestone } from "@/lib/supabase/projecthub-server"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  planning: "Planowanie",
  active: "Aktywny",
  on_hold: "Wstrzymany",
  completed: "Zakończony",
  cancelled: "Anulowany",
}

const STATUS_CLASS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

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

const SPRINT_STATUS_CLASS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
}

const SPRINT_STATUS_LABEL: Record<string, string> = {
  planning: "Planowanie",
  active: "Aktywny",
  completed: "Zakończony",
}

const MEMBER_ROLE_CLASS: Record<string, string> = {
  lead: "bg-purple-100 text-purple-700",
  member: "bg-blue-100 text-blue-700",
  observer: "bg-gray-100 text-gray-600",
}

const MEMBER_ROLE_LABEL: Record<string, string> = {
  lead: "Lider",
  member: "Członek",
  observer: "Obserwator",
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

// ─── Assignee Avatars ─────────────────────────────────────────────────────────

function AssigneeAvatars({ assignees }: { assignees: Task["assignees"] }) {
  if (!assignees || assignees.length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div className="flex -space-x-1">
      {assignees.slice(0, 3).map((a, i) => (
        <span
          key={i}
          title={`${a.user.first_name} ${a.user.last_name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium ring-2 ring-background"
        >
          {initials(a.user.first_name, a.user.last_name)}
        </span>
      ))}
      {assignees.length > 3 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
          +{assignees.length - 3}
        </span>
      )}
    </div>
  )
}

// ─── Task Detail Sheet ────────────────────────────────────────────────────────

interface TaskSheetProps {
  task: Task | null
  sprints: Sprint[]
  onClose: () => void
  onUpdate: (updated: Task) => void
}

function TaskDetailSheet({ task, sprints, onClose, onUpdate }: TaskSheetProps) {
  const [local, setLocal] = useState<Task | null>(task)

  // sync when task changes
  if (task?.id !== local?.id) {
    setLocal(task)
  }

  function handleStatusChange(status: string) {
    if (!local) return
    const updated = { ...local, status }
    setLocal(updated)
    onUpdate(updated)
  }

  function handlePriorityChange(priority: string) {
    if (!local) return
    const updated = { ...local, priority }
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
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
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
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priorytet</Label>
                  <Select value={local.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niski</SelectItem>
                      <SelectItem value="medium">Średni</SelectItem>
                      <SelectItem value="high">Wysoki</SelectItem>
                      <SelectItem value="urgent">Pilny</SelectItem>
                    </SelectContent>
                  </Select>
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
              {sprints.length > 0 && (
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sprint</Label>
                  <Select
                    value={local.sprint_id ?? "none"}
                    onValueChange={(v) => setLocal((t) => t ? { ...t, sprint_id: v === "none" ? null : v } : t)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Brak sprintu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak sprintu</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(local.assignees ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Przypisane osoby</p>
                  <div className="flex flex-wrap gap-2">
                    {local.assignees!.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-sm">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          {initials(a.user.first_name, a.user.last_name)}
                        </span>
                        {a.user.first_name} {a.user.last_name}
                      </span>
                    ))}
                  </div>
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

// ─── Add Task Dialog ──────────────────────────────────────────────────────────

interface AddTaskForm {
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  sprint_id: string
}

const defaultTaskForm: AddTaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  sprint_id: "",
}

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprints: Sprint[]
  initialStatus?: string
  onAdd: (task: Task) => void
}

function AddTaskDialog({ open, onOpenChange, sprints, initialStatus = "todo", onAdd }: AddTaskDialogProps) {
  const [form, setForm] = useState<AddTaskForm>({ ...defaultTaskForm, status: initialStatus })
  const { toast } = useToast()

  function handleSubmit() {
    if (!form.title.trim()) return
    const newTask: Task = {
      id: `task-${Date.now()}`,
      company_id: "demo-company-001",
      project_id: null,
      sprint_id: form.sprint_id || null,
      milestone_id: null,
      parent_task_id: null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      created_by: null,
      due_date: form.due_date || null,
      estimated_hours: null,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignees: [],
    }
    onAdd(newTask)
    setForm({ ...defaultTaskForm, status: initialStatus })
    onOpenChange(false)
    toast({ title: "Zadanie dodane (demo)", description: newTask.title })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj zadanie</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">Tytuł *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Tytuł zadania"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-desc">Opis</Label>
            <Textarea
              id="task-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Opcjonalny opis…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABEL).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priorytet</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                  <SelectItem value="urgent">Pilny</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-due">Termin</Label>
            <Input
              id="task-due"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          {sprints.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Sprint</Label>
              <Select value={form.sprint_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, sprint_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Brak sprintu" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak sprintu</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim()}>Dodaj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

interface TasksTabProps {
  tasks: Task[]
  sprints: Sprint[]
  onTaskClick: (task: Task) => void
  onTaskAdd: (task: Task) => void
}

function TasksTab({ tasks, sprints, onTaskClick, onTaskAdd }: TasksTabProps) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj zadanie
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tytuł</TableHead>
              <TableHead>Przypisane</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priorytet</TableHead>
              <TableHead>Termin</TableHead>
              <TableHead>Etykiety</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Brak zadań w projekcie
                </TableCell>
              </TableRow>
            )}
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
                <TableCell>
                  <AssigneeAvatars assignees={task.assignees} />
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
                <TableCell className={cn("text-sm", task.due_date && isOverdue(task.due_date) && task.status !== "done" ? "text-red-600 font-medium" : "")}>
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
      <AddTaskDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        sprints={sprints}
        onAdd={onTaskAdd}
      />
    </div>
  )
}

// ─── Kanban Tab ───────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = ["todo", "in_progress", "review", "done", "cancelled"] as const

interface KanbanTabProps {
  tasks: Task[]
  sprints: Sprint[]
  onTaskClick: (task: Task) => void
  onTaskAdd: (task: Task) => void
}

function KanbanTab({ tasks, sprints, onTaskClick, onTaskAdd }: KanbanTabProps) {
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col)
          return (
            <div key={col} className="w-60 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_STATUS_CLASS[col])}>
                    {TASK_STATUS_LABEL[col]}
                  </span>
                  <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddingInColumn(col)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTaskClick(task)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium leading-tight mb-2">{task.title}</p>
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        <AssigneeAvatars assignees={task.assignees} />
                      </div>
                      {task.due_date && (
                        <p className={cn("text-xs mt-1.5", isOverdue(task.due_date) && task.status !== "done" ? "text-red-600" : "text-muted-foreground")}>
                          {task.due_date}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <AddTaskDialog
        open={!!addingInColumn}
        onOpenChange={(open) => { if (!open) setAddingInColumn(null) }}
        sprints={sprints}
        initialStatus={addingInColumn ?? "todo"}
        onAdd={onTaskAdd}
      />
    </div>
  )
}

// ─── Sprints Tab ──────────────────────────────────────────────────────────────

interface SprintsTabProps {
  sprints: Sprint[]
  tasks: Task[]
}

function SprintsTab({ sprints, tasks }: SprintsTabProps) {
  const { toast } = useToast()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => toast({ title: "Wkrótce dostępne" })}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj sprint
        </Button>
      </div>
      {sprints.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Brak sprintów</p>
      )}
      <div className="space-y-4">
        {sprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id)
          const isActive = sprint.status === "active"
          return (
            <Card key={sprint.id} className={isActive ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{sprint.name}</CardTitle>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", SPRINT_STATUS_CLASS[sprint.status])}>
                    {SPRINT_STATUS_LABEL[sprint.status] ?? sprint.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sprint.start_date} – {sprint.end_date}
                </p>
                {sprint.goal && (
                  <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
                )}
              </CardHeader>
              {sprintTasks.length > 0 && (
                <CardContent>
                  <ul className="space-y-1">
                    {sprintTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", TASK_STATUS_CLASS[task.status])}>
                          {TASK_STATUS_LABEL[task.status]}
                        </span>
                        <span className="truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────

interface MilestonesTabProps {
  milestones: Milestone[]
  onToggle: (id: string) => void
}

function MilestonesTab({ milestones, onToggle }: MilestonesTabProps) {
  return (
    <div className="space-y-3">
      {milestones.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Brak kamieni milowych</p>
      )}
      {milestones.map((ms) => (
        <div
          key={ms.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3",
            ms.is_completed ? "opacity-70" : ""
          )}
        >
          <button
            type="button"
            onClick={() => onToggle(ms.id)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {ms.is_completed
              ? <CheckCircle2 className="h-5 w-5 text-green-600" />
              : <Circle className="h-5 w-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", ms.is_completed ? "line-through text-muted-foreground" : "")}>
              {ms.name}
            </p>
            {ms.due_date && (
              <p className={cn("text-xs mt-0.5", ms.is_completed ? "text-muted-foreground" : isOverdue(ms.due_date) ? "text-red-600" : "text-muted-foreground")}>
                {ms.is_completed ? `Ukończono: ${ms.completed_at?.slice(0, 10) ?? "—"}` : `Termin: ${ms.due_date}`}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

interface MembersTabProps {
  members: Member[]
}

function MembersTab({ members }: MembersTabProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>Rola w projekcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                Brak członków projektu
              </TableCell>
            </TableRow>
          )}
          {members.map((m) => {
            const first = m.user?.first_name ?? ""
            const last = m.user?.last_name ?? ""
            return (
              <TableRow key={m.user_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                      {initials(first, last)}
                    </span>
                    <span className="font-medium text-sm">{first} {last}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", MEMBER_ROLE_CLASS[m.role])}>
                    {MEMBER_ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialProject: Project
  initialTasks: Task[]
  initialMembers: Member[]
  initialSprints: Sprint[]
  initialMilestones: Milestone[]
}

export function ProjectDetailClient({
  initialProject,
  initialTasks,
  initialMembers,
  initialSprints,
  initialMilestones,
}: Props) {
  const [project] = useState<Project>(initialProject)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [members] = useState<Member[]>(initialMembers)
  const [sprints] = useState<Sprint[]>(initialSprints)
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const doneTasks = tasks.filter((t) => t.status === "done").length
  const totalTasks = tasks.length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  function handleTaskUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  function handleTaskAdd(task: Task) {
    setTasks((prev) => [task, ...prev])
  }

  function handleMilestoneToggle(id: string) {
    setMilestones((prev) =>
      prev.map((ms) =>
        ms.id === id
          ? { ...ms, is_completed: !ms.is_completed, completed_at: !ms.is_completed ? new Date().toISOString() : null }
          : ms
      )
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_CLASS[project.status])}>
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {project.owner && (
              <span>Właściciel: {project.owner.first_name} {project.owner.last_name}</span>
            )}
            {project.client && <span>Klient: {project.client.name}</span>}
            {project.start_date && <span>Start: {project.start_date}</span>}
            {project.end_date && <span>Termin: {project.end_date}</span>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Postęp zadań</span>
          <span className="font-medium">{doneTasks}/{totalTasks} ({pct}%)</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tasks">Zadania</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="sprints">Sprinty</TabsTrigger>
          <TabsTrigger value="milestones">Kamienie milowe</TabsTrigger>
          <TabsTrigger value="members">Członkowie</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TasksTab
            tasks={tasks}
            sprints={sprints}
            onTaskClick={setSelectedTask}
            onTaskAdd={handleTaskAdd}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <KanbanTab
            tasks={tasks}
            sprints={sprints}
            onTaskClick={setSelectedTask}
            onTaskAdd={handleTaskAdd}
          />
        </TabsContent>

        <TabsContent value="sprints" className="mt-4">
          <SprintsTab sprints={sprints} tasks={tasks} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <MilestonesTab milestones={milestones} onToggle={handleMilestoneToggle} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab members={members} />
        </TabsContent>
      </Tabs>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        sprints={sprints}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
      />
    </div>
  )
}
