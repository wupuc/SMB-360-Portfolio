"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  PlusCircle,
  Calendar,
  Clock,
  Briefcase,
  Home,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import {
  demoLeaveBalances,
  demoPendingApprovals,
  demoRequests,
  requestTypeLabels,
  requestTypeColors,
  type DemoApproval,
  type DemoRequestType,
} from "@/lib/demo/data"

const statusLabels: Record<string, string> = {
  draft: "Szkic",
  pending: "Oczekuje",
  approved: "Zatwierdzone",
  rejected: "Odrzucone",
  in_progress: "W toku",
  completed: "Zakończone",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
}

const QUICK_REQUEST_TYPES = [
  { type: "vacation", label: "Urlop", icon: Calendar },
  { type: "home_office", label: "Home Office", icon: Home },
  { type: "business_trip", label: "Wyjazd służb.", icon: Briefcase },
  { type: "overtime", label: "Nadgodziny", icon: Clock },
]

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  const e = new Date(end).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  return start === end ? s : `${s} – ${e}`
}

export default function RequestFlowPage() {
  const { toast } = useToast()
  const [approvals, setApprovals] = useState<DemoApproval[]>(demoPendingApprovals)

  function handleApprove(id: string) {
    setApprovals((prev) => prev.filter((a) => a.id !== id))
    toast({ title: "Wniosek zatwierdzony" })
  }

  function handleReject(id: string) {
    setApprovals((prev) => prev.filter((a) => a.id !== id))
    toast({ title: "Wniosek odrzucony", variant: "destructive" })
  }

  const recentRequests = demoRequests.slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request Flow</h1>
          <p className="text-muted-foreground text-sm">Zarządzaj wnioskami i urlopami</p>
        </div>
        <Button asChild>
          <Link href="/platform/request-flow/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nowy wniosek
          </Link>
        </Button>
      </div>

      {/* Leave balance cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Saldo urlopów</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {demoLeaveBalances.map((balance) => {
            const remaining = balance.total - balance.used
            const pct = Math.round((balance.used / balance.total) * 100)
            return (
              <Card key={balance.type}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{balance.label}</span>
                    <span className="text-xs text-muted-foreground">{balance.used}/{balance.total} dni</span>
                  </div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Pozostało: <span className="font-semibold text-foreground">{remaining} dni</span>
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick submit buttons */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Szybki wniosek</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_REQUEST_TYPES.map(({ type, label, icon: Icon }) => (
            <Button key={type} variant="outline" className="gap-2" size="sm" asChild>
              <Link href={`/platform/request-flow/new?type=${type}`}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Do zatwierdzenia
              {approvals.length > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground font-bold">
                  {approvals.length}
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform/request-flow/approvals">Wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Brak wniosków do zatwierdzenia</p>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.id} className="rounded-md border p-3">
                    <Link
                      href={`/platform/request-flow/requests/${approval.request_id}?action=approve`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{approval.employee.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{approval.employee.name}</p>
                            <p className="text-xs text-muted-foreground">{approval.title}</p>
                          </div>
                        </div>
                        {approval.urgency === "urgent" && (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDateRange(approval.start_date, approval.end_date)}
                        </span>
                      </div>
                    </Link>
                    <div className="mt-2 flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => handleApprove(approval.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => handleReject(approval.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My recent requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Moje wnioski</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform/request-flow/my-requests">Wszystkie</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/platform/request-flow/requests/${req.id}`}
                  className="flex items-center justify-between rounded-md py-2 border-b last:border-0 hover:bg-muted/40 px-1 -mx-1 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{req.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{req.reference_number}</span>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${requestTypeColors[req.type as DemoRequestType]}`}>
                        {requestTypeLabels[req.type as DemoRequestType]}
                      </span>
                    </div>
                  </div>
                  <span className={`ml-2 flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status]}`}>
                    {statusLabels[req.status]}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
