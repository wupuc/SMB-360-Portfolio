"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Clock, Calendar, User, Tag, AlertTriangle,
  CheckCircle2, Circle, MessageSquare, ChevronRight,
  Plus, Send, Pencil, Check, X, ExternalLink, Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { addComment, updateTask, createSubtask } from "@/app/actions/projecthub"
import type { Task } from "@/lib/supabase/projecthub-server"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TaskComment = {
  id: string
  body: string
  created_at: string
  author: { first_name: string; last_name: string } | null
}

interface Props {
  task: Task
  comments: TaskComment[]
  subtasks: Task[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "todo",        label: "Do zrobienia",  color: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "W toku",         color: "bg-blue-100 text-blue-700" },
  { value: "review",      label: "Review",          color: "bg-purple-100 text-purple-700" },
  { value: "done",        label: "Gotowe",          color: "bg-green-100 text-green-700" },
]

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Pilne",   color: "text-red-600",    dot: "bg-red-500"    },
  { value: "high",   label: "Wysoki",  color: "text-orange-600", dot: "bg-orange-400" },
  { value: "medium", label: "Średni",  color: "text-blue-600",   dot: "bg-blue-400"   },
  { value: "low",    label: "Niski",   color: "text-gray-500",   dot: "bg-gray-300"   },
]

