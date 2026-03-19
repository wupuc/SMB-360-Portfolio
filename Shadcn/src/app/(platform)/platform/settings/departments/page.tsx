"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Users, ChevronRight, Building2, X, Crown } from "lucide-react"

// ─── Demo data ────────────────────────────────────────────────────────────────

interface DemoDept {
  id: string; name: string; parentId: string | null
  head: string; headInitials: string; memberCount: number; color: string
}

interface DemoMember {
  id: string; name: string; initials: string; role: "Lead" | "Członek"
}

interface DemoTeam {
  id: string; name: string; department: string
  lead: string; leadInitials: string; members: DemoMember[]
}

const ALL_PEOPLE = [
  { id: "u1", name: "Anna Kowalska",    initials: "AK" },
  { id: "u2", name: "Piotr Nowak",      initials: "PN" },
  { id: "u3", name: "Marta Wiśniewska", initials: "MW" },
  { id: "u4", name: "Tomasz Kowalczyk", initials: "TK" },
  { id: "u5", name: "Ewa Dąbrowska",    initials: "ED" },
  { id: "u6", name: "Jan Zieliński",    initials: "JZ" },
]

const INITIAL_DEPTS: DemoDept[] = [
  { id: "dept-mgmt",  name: "Zarząd",      parentId: null,        head: "Anna Kowalska",    headInitials: "AK", memberCount: 1, color: "bg-blue-100 text-blue-800" },
  { id: "dept-eng",   name: "Engineering", parentId: "dept-mgmt", head: "Anna Kowalska",    headInitials: "AK", memberCount: 3, color: "bg-purple-100 text-purple-800" },
  { id: "dept-sales", name: "Sales",       parentId: "dept-mgmt", head: "Marta Wiśniewska", headInitials: "MW", memberCount: 2, color: "bg-green-100 text-green-800" },
  { id: "dept-hr",    name: "HR",          parentId: "dept-mgmt", head: "Ewa Dąbrowska",    headInitials: "ED", memberCount: 1, color: "bg-orange-100 text-orange-800" },
]

