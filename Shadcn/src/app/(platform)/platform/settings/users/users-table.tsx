"use client"

import { useState, useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole, toggleUserActive } from "@/app/actions/users"
import type { User, Department } from "@/types/database.types"

interface Props {
  users: User[]
  departments: Department[]
  currentUserId: string
}

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
]

const ROLE_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  super_admin: "destructive",
  admin: "default",
  hr: "secondary",
  manager: "secondary",
  employee: "outline",
}

export function UsersTable({ users, departments, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.error) {
        setErrors((prev) => ({ ...prev, [userId]: result.error! }))
      } else {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[userId]
          return next
        })
      }
    })
  }

  function handleToggleActive(userId: string) {
    startTransition(async () => {
      const result = await toggleUserActive(userId)
      if (result.error) {
        setErrors((prev) => ({ ...prev, [`toggle_${userId}`]: result.error! }))
      }
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No users found.
              </TableCell>
            </TableRow>
          )}
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">
                {u.first_name} {u.last_name}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                {u.id === currentUserId ? (
                  <Badge variant={ROLE_BADGE_VARIANTS[u.role] ?? "outline"}>
                    {u.role.replace("_", " ")}
                  </Badge>
                ) : (
                  <Select
                    defaultValue={u.role}
                    onValueChange={(val) => handleRoleChange(u.id, val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors[u.id] && (
                  <p className="text-xs text-destructive mt-1">{errors[u.id]}</p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {u.department_id ? (deptMap[u.department_id] ?? "—") : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={u.is_active ? "default" : "secondary"}>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                {u.id !== currentUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleActive(u.id)}
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
