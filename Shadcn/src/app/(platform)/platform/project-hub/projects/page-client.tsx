"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, LayoutGrid, List, FolderKanban, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/supabase/projecthub-server"

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

type StatusFilter = "all" | "planning" | "active" | "on_hold" | "completed" | "cancelled"
type ViewMode = "grid" | "list"

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
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
          {project.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
          )}
          {project.client && (
            <p className="text-xs text-muted-foreground mb-3">{project.client.name}</p>
          )}
          <div className="space-y-1 mb-3">
            <Progress value={0} className="h-1.5" />
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

// ─── Project List Row ─────────────────────────────────────────────────────────

function ProjectListRow({ project }: { project: Project }) {
  return (
    <Link href={`/platform/project-hub/projects/${project.id}`}>
      <div className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{project.name}</p>
          {project.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
          )}
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", STATUS_CLASS[project.status])}>
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
        {project.client && (
          <span className="text-xs text-muted-foreground hidden md:block shrink-0">{project.client.name}</span>
        )}
        <span className="text-xs text-muted-foreground hidden md:block shrink-0">
          {project.owner ? `${project.owner.first_name} ${project.owner.last_name}` : "—"}
        </span>
        {project.end_date && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <CalendarClock className="h-3 w-3" />
            {project.end_date}
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── New Project Form ─────────────────────────────────────────────────────────

interface NewProjectForm {
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
}

const defaultForm: NewProjectForm = {
  name: "",
  description: "",
  status: "planning",
  start_date: "",
  end_date: "",
}

// ─── Page Client ─────────────────────────────────────────────────────────────

interface Props {
  initialProjects: Project[]
}

export function ProjectsPageClient({ initialProjects }: Props) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [form, setForm] = useState<NewProjectForm>(defaultForm)

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  function handleAdd() {
    if (!form.name.trim()) return
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      owner_id: null,
      client_id: null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      estimated_budget: null,
      template_id: null,
      created_at: new Date().toISOString(),
    }
    setProjects((prev) => [newProject, ...prev])
    setShowAddDialog(false)
    setForm(defaultForm)
    toast({ title: "Projekt zapisany (demo)", description: newProject.name })
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projekty</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} z {projects.length} projektów
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nowy projekt
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Szukaj projektu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="planning">Planowanie</SelectItem>
            <SelectItem value="active">Aktywny</SelectItem>
            <SelectItem value="on_hold">Wstrzymany</SelectItem>
            <SelectItem value="completed">Zakończony</SelectItem>
            <SelectItem value="cancelled">Anulowany</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <FolderKanban className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium">Brak projektów</p>
          <p className="mt-1 text-xs text-muted-foreground">Zmień filtry lub utwórz nowy projekt.</p>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="rounded-lg border overflow-hidden">
          {filtered.map((project) => (
            <ProjectListRow key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy projekt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="proj-name">Nazwa *</Label>
              <Input
                id="proj-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nazwa projektu"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-desc">Opis</Label>
              <Textarea
                id="proj-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Krótki opis projektu…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planowanie</SelectItem>
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="on_hold">Wstrzymany</SelectItem>
                  <SelectItem value="completed">Zakończony</SelectItem>
                  <SelectItem value="cancelled">Anulowany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="proj-start">Data rozpoczęcia</Label>
                <Input
                  id="proj-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="proj-end">Data zakończenia</Label>
                <Input
                  id="proj-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>Utwórz projekt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
