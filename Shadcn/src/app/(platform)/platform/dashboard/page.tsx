"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  CheckSquare,
  Calendar,
  BookOpen,
  BarChart2,
  FolderKanban,
  Users,
  Headphones,
  PlusCircle,
  Clock,
} from "lucide-react"
import {
  isDemoMode,
  demoUser,
  demoDashboardStats,
  demoRequests,
  requestTypeLabels,
  requestTypeColors,
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

const MODULE_SHORTCUTS = [
  { key: "request_flow", label: "Request Flow", href: "/platform/request-flow", icon: FileText, color: "text-blue-600" },
  { key: "sales_track", label: "Sales Track", href: "/platform/sales-track", icon: BarChart2, color: "text-green-600" },
  { key: "project_hub", label: "Project Hub", href: "/platform/project-hub", icon: FolderKanban, color: "text-purple-600" },
  { key: "people_hub", label: "People Hub", href: "/platform/people-hub", icon: Users, color: "text-orange-600" },
  { key: "book_it", label: "Book It", href: "/platform/book-it", icon: BookOpen, color: "text-teal-600" },
  { key: "helpdesk", label: "Helpdesk", href: "/platform/helpdesk", icon: Headphones, color: "text-rose-600" },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Dzień dobry"
  if (hour < 18) return "Dobry wieczór"
  return "Dobry wieczór"
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function DashboardPage() {
  if (!isDemoMode) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ładowanie danych...</p>
      </div>
    )
  }

  const recentRequests = demoRequests.slice(0, 3)
  const now = new Date()

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome card */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {demoUser.first_name}!
        </h1>
        <p className="text-muted-foreground text-sm capitalize">{formatDate(now)}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moje wnioski</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoDashboardStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">oczekujące na odpowiedź</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Do zatwierdzenia</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoDashboardStats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">wnioski zespołu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zadania dziś</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoDashboardStats.tasksDueToday}</div>
            <p className="text-xs text-muted-foreground">do wykonania</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rezerwacje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoDashboardStats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">nadchodzące</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent requests */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Moje ostatnie wnioski</CardTitle>
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
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium truncate">{req.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{req.reference_number}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestTypeColors[req.type as DemoRequestType]}`}>
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

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/platform/request-flow">
                  <PlusCircle className="h-4 w-4" />
                  Nowy wniosek
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/platform/request-flow/approvals">
                  <CheckSquare className="h-4 w-4" />
                  Zatwierdzenia ({demoDashboardStats.pendingApprovals})
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/platform/project-hub">
                  <FolderKanban className="h-4 w-4" />
                  Moje zadania
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-2" asChild>
                <Link href="/platform/book-it">
                  <BookOpen className="h-4 w-4" />
                  Zarezerwuj salę
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moduły</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {MODULE_SHORTCUTS.map((mod) => {
              const Icon = mod.icon
              return (
                <Link
                  key={mod.key}
                  href={mod.href}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-muted"
                >
                  <Icon className={`h-6 w-6 ${mod.color}`} />
                  <span className="text-xs font-medium">{mod.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
