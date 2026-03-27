"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FolderKanban,
  CheckSquare2,
  AlertCircle,
  LayoutDashboard,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project, Task } from "@/lib/supabase/projecthub-server"

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

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function isDueThisWeek(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date(new Date().toDateString())
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)
  const due = new Date(dueDate)
  return due >= today && due <= weekEnd
}

// ─── Task Detail Sheet ────────────────────────────────────────────────────────

interface TaskSheetProps {
  task: Task | null
  onClose: () => void
  onStatusChange: (taskId: string, status: string) => void
}

function TaskDetailSheet({ task, onClose, onStatusChange }: TaskSheetProps) {
  return (
    <Sheet open={!!task} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {task && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left pr-8">{task.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {task.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Opis</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <Select
                    value={task.status}
                    onValueChange={(v) => onStatusChange(task.id, v)}
                  >
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Priorytet</p>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                    {PRIORITY_LABEL[task.priority] ?? task.priority}
                  </span>
                </div>
              </div>
              {task.due_date && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Termin</p>
                  <p className={cn("text-sm", isOverdue(task.due_date) && task.status !== "done" ? "text-red-600 font-medium" : "")}>
                    {task.due_date}
                  </p>
                </div>
              )}
              {task.project && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Projekt</p>
                  <p className="text-sm">{task.project.name}</p>
                </div>
              )}
              {(task.labels ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Etykiety</p>
                  <div className="flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(task.assignees ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Przypisane osoby</p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignees!.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-sm">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          {a.user.first_name[0]}{a.user.last_name[0]}
                        </span>
                        {a.user.first_name} {a.user.last_name}
                      </span>
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

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project
  tasks: Task[]
}

function ProjectCard({ project, tasks }: ProjectCardProps) {
  const projectTasks = tasks.filter((t) => t.project_id === project.id)
  const doneTasks = projectTasks.filter((t) => t.status === "done").length
  const pct = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0

  return (
    <Link href={`/platform/project-hub/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight">{project.name}</h3>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", STATUS_CLASS[project.status])}>
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          {project.client && (
            <p className="text-xs text-muted-foreground mb-3">{project.client.name}</p>
          )}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Postęp</span>
              <span>{doneTasks}/{projectTasks.length} zadań</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {project.owner
                ? `${project.owner.first_name} ${project.owner.last_name}`
                : "—"}
            </span>
            {project.end_date && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {project.end_date}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialProjects: Project[]
  initialMyTasks: Task[]
}

export function ProjectHubDashboardClient({ initialProjects, initialMyTasks }: Props) {
  const [projects] = useState<Project[]>(initialProjects)
  const [myTasks, setMyTasks] = useState<Task[]>(initialMyTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const openTasks = myTasks.filter((t) => t.status !== "done" && t.status !== "cancelled")
  const overdueTasks = openTasks.filter((t) => isOverdue(t.due_date))
  const dueSoonTasks = myTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && isDueThisWeek(t.due_date)
  )

  const activeProjects = projects.filter((p) => p.status === "active")
  const myProjects = projects.filter((p) => p.owner_id === "u1" || true) // show all in demo

  function handleStatusChange(taskId: string, status: string) {
    setMyTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t))
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => prev ? { ...prev, status } : null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
          <FolderKanban className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ProjectHub</h1>
          <p className="text-muted-foreground text-sm">Dashboard projektów i zadań</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <LayoutDashboard className="h-4 w-4" />
              Wszystkie projekty
            </div>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              Aktywne projekty
            </div>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckSquare2 className="h-4 w-4 text-purple-500" />
              Moje otwarte zadania
            </div>
            <div className="text-2xl font-bold">{openTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Przeterminowane
            </div>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Moje zadania — ten tydzień</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/platform/project-hub/my-tasks">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {dueSoonTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zadań na ten tydzień.</p>
            ) : (
              <ul className="space-y-2">
                {dueSoonTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", TASK_STATUS_CLASS[task.status])}>
                          {TASK_STATUS_LABEL[task.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.project && (
                          <span className="text-xs text-muted-foreground">{task.project.name}</span>
                        )}
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_CLASS[task.priority])}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        {task.due_date && (
                          <span className={cn("text-xs", isOverdue(task.due_date) ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Projekty</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/platform/project-hub/projects">Zobacz wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak projektów.</p>
            ) : (
              <div className="grid gap-3">
                {myProjects.slice(0, 4).map((project) => (
                  <ProjectCard key={project.id} project={project} tasks={myTasks} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
