"use client"

import { useState, useRef } from "react"
import { demoTeam } from "@/lib/demo/data"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type Role = "employee" | "manager" | "hr" | "admin"

interface UserRow {
  id: string
  name: string
  initials: string
  email: string
  role: Role
  department: string
  active: boolean
}

const roleLabels: Record<Role, string> = {
  employee: "Pracownik",
  manager: "Manager",
  hr: "HR",
  admin: "Admin",
}

function generateEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .concat("@acmecorp.pl")
}

function generateInitials(imie: string, nazwisko: string): string {
  return (imie[0] ?? "") + (nazwisko[0] ?? "")
}

const initialUsers: UserRow[] = demoTeam.map((m) => ({
  ...m,
  role: m.role as Role,
  email: generateEmail(m.name),
  active: true,
}))

const ROLES: Role[] = ["employee", "manager", "hr", "admin"]
const DEPARTMENTS = ["Engineering", "Sales", "HR"]

export default function UsersSettingsPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const imieRef = useRef<HTMLInputElement>(null)
  const nazwiskoRef = useRef<HTMLInputElement>(null)
  const [inviteRole, setInviteRole] = useState<Role>("employee")
  const [inviteDept, setInviteDept] = useState<string>("Engineering")

  function handleRoleChange(userId: string, newRole: Role) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    toast({ title: "Rola zaktualizowana" })
  }

  function handleToggleActive(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, active: !u.active } : u
      )
    )
    const user = users.find((u) => u.id === userId)
    toast({
      title: user?.active ? "Użytkownik dezaktywowany" : "Użytkownik aktywowany",
    })
  }

  function handleInvite() {
    const email = emailRef.current?.value.trim() ?? ""
    const imie = imieRef.current?.value.trim() ?? ""
    const nazwisko = nazwiskoRef.current?.value.trim() ?? ""

    if (!email || !imie || !nazwisko) {
      toast({ title: "Wypełnij wszystkie pola", variant: "destructive" })
      return
    }

    const newUser: UserRow = {
      id: `u${Date.now()}`,
      name: `${imie} ${nazwisko}`,
      initials: generateInitials(imie, nazwisko).toUpperCase(),
      email,
      role: inviteRole,
      department: inviteDept,
      active: true,
    }

    setUsers((prev) => [...prev, newUser])
    toast({ title: "Zaproszenie wysłane" })
    setDialogOpen(false)

    if (emailRef.current) emailRef.current.value = ""
    if (imieRef.current) imieRef.current.value = ""
    if (nazwiskoRef.current) nazwiskoRef.current.value = ""
    setInviteRole("employee")
    setInviteDept("Engineering")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Użytkownicy</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Zarządzaj kontami użytkowników, rolami i dostępem.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          + Zaproś użytkownika
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Imię i nazwisko
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Dział
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Rola
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>

                    {/* Email — hidden on mobile */}
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {user.email}
                    </td>

                    {/* Department — hidden on mobile */}
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {user.department}
                    </td>

                    {/* Role inline select */}
                    <td className="px-4 py-3">
                      <Select
                        value={user.role}
                        onValueChange={(val) =>
                          handleRoleChange(user.id, val as Role)
                        }
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {roleLabels[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Active badge */}
                    <td className="px-4 py-3">
                      {user.active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Aktywny
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-muted-foreground"
                        >
                          Nieaktywny
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {user.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleToggleActive(user.id)}
                        >
                          Dezaktywuj
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(user.id)}
                        >
                          Aktywuj
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zaproś użytkownika</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                ref={emailRef}
                type="email"
                placeholder="jan.kowalski@firma.pl"
              />
            </div>

            {/* Imię */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-imie">Imię</Label>
              <Input id="invite-imie" ref={imieRef} placeholder="Jan" />
            </div>

            {/* Nazwisko */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-nazwisko">Nazwisko</Label>
              <Input
                id="invite-nazwisko"
                ref={nazwiskoRef}
                placeholder="Kowalski"
              />
            </div>

            {/* Rola */}
            <div className="flex flex-col gap-1.5">
              <Label>Rola</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dział */}
            <div className="flex flex-col gap-1.5">
              <Label>Dział</Label>
              <Select value={inviteDept} onValueChange={setInviteDept}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleInvite}>Wyślij zaproszenie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
