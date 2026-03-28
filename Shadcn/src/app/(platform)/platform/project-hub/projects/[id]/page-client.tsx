"use client"

import { useState, useTransition, useEffect, useRef } from "react"
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Plus, CheckCircle2, Circle, Play, Square, ChevronDown, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react"
import { startSprint, closeSprint, createSprint, moveTaskToSprint, addComment, createSubtask } from "@/app/actions/projecthub"
import { createClient } from "@/lib/supabase/client"
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

// ─── Comment type ─────────────────────────────────────────────────────────────

interface TaskComment {
  id: string
  task_id: string
  author_id: string | null
  body: string
  created_at: string
  author?: { first_name: string; last_name: string } | null
}

// ─── Task Detail Sheet ────────────────────────────────────────────────────────

interface TaskSheetProps {
  task: Task | null
  sprints: Sprint[]
  allTasks: Task[]
  projectId: string
  companyId: string
  onClose: () => void
  onUpdate: (updated: Task) => void
  onSubtaskAdd: (subtask: Task) => void
}

function TaskDetailSheet({ task, sprints, allTasks, projectId, companyId, onClose, onUpdate, onSubtaskAdd }: TaskSheetProps) {
  const { toast } = useToast()
  const [local, setLocal] = useState<Task | null>(task)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [subtaskInput, setSubtaskInput] = useState("")
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Sync local state when task changes
  if (task?.id !== local?.id) {
    setLocal(task)
    setComments([])
    setNewComment("")
    setSubtaskInput("")
    setShowSubtaskInput(false)
  }

  // Fetch comments when task opens
  useEffect(() => {
    if (!task?.id) return
    setCommentsLoading(true)
    const supabase = createClient()
    ;(supabase as any)
      .from("task_comments")
      .select("*, author:users(first_name, last_name)")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: TaskComment[] | null }) => {
        setComments(data ?? [])
        setCommentsLoading(false)
      })
  }, [task?.id])

  const subtasks = allTasks.filter((t) => t.parent_task_id === local?.id)

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

  function handleAddComment() {
    if (!local || !newComment.trim()) return
    startTransition(async () => {
      const result = await addComment(local.id, newComment, projectId)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        setComments((prev) => [...prev, result.data as TaskComment])
        setNewComment("")
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    })
  }

  function handleAddSubtask() {
    if (!local || !subtaskInput.trim()) return
    startTransition(async () => {
      const result = await createSubtask(local.id, subtaskInput, projectId, companyId)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onSubtaskAdd(result.data as Task)
        setSubtaskInput("")
        setShowSubtaskInput(false)
        toast({ title: "Podzadanie dodane" })
      }
    })
  }

  function formatCommentTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Sheet open={!!task} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        {local && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 pb-4 border-b">
              <SheetHeader>
                <div className="flex items-start gap-2 pr-8">
                  <SheetTitle className="text-left text-base leading-snug flex-1">{local.title}</SheetTitle>
                  <a
                    href={`/platform/project-hub/tasks/${local.id}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Otwórz pełną stronę zadania"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                  </a>
                </div>
              </SheetHeader>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_STATUS_CLASS[local.status])}>
                  {TASK_STATUS_LABEL[local.status]}
                </span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_CLASS[local.priority])}>
                  {PRIORITY_LABEL[local.priority]}
                </span>
                {local.due_date && (
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700",
                    isOverdue(local.due_date) && local.status !== "done" ? "bg-red-100 text-red-700" : "")}>
                    {local.due_date}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Description */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opis</Label>
                <Textarea rows={3} value={local.description ?? ""}
                  onChange={(e) => setLocal((t) => t ? { ...t, description: e.target.value } : t)}
                  placeholder="Brak opisu…" className="text-sm resize-none" />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                  <Select value={local.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niski</SelectItem>
                      <SelectItem value="medium">Średni</SelectItem>
                      <SelectItem value="high">Wysoki</SelectItem>
                      <SelectItem value="urgent">Pilny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sprint */}
              {sprints.length > 0 && (
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sprint</Label>
                  <Select value={local.sprint_id ?? "none"}
                    onValueChange={(v) => setLocal((t) => t ? { ...t, sprint_id: v === "none" ? null : v } : t)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Brak sprintu" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak sprintu</SelectItem>
                      {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Assignees */}
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

              {/* Labels */}
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

              {/* ── Subtasks ─────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Podzadania {subtasks.length > 0 && <span className="ml-1 text-foreground">{subtasks.filter(t => t.status === "done").length}/{subtasks.length}</span>}
                  </p>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                    onClick={() => setShowSubtaskInput((v) => !v)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Dodaj
                  </Button>
                </div>

                {subtasks.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {subtasks.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
                        <button
                          className="shrink-0"
                          onClick={() => onUpdate({ ...sub, status: sub.status === "done" ? "todo" : "done" })}
                        >
                          {sub.status === "done"
                            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                            : <Circle className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                        <span className={cn("flex-1 truncate", sub.status === "done" ? "line-through text-muted-foreground" : "")}>
                          {sub.title}
                        </span>
                        <span className={cn("shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[sub.priority])}>
                          {PRIORITY_LABEL[sub.priority]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {showSubtaskInput && (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Tytuł podzadania…"
                      value={subtaskInput}
                      className="h-8 text-sm"
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask()
                        if (e.key === "Escape") setShowSubtaskInput(false)
                      }}
                    />
                    <Button size="sm" className="h-8 shrink-0" disabled={isPending} onClick={handleAddSubtask}>Dodaj</Button>
                  </div>
                )}
              </div>

              {/* ── Comments ─────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Komentarze {comments.length > 0 && `(${comments.length})`}
                </p>

                {commentsLoading ? (
                  <p className="text-xs text-muted-foreground">Ładowanie…</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Brak komentarzy</p>
                ) : (
                  <div className="space-y-3 mb-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          {c.author ? initials(c.author.first_name, c.author.last_name) : "?"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium">
                              {c.author ? `${c.author.first_name} ${c.author.last_name}` : "Użytkownik"}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatCommentTime(c.created_at)}</span>
                          </div>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}

                {/* Add comment */}
                <div className="flex gap-2 mt-2">
                  <Textarea
                    rows={2}
                    placeholder="Napisz komentarz…"
                    value={newComment}
                    className="text-sm resize-none"
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment()
                    }}
                  />
                </div>
                <Button size="sm" className="mt-2" disabled={isPending || !newComment.trim()}
                  onClick={handleAddComment}>
                  Wyślij komentarz
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter aby wysłać</p>
              </div>

            </div>
          </div>
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
                <TableCell className="max-w-[220px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium truncate text-sm">{task.title}</span>
                    {tasks.filter((t) => t.parent_task_id === task.id).length > 0 && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {tasks.filter((t) => t.parent_task_id === task.id && t.status === "done").length}/
                        {tasks.filter((t) => t.parent_task_id === task.id).length}
                      </span>
                    )}
                  </div>
                </TableCell>
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
  projectId: string
  onSprintsChange: (s: Sprint[]) => void
  onTasksChange: (t: Task[]) => void
}

function SprintsTab({ sprints, tasks, projectId, onSprintsChange, onTasksChange }: SprintsTabProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({})
  const [showBacklog, setShowBacklog] = useState(true)
  const [showAddSprint, setShowAddSprint] = useState(false)
  const [addSprintForm, setAddSprintForm] = useState({ name: "", startDate: "", endDate: "", goal: "" })
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)

  const backlogTasks = tasks.filter((t) => !t.sprint_id && t.status !== "done" && t.status !== "cancelled")
  const hasActiveSprint = sprints.some((s) => s.status === "active")

  // Velocity chart data
  const velocityData = sprints
    .filter((s) => s.status !== "planning")
    .map((s) => {
      const st = tasks.filter((t) => t.sprint_id === s.id)
      return {
        name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
        Zaplanowane: st.length,
        Ukończone: st.filter((t) => t.status === "done").length,
      }
    })

  function toggleExpand(id: string) {
    setExpandedSprints((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleStartSprint(sprint: Sprint) {
    startTransition(async () => {
      const result = await startSprint(sprint.id, projectId)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onSprintsChange(sprints.map((s) => s.id === sprint.id ? { ...s, status: "active" } : s))
        toast({ title: `Sprint „${sprint.name}" uruchomiony` })
      }
    })
  }

  function handleCloseSprint(sprint: Sprint) {
    startTransition(async () => {
      const result = await closeSprint(sprint.id, projectId)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onSprintsChange(sprints.map((s) => s.id === sprint.id ? { ...s, status: "completed" } : s))
        onTasksChange(tasks.map((t) =>
          t.sprint_id === sprint.id && t.status !== "done" && t.status !== "cancelled"
            ? { ...t, sprint_id: null }
            : t
        ))
        toast({ title: `Sprint „${sprint.name}" zamknięty`, description: "Niezakończone zadania wróciły do backlogu." })
      }
    })
  }

  function handleMoveToSprint(taskId: string, sprintId: string | null) {
    startTransition(async () => {
      const result = await moveTaskToSprint(taskId, sprintId, projectId)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onTasksChange(tasks.map((t) => t.id === taskId ? { ...t, sprint_id: sprintId } : t))
        setMovingTaskId(null)
      }
    })
  }

  function handleAddSprint() {
    if (!addSprintForm.name || !addSprintForm.startDate || !addSprintForm.endDate) {
      toast({ title: "Wypełnij nazwę i daty sprintu", variant: "destructive" })
      return
    }
    startTransition(async () => {
      const result = await createSprint({
        projectId,
        name: addSprintForm.name,
        startDate: addSprintForm.startDate,
        endDate: addSprintForm.endDate,
        goal: addSprintForm.goal || undefined,
      })
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onSprintsChange([...sprints, result.data as Sprint])
        setShowAddSprint(false)
        setAddSprintForm({ name: "", startDate: "", endDate: "", goal: "" })
        toast({ title: "Sprint dodany" })
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {sprints.length} sprintów · {backlogTasks.length} zadań w backlogu
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddSprint(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nowy sprint
        </Button>
      </div>

      {/* Add Sprint Dialog */}
      {showAddSprint && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nazwa sprintu *</Label>
                <Input
                  placeholder="np. Sprint 3 — Integracja"
                  value={addSprintForm.name}
                  onChange={(e) => setAddSprintForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Data rozpoczęcia *</Label>
                <Input type="date" value={addSprintForm.startDate}
                  onChange={(e) => setAddSprintForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Data zakończenia *</Label>
                <Input type="date" value={addSprintForm.endDate}
                  onChange={(e) => setAddSprintForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Cel sprintu</Label>
                <Input placeholder="Co chcemy osiągnąć w tym sprincie?"
                  value={addSprintForm.goal}
                  onChange={(e) => setAddSprintForm((f) => ({ ...f, goal: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAddSprint(false)}>Anuluj</Button>
              <Button size="sm" onClick={handleAddSprint} disabled={isPending}>Dodaj sprint</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Velocity chart — only if completed sprints exist */}
      {velocityData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prędkość sprintów</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={velocityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Zaplanowane" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Ukończone"   fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sprints */}
      {sprints.length === 0 && !showAddSprint && (
        <p className="text-sm text-muted-foreground py-8 text-center">Brak sprintów — dodaj pierwszy sprint powyżej</p>
      )}

      <div className="space-y-3">
        {[...sprints].sort((a, b) => {
          const order = { active: 0, planning: 1, completed: 2 }
          return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
        }).map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id)
          const doneCnt = sprintTasks.filter((t) => t.status === "done").length
          const totalHours = sprintTasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
          const CAPACITY = 40 // hours per sprint default
          const capacityPct = Math.min(100, Math.round((totalHours / CAPACITY) * 100))
          const isActive = sprint.status === "active"
          const isExpanded = expandedSprints[sprint.id] !== false // default open

          return (
            <Card key={sprint.id} className={cn(
              "transition-colors",
              isActive ? "border-blue-400 bg-blue-50/40 dark:bg-blue-950/20" : ""
            )}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleExpand(sprint.id)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    }
                    <CardTitle className="text-sm font-semibold truncate">{sprint.name}</CardTitle>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", SPRINT_STATUS_CLASS[sprint.status])}>
                      {SPRINT_STATUS_LABEL[sprint.status] ?? sprint.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {sprint.status === "planning" && !hasActiveSprint && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                        disabled={isPending} onClick={() => handleStartSprint(sprint)}>
                        <Play className="h-3 w-3 mr-1" />
                        Uruchom
                      </Button>
                    )}
                    {sprint.status === "active" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
                        disabled={isPending} onClick={() => handleCloseSprint(sprint)}>
                        <Square className="h-3 w-3 mr-1" />
                        Zamknij sprint
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">{doneCnt}/{sprintTasks.length}</span>
                  </div>
                </div>

                <div className="pl-6 space-y-1">
                  <p className="text-xs text-muted-foreground">{sprint.start_date} – {sprint.end_date}</p>
                  {sprint.goal && <p className="text-xs text-muted-foreground italic">"{sprint.goal}"</p>}

                  {/* Capacity bar */}
                  {totalHours > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", capacityPct > 90 ? "bg-red-500" : capacityPct > 70 ? "bg-orange-400" : "bg-green-500")}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{totalHours}h / {CAPACITY}h</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {sprintTasks.length > 0 && (
                    <Progress value={sprintTasks.length > 0 ? Math.round((doneCnt / sprintTasks.length) * 100) : 0} className="h-1" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-3">
                  {sprintTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6 py-2">Brak zadań w tym sprincie</p>
                  ) : (
                    <ul className="space-y-1 pl-6">
                      {sprintTasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", TASK_STATUS_CLASS[task.status])}>
                              {TASK_STATUS_LABEL[task.status]}
                            </span>
                            <span className="truncate text-sm">{task.title}</span>
                          </div>
                          <Button
                            size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground shrink-0"
                            disabled={isPending}
                            onClick={() => handleMoveToSprint(task.id, null)}
                            title="Przenieś do backlogu"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Backlog */}
      <div>
        <button
          className="flex items-center gap-2 text-sm font-medium mb-3 hover:text-foreground text-muted-foreground transition-colors"
          onClick={() => setShowBacklog((v) => !v)}
        >
          {showBacklog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Backlog
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{backlogTasks.length}</span>
        </button>

        {showBacklog && (
          <Card>
            <CardContent className="py-3">
              {backlogTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Backlog pusty — wszystkie zadania w sprintach</p>
              ) : (
                <ul className="space-y-1">
                  {backlogTasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        <span className="truncate text-sm">{task.title}</span>
                      </div>
                      {/* Move to sprint dropdown */}
                      {sprints.filter((s) => s.status !== "completed").length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {movingTaskId === task.id ? (
                            <>
                              {sprints.filter((s) => s.status !== "completed").map((s) => (
                                <Button key={s.id} size="sm" variant="outline" className="h-6 text-xs px-2"
                                  disabled={isPending}
                                  onClick={() => handleMoveToSprint(task.id, s.id)}>
                                  {s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name}
                                </Button>
                              ))}
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-1"
                                onClick={() => setMovingTaskId(null)}>✕</Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground"
                              onClick={() => setMovingTaskId(task.id)} title="Dodaj do sprintu">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Do sprintu
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
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

// ─── Gantt Tab ────────────────────────────────────────────────────────────────

interface GanttTabProps {
  project: Project
  tasks: Task[]
  sprints: Sprint[]
  milestones: Milestone[]
  onTaskClick: (task: Task) => void
}

type GanttRow =
  | { kind: "sprint";    sprint: Sprint;    tasks: Task[] }
  | { kind: "backlog";   tasks: Task[] }
  | { kind: "milestone"; milestone: Milestone }

const GANTT_PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500",
  high:   "bg-orange-400",
  medium: "bg-blue-400",
  low:    "bg-gray-300",
}

const GANTT_STATUS_OPACITY: Record<string, string> = {
  done:   "opacity-40",
  cancelled: "opacity-30",
}

function ganttDate(dateStr: string | null | undefined, fallback: string): Date {
  if (dateStr) return new Date(dateStr)
  return new Date(fallback)
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function GanttBar({
  start,
  end,
  rangeStart,
  totalDays,
  label,
  colorClass,
  opacityClass,
  onClick,
  title,
}: {
  start: Date; end: Date; rangeStart: Date; totalDays: number
  label: string; colorClass: string; opacityClass?: string
  onClick?: () => void; title?: string
}) {
  const dayMs = 86_400_000
  const startOff = Math.max(0, (start.getTime() - rangeStart.getTime()) / dayMs)
  const endOff   = Math.min(totalDays, (end.getTime()   - rangeStart.getTime()) / dayMs)
  const left  = clamp((startOff / totalDays) * 100, 0, 100)
  const width = clamp(((endOff - startOff) / totalDays) * 100, 0.5, 100 - left)

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded cursor-pointer flex items-center px-1.5 text-[10px] text-white font-medium truncate select-none ${colorClass} ${opacityClass ?? ""}`}
      style={{ left: `${left}%`, width: `${width}%` }}
      onClick={onClick}
      title={title}
    >
      {width > 4 && label}
    </div>
  )
}

function GanttDiamondMarker({
  date,
  rangeStart,
  totalDays,
  label,
  done,
}: {
  date: Date; rangeStart: Date; totalDays: number; label: string; done: boolean
}) {
  const dayMs = 86_400_000
  const off = (date.getTime() - rangeStart.getTime()) / dayMs
  const pct = clamp((off / totalDays) * 100, 0, 100)
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${pct}%` }}
      title={label}
    >
      <div
        className={`w-3 h-3 rotate-45 border-2 ${done ? "bg-green-400 border-green-600" : "bg-amber-400 border-amber-600"}`}
      />
    </div>
  )
}

function GanttTodayLine({
  today,
  rangeStart,
  totalDays,
}: { today: Date; rangeStart: Date; totalDays: number }) {
  const dayMs = 86_400_000
  const off = (today.getTime() - rangeStart.getTime()) / dayMs
  if (off < 0 || off > totalDays) return null
  const pct = (off / totalDays) * 100
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-purple-500/60 pointer-events-none z-10"
      style={{ left: `${pct}%` }}
    />
  )
}

function GanttTab({ project, tasks, sprints, milestones, onTaskClick }: GanttTabProps) {
  // Compute range: project start/end, fallback to min/max of tasks & sprints
  const allDates: Date[] = []
  if (project.start_date) allDates.push(new Date(project.start_date))
  if (project.end_date)   allDates.push(new Date(project.end_date))
  sprints.forEach(s => { allDates.push(new Date(s.start_date)); allDates.push(new Date(s.end_date)) })
  milestones.forEach(m => { if (m.due_date) allDates.push(new Date(m.due_date)) })
  tasks.forEach(t => { if (t.due_date) allDates.push(new Date(t.due_date)) })

  const today = new Date(); today.setHours(0, 0, 0, 0)

  let rangeStart = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : new Date(today.getTime() - 7 * 86_400_000)
  let rangeEnd = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date(today.getTime() + 30 * 86_400_000)

  // Pad by 3 days each side
  rangeStart = new Date(rangeStart.getTime() - 3 * 86_400_000)
  rangeEnd   = new Date(rangeEnd.getTime()   + 3 * 86_400_000)
  const totalDays = Math.max(1, (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000)

  // Build month markers
  const monthMarkers: { label: string; pct: number }[] = []
  const PL_MONTHS = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"]
  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cur <= rangeEnd) {
    const off = (cur.getTime() - rangeStart.getTime()) / 86_400_000
    monthMarkers.push({ label: `${PL_MONTHS[cur.getMonth()]} ${cur.getFullYear()}`, pct: (off / totalDays) * 100 })
    cur.setMonth(cur.getMonth() + 1)
  }

  // Group tasks
  const sprintMap: Record<string, Task[]> = {}
  const backlogTasks: Task[] = []
  tasks.filter(t => !t.parent_task_id).forEach(t => {
    if (t.sprint_id) {
      if (!sprintMap[t.sprint_id]) sprintMap[t.sprint_id] = []
      sprintMap[t.sprint_id].push(t)
    } else {
      backlogTasks.push(t)
    }
  })

  const rows: GanttRow[] = [
    ...sprints.map(s => ({ kind: "sprint" as const, sprint: s, tasks: sprintMap[s.id] ?? [] })),
    ...(backlogTasks.length > 0 ? [{ kind: "backlog" as const, tasks: backlogTasks }] : []),
    ...milestones.map(m => ({ kind: "milestone" as const, milestone: m })),
  ]

  const ROW_H = 40
  const TASK_H = 28
  const LABEL_W = 220

  if (tasks.length === 0 && sprints.length === 0 && milestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm border rounded-lg border-dashed">
        Brak danych do wyświetlenia wykresu Gantta. Dodaj sprinty, zadania lub kamienie milowe.
      </div>
    )
  }

  return (
    <div className="overflow-auto border rounded-lg">
      {/* Header */}
      <div className="flex sticky top-0 z-20 bg-muted/90 backdrop-blur border-b">
        <div
          className="shrink-0 border-r flex items-center px-3 text-xs font-semibold text-muted-foreground"
          style={{ width: LABEL_W }}
        >
          Zakres
        </div>
        <div className="relative flex-1 min-w-[600px] h-8">
          {monthMarkers.map(m => (
            <span
              key={m.label}
              className="absolute text-[10px] text-muted-foreground top-1/2 -translate-y-1/2 pl-1 border-l border-muted"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
          <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, ri) => {
        if (row.kind === "milestone") {
          const { milestone } = row
          return (
            <div key={milestone.id} className="flex border-b hover:bg-muted/20" style={{ height: ROW_H }}>
              <div
                className="shrink-0 border-r flex items-center px-3 gap-1.5"
                style={{ width: LABEL_W }}
              >
                <span className="text-amber-500 text-xs">◆</span>
                <span className="text-xs truncate">{milestone.name}</span>
                {milestone.is_completed && (
                  <span className="text-[10px] text-green-600 ml-auto">✓</span>
                )}
              </div>
              <div className="relative flex-1 min-w-[600px]">
                <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
                {milestone.due_date && (
                  <GanttDiamondMarker
                    date={new Date(milestone.due_date)}
                    rangeStart={rangeStart}
                    totalDays={totalDays}
                    label={milestone.name}
                    done={milestone.is_completed}
                  />
                )}
              </div>
            </div>
          )
        }

        if (row.kind === "backlog") {
          const { tasks: bTasks } = row
          return (
            <div key="backlog-group">
              {/* Backlog header row */}
              <div className="flex bg-muted/40 border-b" style={{ height: ROW_H }}>
                <div
                  className="shrink-0 border-r flex items-center px-3"
                  style={{ width: LABEL_W }}
                >
                  <span className="text-xs font-semibold text-muted-foreground">Backlog</span>
                </div>
                <div className="relative flex-1 min-w-[600px]">
                  <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
                </div>
              </div>
              {/* Backlog task rows */}
              {bTasks.map(task => {
                const tStart = ganttDate(task.created_at, rangeStart.toISOString())
                const tEnd   = ganttDate(task.due_date,   new Date(tStart.getTime() + 86_400_000).toISOString())
                return (
                  <div key={task.id} className="flex border-b hover:bg-muted/10" style={{ height: TASK_H }}>
                    <div
                      className="shrink-0 border-r flex items-center px-3 pl-6 gap-1"
                      style={{ width: LABEL_W }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${GANTT_PRIORITY_COLOR[task.priority] ?? "bg-gray-300"}`} />
                      <span className="text-xs truncate text-muted-foreground">{task.title}</span>
                    </div>
                    <div className="relative flex-1 min-w-[600px]">
                      <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
                      <GanttBar
                        start={tStart} end={tEnd}
                        rangeStart={rangeStart} totalDays={totalDays}
                        label={task.title}
                        colorClass={GANTT_PRIORITY_COLOR[task.priority] ?? "bg-gray-300"}
                        opacityClass={GANTT_STATUS_OPACITY[task.status]}
                        onClick={() => onTaskClick(task)}
                        title={`${task.title} · ${task.priority} · ${task.status}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        // kind === "sprint"
        const { sprint, tasks: sTasks } = row
        const sprintStart = new Date(sprint.start_date)
        const sprintEnd   = new Date(sprint.end_date)
        const sprintColorClass = sprint.status === "active" ? "bg-purple-500" : sprint.status === "completed" ? "bg-green-500" : "bg-slate-400"

        return (
          <div key={sprint.id}>
            {/* Sprint header row */}
            <div className="flex bg-muted/40 border-b" style={{ height: ROW_H }}>
              <div
                className="shrink-0 border-r flex items-center px-3 gap-1.5"
                style={{ width: LABEL_W }}
              >
                <span className="text-xs font-semibold truncate">{sprint.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ml-auto ${sprintColorClass}`}>
                  {sprint.status === "active" ? "Aktywny" : sprint.status === "completed" ? "Ukończony" : "Plan."}
                </span>
              </div>
              <div className="relative flex-1 min-w-[600px]">
                <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
                <GanttBar
                  start={sprintStart} end={sprintEnd}
                  rangeStart={rangeStart} totalDays={totalDays}
                  label={sprint.name}
                  colorClass={`${sprintColorClass} opacity-30`}
                  title={`${sprint.name} · ${sprint.start_date} → ${sprint.end_date}`}
                />
              </div>
            </div>
            {/* Sprint task rows */}
            {sTasks.map(task => {
              const tStart = ganttDate(task.created_at, sprint.start_date)
              const tEnd   = ganttDate(task.due_date,   sprint.end_date)
              return (
                <div key={task.id} className="flex border-b hover:bg-muted/10" style={{ height: TASK_H }}>
                  <div
                    className="shrink-0 border-r flex items-center px-3 pl-6 gap-1"
                    style={{ width: LABEL_W }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${GANTT_PRIORITY_COLOR[task.priority] ?? "bg-gray-300"}`} />
                    <span className="text-xs truncate text-muted-foreground">{task.title}</span>
                  </div>
                  <div className="relative flex-1 min-w-[600px]">
                    <GanttTodayLine today={today} rangeStart={rangeStart} totalDays={totalDays} />
                    <GanttBar
                      start={tStart} end={tEnd}
                      rangeStart={rangeStart} totalDays={totalDays}
                      label={task.title}
                      colorClass={GANTT_PRIORITY_COLOR[task.priority] ?? "bg-gray-300"}
                      opacityClass={GANTT_STATUS_OPACITY[task.status]}
                      onClick={() => onTaskClick(task)}
                      title={`${task.title} · ${task.priority} · ${task.status}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
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
  companyId?: string
}

export function ProjectDetailClient({
  initialProject,
  initialTasks,
  initialMembers,
  initialSprints,
  initialMilestones,
  companyId = "",
}: Props) {
  const [project] = useState<Project>(initialProject)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [members] = useState<Member[]>(initialMembers)
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints)
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
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
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
          <SprintsTab
            sprints={sprints}
            tasks={tasks}
            projectId={project.id}
            onSprintsChange={setSprints}
            onTasksChange={setTasks}
          />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <MilestonesTab milestones={milestones} onToggle={handleMilestoneToggle} />
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <GanttTab
            project={project}
            tasks={tasks}
            sprints={sprints}
            milestones={milestones}
            onTaskClick={setSelectedTask}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab members={members} />
        </TabsContent>
      </Tabs>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        sprints={sprints}
        allTasks={tasks}
        projectId={project.id}
        companyId={companyId}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onSubtaskAdd={handleTaskAdd}
      />
    </div>
  )
}
