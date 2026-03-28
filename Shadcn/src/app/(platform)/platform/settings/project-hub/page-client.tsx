"use client"

import { useState, useTransition } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
  addTemplateTask,
  deleteTemplateTask,
} from "@/app/actions/projecthub"
import type { ProjectTemplate, TemplateTask } from "./page"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Plus, Trash2, ChevronDown, ChevronRight, Lock, Zap, Edit2, X, Check } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Pilne", high: "Wysoki", medium: "Średni", low: "Niski",
}
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high:   "bg-orange-100 text-orange-800",
  medium: "bg-blue-100 text-blue-800",
  low:    "bg-gray-100 text-gray-600",
}

const TRIGGER_APP_LABELS: Record<string, string> = {
  sales_track:  "Sales Track",
  people_hub:   "People Hub",
  request_flow: "Request Flow",
}

const TRIGGER_EVENT_LABELS: Record<string, string> = {
  opportunity_won:  "Szansa wygrana",
  new_hire:         "Nowy pracownik",
  position_opened:  "Nowe stanowisko",
  leave_approved:   "Urlop zatwierdzony",
}

// ─── Template task row ────────────────────────────────────────────────────────

function TemplateTaskRow({
  task,
  isBuiltIn,
  onDelete,
}: {
  task: TemplateTask
  isBuiltIn: boolean
  onDelete: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteTemplateTask(task.id)
      onDelete(task.id)
    })
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group text-sm">
      <span className="text-muted-foreground w-6 text-center text-xs">{task.order_index}</span>
      <span className="flex-1 truncate">{task.title}</span>
      <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority] ?? ""}`}>
        {PRIORITY_LABELS[task.priority] ?? task.priority}
      </Badge>
      {task.role_assignment && (
        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">
          {task.role_assignment}
        </Badge>
      )}
      <span className="text-[10px] text-muted-foreground w-14 text-right">
        {task.days_from_start >= 0 ? `+${task.days_from_start}d` : `${task.days_from_start}d`}
      </span>
      {!isBuiltIn && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Add task inline form ─────────────────────────────────────────────────────

function AddTaskForm({
  templateId,
  onAdd,
}: {
  templateId: string
  onAdd: (task: TemplateTask) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("medium")
  const [role, setRole] = useState("")
  const [days, setDays] = useState("0")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleAdd() {
    if (!title.trim()) return
    startTransition(async () => {
      const result = await addTemplateTask(templateId, {
        title:           title.trim(),
        priority,
        role_assignment: role.trim() || undefined,
        days_from_start: parseInt(days) || 0,
      })
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        // optimistic — add with temporary id
        onAdd({
          id:              crypto.randomUUID(),
          title:           title.trim(),
          priority,
          role_assignment: role.trim() || null,
          days_from_start: parseInt(days) || 0,
          order_index:     999,
        })
        setTitle(""); setRole(""); setDays("0"); setPriority("medium"); setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
      >
        <Plus className="h-3 w-3" /> Dodaj zadanie
      </button>
    )
  }

  return (
    <div className="border rounded-md p-3 mt-1 space-y-2 bg-muted/30">
      <Input
        placeholder="Tytuł zadania"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-8 text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Rola (np. dev)"
          value={role}
          onChange={e => setRole(e.target.value)}
          className="h-8 text-xs flex-1"
        />
        <Input
          type="number"
          placeholder="Dni"
          value={days}
          onChange={e => setDays(e.target.value)}
          className="h-8 text-xs w-20"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Anuluj
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={isPending || !title.trim()}>
          <Check className="h-3 w-3 mr-1" /> Dodaj
        </Button>
      </div>
    </div>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onDelete,
  onUpdate,
  onTaskAdd,
  onTaskDelete,
}: {
  template: ProjectTemplate
  onDelete: (id: string) => void
  onUpdate: (id: string, name: string, description: string) => void
  onTaskAdd: (templateId: string, task: TemplateTask) => void
  onTaskDelete: (templateId: string, taskId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(template.name)
  const [editDesc, setEditDesc] = useState(template.description ?? "")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSaveEdit() {
    if (!editName.trim()) return
    startTransition(async () => {
      const result = await updateTemplate(template.id, editName.trim(), editDesc.trim())
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onUpdate(template.id, editName.trim(), editDesc.trim())
        setEditing(false)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTemplate(template.id)
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onDelete(template.id)
      }
    })
  }

  return (
    <Card className={template.is_built_in ? "border-dashed" : ""}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                       : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0">
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="h-7 text-sm font-semibold"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                  )}
                  {template.description && !editing && (
                    <CardDescription className="text-xs mt-0.5 truncate">{template.description}</CardDescription>
                  )}
                  {editing && (
                    <Textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="text-xs mt-1 min-h-0 h-14 resize-none"
                      onClick={e => e.stopPropagation()}
                      placeholder="Opis szablonu..."
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {template.is_built_in && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Lock className="h-2.5 w-2.5" /> Wbudowany
                  </Badge>
                )}
                {template.trigger_app && (
                  <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 text-amber-700 border-amber-200">
                    <Zap className="h-2.5 w-2.5" />
                    {TRIGGER_APP_LABELS[template.trigger_app] ?? template.trigger_app}
                    {template.trigger_event && ` → ${TRIGGER_EVENT_LABELS[template.trigger_event] ?? template.trigger_event}`}
                  </Badge>
                )}
                {!template.is_built_in && (
                  editing ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditing(false)}>
                        Anuluj
                      </Button>
                      <Button size="sm" className="h-6 px-2 text-xs" onClick={handleSaveEdit} disabled={isPending}>
                        Zapisz
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={handleDelete} disabled={isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                )}
                <Badge variant="outline" className="text-[10px]">
                  {template.tasks.length} zadań
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="border-t pt-3 space-y-0.5">
              <div className="flex items-center gap-2 py-1 px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                <span className="w-6">#</span>
                <span className="flex-1">Zadanie</span>
                <span>Priorytet</span>
                <span className="ml-2">Rola</span>
                <span className="w-14 text-right">Offset</span>
                <span className="w-4" />
              </div>
              {template.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-2">Brak zadań w szablonie.</p>
              )}
              {template.tasks.map(task => (
                <TemplateTaskRow
                  key={task.id}
                  task={task}
                  isBuiltIn={template.is_built_in}
                  onDelete={id => onTaskDelete(template.id, id)}
                />
              ))}
              {!template.is_built_in && (
                <AddTaskForm
                  templateId={template.id}
                  onAdd={task => onTaskAdd(template.id, task)}
                />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// ─── Create template dialog ───────────────────────────────────────────────────

function CreateTemplateDialog({ onCreate }: { onCreate: (t: ProjectTemplate) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createTemplate({ name: name.trim(), description: description.trim() })
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" })
      } else {
        onCreate({
          id:            result.data.id,
          name:          result.data.name,
          description:   result.data.description,
          is_built_in:   false,
          trigger_app:   null,
          trigger_event: null,
          tasks:         [],
        })
        setName(""); setDescription(""); setOpen(false)
        toast({ title: "Szablon utworzony" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Nowy szablon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nowy szablon projektu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nazwa szablonu</Label>
            <Input
              placeholder="np. Wdrożenie klienta"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Opis (opcjonalnie)</Label>
            <Textarea
              placeholder="Krótki opis..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-0 h-20 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
            Utwórz szablon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProjectHubSettingsClient({ initialTemplates }: { initialTemplates: ProjectTemplate[] }) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>(initialTemplates)

  function handleCreate(t: ProjectTemplate) {
    setTemplates(prev => [...prev, t])
  }

  function handleDelete(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  function handleUpdate(id: string, name: string, description: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, name, description } : t))
  }

  function handleTaskAdd(templateId: string, task: TemplateTask) {
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, tasks: [...t.tasks, task] } : t
    ))
  }

  function handleTaskDelete(templateId: string, taskId: string) {
    setTemplates(prev => prev.map(t =>
      t.id === templateId ? { ...t, tasks: t.tasks.filter(tk => tk.id !== taskId) } : t
    ))
  }

  const builtIn  = templates.filter(t => t.is_built_in)
  const custom   = templates.filter(t => !t.is_built_in)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Szablony projektów</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Szablony pozwalają szybko tworzyć projekty z predefiniowanymi zadaniami. Wbudowane szablony mogą być
          automatycznie wyzwalane przez inne moduły platformy.
        </p>
      </div>

      {/* Custom templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Własne szablony</h3>
          <CreateTemplateDialog onCreate={handleCreate} />
        </div>
        {custom.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
            Brak własnych szablonów. Utwórz pierwszy szablon dla swojej firmy.
          </p>
        )}
        {custom.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onTaskAdd={handleTaskAdd}
            onTaskDelete={handleTaskDelete}
          />
        ))}
      </div>

      {/* Built-in templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Wbudowane szablony</h3>
          <Badge variant="secondary" className="text-[10px]">{builtIn.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Szablony systemowe są tylko do odczytu. Można je przeglądać, ale nie edytować.
        </p>
        {builtIn.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onTaskAdd={handleTaskAdd}
            onTaskDelete={handleTaskDelete}
          />
        ))}
      </div>
    </div>
  )
}