function statusConfig(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0]
}
function priorityConfig(p: string) {
  return PRIORITY_OPTIONS.find(o => o.value === p) ?? PRIORITY_OPTIONS[2]
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function avatarColor(name: string) {
  const colors = ["bg-purple-500","bg-blue-500","bg-green-500","bg-orange-500","bg-rose-500","bg-teal-500"]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pl-PL", { day:"numeric", month:"short", year:"numeric" })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

function isOverdue(due: string | null | undefined, status: string) {
  if (!due || status === "done") return false
  return new Date(due) < new Date()
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ firstName, lastName, size = "md" }: { firstName: string; lastName: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs"
  return (
    <div className={`${sz} ${avatarColor(firstName + lastName)} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials(firstName, lastName)}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig(status)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig(priority)
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Subtask row ───────────────────────────────────────────────────────────────

function SubtaskRow({ subtask, onToggle }: { subtask: Task; onToggle: (id: string, done: boolean) => void }) {
  const done = subtask.status === "done"
  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border transition-colors ${done ? "bg-muted/40 border-transparent" : "bg-background border-border hover:border-muted-foreground/30"}`}>
      <button
        onClick={() => onToggle(subtask.id, !done)}
        className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        {done
          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
          : <Circle className="w-4 h-4" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${done ? "line-through text-muted-foreground" : ""}`}>
          {subtask.title}
        </p>
        {subtask.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtask.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={subtask.priority} />
        {subtask.due_date && (
          <span className="text-[11px] text-muted-foreground">{formatDate(subtask.due_date)}</span>
        )}
      </div>
    </div>
  )
}

// ─── Comment bubble ────────────────────────────────────────────────────────────

function CommentBubble({ comment }: { comment: TaskComment }) {
  const author = comment.author
  const name   = author ? `${author.first_name} ${author.last_name}` : "Nieznany"
  return (
    <div className="flex gap-3">
      <Avatar firstName={author?.first_name ?? "?"} lastName={author?.last_name ?? "?"} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold">{name}</span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(comment.created_at)}</span>
        </div>
        <div className="text-sm bg-muted/50 rounded-lg rounded-tl-none px-3 py-2 whitespace-pre-wrap leading-relaxed">
          {comment.body}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function TaskDetailPageClient({ task: initialTask, comments: initialComments, subtasks: initialSubtasks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [task,      setTask]      = useState(initialTask)
  const [comments,  setComments]  = useState(initialComments)
  const [subtasks,  setSubtasks]  = useState(initialSubtasks)

  const [commentBody, setCommentBody] = useState("")
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle,  setSubtaskTitle]  = useState("")
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [titleDraft,    setTitleDraft]    = useState(task.title)
  const [editingDesc,   setEditingDesc]   = useState(false)
  const [descDraft,     setDescDraft]     = useState(task.description ?? "")

  const commentsEndRef  = useRef<HTMLDivElement>(null)
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [comments.length])

  useEffect(() => {
    if (addingSubtask) subtaskInputRef.current?.focus()
  }, [addingSubtask])

  const doneCount  = subtasks.filter(s => s.status === "done").length
  const totalCount = subtasks.length
  const overdue    = isOverdue(task.due_date, task.status)

  // ── Mutations ────────────────────────────────────────────────────────────────

  function handleStatusChange(status: string) {
    setTask(t => ({ ...t, status }))
    startTransition(async () => {
      await updateTask({ id: task.id, projectId: task.project_id ?? "", status })
    })
  }

  function handlePriorityChange(priority: string) {
    setTask(t => ({ ...t, priority }))
    startTransition(async () => {
      await updateTask({ id: task.id, projectId: task.project_id ?? "", priority })
    })
  }

  function handleSaveTitle() {
    if (!titleDraft.trim() || titleDraft === task.title) { setEditingTitle(false); return }
    setTask(t => ({ ...t, title: titleDraft.trim() }))
    setEditingTitle(false)
    startTransition(async () => {
      await updateTask({ id: task.id, projectId: task.project_id ?? "", title: titleDraft.trim() })
    })
  }

  function handleSaveDesc() {
    setTask(t => ({ ...t, description: descDraft }))
    setEditingDesc(false)
    startTransition(async () => {
      await updateTask({ id: task.id, projectId: task.project_id ?? "", description: descDraft })
    })
  }

  function handleSendComment() {
    if (!commentBody.trim()) return
    const body = commentBody.trim()
    setCommentBody("")
    const optimistic: TaskComment = {
      id: `opt-${Date.now()}`,
      body,
      created_at: new Date().toISOString(),
      author: null,
    }
    setComments(c => [...c, optimistic])
    startTransition(async () => {
      await addComment(task.id, body, task.project_id ?? "")
    })
  }

  function handleToggleSubtask(id: string, done: boolean) {
    setSubtasks(s => s.map(st => st.id === id ? { ...st, status: done ? "done" : "todo" } : st))
    startTransition(async () => {
      await updateTask({ id, projectId: task.project_id ?? "", status: done ? "done" : "todo" })
    })
  }

  function handleAddSubtask() {
    if (!subtaskTitle.trim()) { setAddingSubtask(false); return }
    const title = subtaskTitle.trim()
    setSubtaskTitle("")
    setAddingSubtask(false)
    const optimistic: Task = {
      id: `opt-sub-${Date.now()}`,
      company_id: task.company_id ?? "",
      project_id: task.project_id,
      sprint_id: task.sprint_id,
      milestone_id: null,
      parent_task_id: task.id,
      title,
      description: null,
      status: "todo",
      priority: "medium",
      created_by: "",
      due_date: null,
      estimated_hours: null,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: null,
      assignees: [],
    }
    setSubtasks(s => [...s, optimistic])
    startTransition(async () => {
      await createSubtask(task.id, title, task.project_id ?? "", task.company_id ?? "")
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <Link href="/platform/project-hub/projects" className="hover:underline shrink-0">ProjectHub</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {task.project_id && (
              <>
                <Link href={`/platform/project-hub/projects/${task.project_id}`} className="hover:underline truncate max-w-[160px]">
                  {task.project?.name ?? "Projekt"}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </>
            )}
            <span className="truncate max-w-[200px] text-foreground font-medium">{task.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPending && <span className="text-xs text-muted-foreground">Zapisywanie...</span>}
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-hidden flex">
        {/* ── Main content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Title */}
          <div>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditingTitle(false) }}
                  className="text-2xl font-bold h-auto py-1 px-2 border-primary"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTitle}><Check className="h-4 w-4 text-green-600" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTitle(false)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="group flex items-start gap-2">
                <h1 className="text-2xl font-bold leading-snug flex-1">{task.title}</h1>
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
                  onClick={() => { setTitleDraft(task.title); setEditingTitle(true) }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <PriorityBadge priority={task.priority} />
              {overdue && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Zaległe
                </span>
              )}
              {task.labels && task.labels.length > 0 && task.labels.map(l => (
                <Badge key={l} variant="outline" className="text-[11px] h-5">{l}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Opis</h2>
              {!editingDesc && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setDescDraft(task.description ?? ""); setEditingDesc(true) }}>
                  <Pencil className="h-3 w-3" /> Edytuj
                </Button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  rows={8}
                  placeholder="Dodaj opis zadania..."
                  className="text-sm resize-none font-mono"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDesc}>Zapisz</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingDesc(false)}>Anuluj</Button>
                </div>
              </div>
            ) : task.description ? (
              <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4">
                {task.description}
              </div>
            ) : (
              <button
                onClick={() => { setDescDraft(""); setEditingDesc(true) }}
                className="text-sm text-muted-foreground italic hover:text-foreground transition-colors"
              >
                + Dodaj opis…
              </button>
            )}
          </section>

          {/* Subtasks */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Podzadania</h2>
                {totalCount > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {doneCount}/{totalCount}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setAddingSubtask(true)}>
                <Plus className="h-3 w-3" /> Dodaj
              </Button>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {subtasks.map(s => (
                <SubtaskRow key={s.id} subtask={s} onToggle={handleToggleSubtask} />
              ))}
            </div>

            {addingSubtask && (
              <div className="flex items-center gap-2 mt-2">
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  ref={subtaskInputRef}
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  placeholder="Tytuł podzadania..."
                  className="h-8 text-sm flex-1"
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddSubtask()
                    if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle("") }
                  }}
                />
                <Button size="sm" className="h-8" onClick={handleAddSubtask}>Dodaj</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingSubtask(false); setSubtaskTitle("") }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {subtasks.length === 0 && !addingSubtask && (
              <p className="text-xs text-muted-foreground italic">Brak podzadań.</p>
            )}
          </section>

          {/* Comments */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Komentarze</h2>
              {comments.length > 0 && (
                <span className="text-xs text-muted-foreground">({comments.length})</span>
              )}
            </div>

            <div className="space-y-4 mb-4">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Brak komentarzy. Bądź pierwszy!</p>
              )}
              {comments.map(c => <CommentBubble key={c.id} comment={c} />)}
              <div ref={commentsEndRef} />
            </div>

            {/* Add comment */}
            <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
              <Textarea
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendComment()
                }}
                placeholder="Napisz komentarz… (Ctrl+Enter aby wysłać)"
                rows={3}
                className="resize-none text-sm border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
              />
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handleSendComment} disabled={!commentBody.trim()}>
                  <Send className="h-3.5 w-3.5" />
                  Wyślij
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="w-64 border-l bg-muted/20 overflow-y-auto px-4 py-5 space-y-6 shrink-0">

          {/* Priority */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Priorytet</p>
            <Select value={task.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${o.dot}`} />
                      {o.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Przypisani</p>
            {task.assignees && task.assignees.length > 0 ? (
              <div className="space-y-1.5">
                {task.assignees.map((a, i) => {
                  const u = a.user
                  if (!u) return null
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Avatar firstName={u.first_name} lastName={u.last_name} size="sm" />
                      <span className="text-xs">{u.first_name} {u.last_name}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Brak przypisanych</p>
            )}
          </div>

          {/* Dates */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Termin</p>
            <div className={`flex items-center gap-1.5 text-sm ${overdue ? "text-red-600" : ""}`}>
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          </div>

          {/* Estimated hours */}
          {task.estimated_hours != null && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Szac. czas</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{task.estimated_hours}h</span>
              </div>
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Etykiety</p>
              <div className="flex flex-wrap gap-1">
                {task.labels.map(l => (
                  <Badge key={l} variant="outline" className="text-[11px] h-5">{l}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project link */}
          {task.project_id && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Projekt</p>
              <Link
                href={`/platform/project-hub/projects/${task.project_id}`}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {task.project?.name ?? "Przejdź do projektu"}
              </Link>
            </div>
          )}

          {/* Dates meta */}
          <div className="pt-2 border-t space-y-1.5">
            <p className="text-[10px] text-muted-foreground">
              Utworzono: {formatDate(task.created_at)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Zaktualizowano: {formatDate(task.updated_at)}
            </p>
            {task.sprint_id && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Sprint: {task.sprint_id}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