const INITIAL_TEAMS: DemoTeam[] = [
  {
    id: "team-dev", name: "Dev Team", department: "Engineering",
    lead: "Anna Kowalska", leadInitials: "AK",
    members: [
      { id: "u1", name: "Anna Kowalska",    initials: "AK", role: "Lead" },
      { id: "u2", name: "Piotr Nowak",      initials: "PN", role: "Członek" },
      { id: "u4", name: "Tomasz Kowalczyk", initials: "TK", role: "Członek" },
    ],
  },
  {
    id: "team-sales", name: "Sales Team", department: "Sales",
    lead: "Marta Wiśniewska", leadInitials: "MW",
    members: [
      { id: "u3", name: "Marta Wiśniewska", initials: "MW", role: "Lead" },
      { id: "u6", name: "Jan Zieliński",    initials: "JZ", role: "Członek" },
    ],
  },
  {
    id: "team-hr", name: "HR Team", department: "HR",
    lead: "Ewa Dąbrowska", leadInitials: "ED",
    members: [
      { id: "u5", name: "Ewa Dąbrowska", initials: "ED", role: "Lead" },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<"depts" | "teams">("depts")
  const [depts, setDepts] = useState<DemoDept[]>(INITIAL_DEPTS)
  const [teams, setTeams] = useState<DemoTeam[]>(INITIAL_TEAMS)

  // ── Dept dialog ──
  const [deptDialog, setDeptDialog] = useState<{ open: boolean; editing: DemoDept | null }>({ open: false, editing: null })
  const [deptName, setDeptName] = useState("")
  const [deptParent, setDeptParent] = useState("none")

  // ── Add team dialog ──
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDept, setNewTeamDept] = useState("")
  const [newTeamLead, setNewTeamLead] = useState("")
  const [newTeamMemberIds, setNewTeamMemberIds] = useState<Set<string>>(new Set())

  // ── Manage members dialog ──
  const [membersDialog, setMembersDialog] = useState<{ open: boolean; team: DemoTeam | null }>({ open: false, team: null })
  const [addMemberId, setAddMemberId] = useState("")

  // ── Delete dialog ──
  const [deleteTarget, setDeleteTarget] = useState<{ type: "dept" | "team"; id: string; name: string } | null>(null)

  // ── Dept actions ──
  function openAddDept() { setDeptName(""); setDeptParent("none"); setDeptDialog({ open: true, editing: null }) }
  function openEditDept(dept: DemoDept) { setDeptName(dept.name); setDeptParent(dept.parentId ?? "none"); setDeptDialog({ open: true, editing: dept }) }

  function saveDept() {
    if (!deptName.trim()) return
    if (deptDialog.editing) {
      setDepts(prev => prev.map(d => d.id === deptDialog.editing!.id
        ? { ...d, name: deptName.trim(), parentId: deptParent === "none" ? null : deptParent } : d))
      toast({ title: "Dział zaktualizowany" })
    } else {
      setDepts(prev => [...prev, {
        id: `dept-${Date.now()}`, name: deptName.trim(),
        parentId: deptParent === "none" ? null : deptParent,
        head: "—", headInitials: "??", memberCount: 0, color: "bg-gray-100 text-gray-700",
      }])
      toast({ title: "Dział dodany" })
    }
    setDeptDialog({ open: false, editing: null })
  }

  function deleteDept(id: string) {
    setDepts(prev => prev.filter(d => d.id !== id))
    setDeleteTarget(null)
    toast({ title: "Dział usunięty", variant: "destructive" })
  }

  // ── Team actions ──
  function openAddTeam() {
    setNewTeamName(""); setNewTeamDept(""); setNewTeamLead(""); setNewTeamMemberIds(new Set())
    setAddTeamOpen(true)
  }

  function saveNewTeam() {
    if (!newTeamName.trim() || !newTeamDept || !newTeamLead) return
    const leadPerson = ALL_PEOPLE.find(p => p.id === newTeamLead)!
    const memberIds = new Set([newTeamLead, ...newTeamMemberIds])
    const members: DemoMember[] = Array.from(memberIds).map(id => {
      const p = ALL_PEOPLE.find(x => x.id === id)!
      return { id: p.id, name: p.name, initials: p.initials, role: id === newTeamLead ? "Lead" : "Członek" }
    })
    setTeams(prev => [...prev, {
      id: `team-${Date.now()}`, name: newTeamName.trim(), department: newTeamDept,
      lead: leadPerson.name, leadInitials: leadPerson.initials, members,
    }])
    setAddTeamOpen(false)
    toast({ title: "Zespół dodany" })
  }

  function deleteTeam(id: string) {
    setTeams(prev => prev.filter(t => t.id !== id))
    setDeleteTarget(null)
    toast({ title: "Zespół usunięty", variant: "destructive" })
  }

  // ── Member management ──
  function openManageMembers(team: DemoTeam) {
    setAddMemberId("")
    setMembersDialog({ open: true, team })
  }

  function removeMemberFromTeam(memberId: string) {
    if (!membersDialog.team) return
    const updated = { ...membersDialog.team, members: membersDialog.team.members.filter(m => m.id !== memberId) }
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
    setMembersDialog({ open: true, team: updated })
    toast({ title: "Członek usunięty z zespołu" })
  }

  function addMemberToTeam() {
    if (!membersDialog.team || !addMemberId) return
    if (membersDialog.team.members.some(m => m.id === addMemberId)) return
    const p = ALL_PEOPLE.find(x => x.id === addMemberId)!
    const updated = { ...membersDialog.team, members: [...membersDialog.team.members, { id: p.id, name: p.name, initials: p.initials, role: "Członek" as const }] }
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
    setMembersDialog({ open: true, team: updated })
    setAddMemberId("")
    toast({ title: `${p.name} dodany do zespołu` })
  }

  function toggleMemberRole(memberId: string) {
    if (!membersDialog.team) return
    const updated = {
      ...membersDialog.team,
      members: membersDialog.team.members.map(m =>
        m.id === memberId ? { ...m, role: m.role === "Lead" ? "Członek" as const : "Lead" as const } : m
      ),
    }
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
    setMembersDialog({ open: true, team: updated })
  }

  const rootDepts = depts.filter(d => d.parentId === null)
  const childrenOf = (id: string) => depts.filter(d => d.parentId === id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Działy i zespoły</h2>
          <p className="text-muted-foreground text-sm mt-1">Zarządzaj strukturą organizacyjną firmy.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["depts", "teams"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "depts" ? `Działy (${depts.length})` : `Zespoły (${teams.length})`}
          </button>
        ))}
      </div>

      {/* ── Departments tab ─────────────────────────────────────────────────── */}
      {tab === "depts" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddDept}><Plus className="mr-2 h-4 w-4" />Nowy dział</Button>
          </div>
          <div className="flex flex-col gap-2">
            {rootDepts.map(dept => (
              <DeptNode key={dept.id} dept={dept} children={childrenOf(dept.id)}
                onEdit={openEditDept} onDelete={(d) => setDeleteTarget({ type: "dept", id: d.id, name: d.name })} level={0} />
            ))}
          </div>
        </div>
      )}

      {/* ── Teams tab ───────────────────────────────────────────────────────── */}
      {tab === "teams" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddTeam}><Plus className="mr-2 h-4 w-4" />Nowy zespół</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <Card key={team.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{team.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">{team.department}</Badge>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Zarządzaj członkami"
                        onClick={() => openManageMembers(team)}>
                        <Users className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "team", id: team.id, name: team.name })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{m.initials}</AvatarFallback></Avatar>
                          <span className="text-sm">{m.name}</span>
                        </div>
                        <Badge variant={m.role === "Lead" ? "default" : "outline"} className="text-xs">{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Add/Edit dept dialog ─────────────────────────────────────────────── */}
      <Dialog open={deptDialog.open} onOpenChange={(o) => setDeptDialog({ open: o, editing: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{deptDialog.editing ? "Edytuj dział" : "Nowy dział"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Nazwa działu</Label>
              <Input id="dept-name" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="np. Marketing" />
            </div>
            <div className="space-y-2">
              <Label>Dział nadrzędny</Label>
              <Select value={deptParent} onValueChange={setDeptParent}>
                <SelectTrigger><SelectValue placeholder="Brak (dział główny)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak (dział główny)</SelectItem>
                  {depts.filter(d => d.id !== deptDialog.editing?.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog({ open: false, editing: null })}>Anuluj</Button>
            <Button onClick={saveDept} disabled={!deptName.trim()}>{deptDialog.editing ? "Zapisz" : "Dodaj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add team dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addTeamOpen} onOpenChange={setAddTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nowy zespół</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nazwa zespołu</Label>
              <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="np. Backend Team" />
            </div>
            <div className="space-y-2">
              <Label>Dział</Label>
              <Select value={newTeamDept} onValueChange={setNewTeamDept}>
                <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                <SelectContent>
                  {depts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lider zespołu</Label>
              <Select value={newTeamLead} onValueChange={v => { setNewTeamLead(v); setNewTeamMemberIds(prev => { const s = new Set(prev); s.delete(v); return s }) }}>
                <SelectTrigger><SelectValue placeholder="Wybierz lidera" /></SelectTrigger>
                <SelectContent>
                  {ALL_PEOPLE.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Członkowie (opcjonalnie)</Label>
              <div className="space-y-1">
                {ALL_PEOPLE.filter(p => p.id !== newTeamLead).map(p => (
                  <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTeamMemberIds.has(p.id)}
                      onChange={e => {
                        setNewTeamMemberIds(prev => {
                          const s = new Set(prev)
                          e.target.checked ? s.add(p.id) : s.delete(p.id)
                          return s
                        })
                      }}
                      className="rounded"
                    />
                    <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{p.initials}</AvatarFallback></Avatar>
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTeamOpen(false)}>Anuluj</Button>
            <Button onClick={saveNewTeam} disabled={!newTeamName.trim() || !newTeamDept || !newTeamLead}>Dodaj zespół</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage members dialog ────────────────────────────────────────────── */}
      <Dialog open={membersDialog.open} onOpenChange={(o) => setMembersDialog({ open: o, team: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{membersDialog.team?.name} — Członkowie</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            {membersDialog.team?.members.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{m.initials}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    title={m.role === "Lead" ? "Zmień na Członek" : "Ustaw jako Lead"}
                    onClick={() => toggleMemberRole(m.id)}
                    className="flex items-center gap-1"
                  >
                    <Badge variant={m.role === "Lead" ? "default" : "outline"} className="text-xs cursor-pointer hover:opacity-80">
                      {m.role === "Lead" && <Crown className="h-2.5 w-2.5 mr-1" />}{m.role}
                    </Badge>
                  </button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMemberFromTeam(m.id)}
                    disabled={membersDialog.team!.members.length <= 1}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add member row */}
          {(() => {
            const currentIds = new Set(membersDialog.team?.members.map(m => m.id) ?? [])
            const available = ALL_PEOPLE.filter(p => !currentIds.has(p.id))
            if (available.length === 0) return null
            return (
              <div className="flex gap-2 border-t pt-3">
                <Select value={addMemberId} onValueChange={setAddMemberId}>
                  <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder="Dodaj osobę..." /></SelectTrigger>
                  <SelectContent>
                    {available.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8" onClick={addMemberToTeam} disabled={!addMemberId}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })()}

          <DialogFooter>
            <Button onClick={() => setMembersDialog({ open: false, team: null })}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Potwierdź usunięcie</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Czy na pewno chcesz usunąć <span className="font-medium text-foreground">{deleteTarget?.name}</span>? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Anuluj</Button>
            <Button variant="destructive" onClick={() => {
              if (!deleteTarget) return
              if (deleteTarget.type === "dept") deleteDept(deleteTarget.id)
              else deleteTeam(deleteTarget.id)
            }}>Usuń</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Dept tree node ───────────────────────────────────────────────────────────

function DeptNode({ dept, children, onEdit, onDelete, level }: {
  dept: DemoDept; children: DemoDept[]
  onEdit: (d: DemoDept) => void; onDelete: (d: DemoDept) => void; level: number
}) {
  return (
    <div className={level > 0 ? "ml-6 border-l pl-4" : ""}>
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          {level > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${dept.color}`}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{dept.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[9px]">{dept.headInitials}</AvatarFallback></Avatar>
              <span className="text-xs text-muted-foreground truncate">{dept.head}</span>
              <span className="text-xs text-muted-foreground">· {dept.memberCount} os.</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(dept)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(dept)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {children.map(child => (
        <DeptNode key={child.id} dept={child} children={[]} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
      ))}
    </div>
  )
}
