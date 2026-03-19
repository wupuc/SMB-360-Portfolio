"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import {
  demoRequests, demoTeam, demoUser,
  requestTypeLabels, requestTypeColors,
  type DemoRequest, type DemoRequestType,
} from "@/lib/demo/data"

const statusLabels: Record<string, string> = {
  draft: "Szkic", pending: "Oczekuje", approved: "Zatwierdzone",
  rejected: "Odrzucone", in_progress: "W toku", completed: "Zakończone",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
}

const PAGE_SIZE = 5

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })
}

export default function MyRequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")   // "all" | userId
  const [page, setPage] = useState(0)

  // Manager / HR can see all users; employees see only own
  const isManager = demoUser.role === "manager" || demoUser.role === "hr"

  // Build list — if "all" and manager, show everything; otherwise filter by userId
  const userRequests = isManager && userFilter === "all"
    ? demoRequests
    : demoRequests.filter(r => r.userId === (userFilter === "all" ? demoUser.id : userFilter))

  const filtered = userRequests.filter(req => {
    const matchSearch =
      req.title.toLowerCase().includes(search.toLowerCase()) ||
      req.reference_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || req.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function resetPage() { setPage(0) }

  const selectedUser = userFilter !== "all" ? demoTeam.find(m => m.id === userFilter) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {selectedUser ? `Wnioski: ${selectedUser.name}` : "Wnioski"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isManager ? "Historia wniosków — widok menedżera" : "Historia wszystkich Twoich wniosków"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Wnioski ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Employee filter — managers only */}
              {isManager && (
                <Select value={userFilter} onValueChange={v => { setUserFilter(v); resetPage() }}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Pracownik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                    {demoTeam.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); resetPage() }}
                  className="pl-8 w-44"
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); resetPage() }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="draft">Szkic</SelectItem>
                  <SelectItem value="pending">Oczekuje</SelectItem>
                  <SelectItem value="approved">Zatwierdzone</SelectItem>
                  <SelectItem value="rejected">Odrzucone</SelectItem>
                  <SelectItem value="in_progress">W toku</SelectItem>
                  <SelectItem value="completed">Zakończone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_120px_120px] gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Wniosek</span>
            <span>Typ</span>
            <span>Status</span>
            <span>Data od</span>
            <span>Data do</span>
            <span>Złożono</span>
          </div>

          {paginated.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {userFilter !== "all" && userRequests.length === 0
                ? `${selectedUser?.name ?? "Ten pracownik"} nie ma żadnych wniosków`
                : "Brak wniosków spełniających kryteria"}
            </div>
          ) : (
            <div className="divide-y">
              {paginated.map(req => (
                <RequestRow key={req.id} req={req} isManager={isManager} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <span className="text-sm text-muted-foreground">Strona {page + 1} z {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Row — links to detail page instead of opening a dialog ──────────────────

function RequestRow({ req, isManager }: { req: DemoRequest; isManager: boolean }) {
  const owner = isManager ? demoTeam.find(m => m.id === req.userId) : null

  return (
    <Link
      href={`/platform/request-flow/requests/${req.id}`}
      className="block w-full text-left px-6 py-4 hover:bg-muted/50 transition-colors"
    >
      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm font-medium">{req.title}</span>
            {owner && <p className="text-xs text-muted-foreground">{owner.name}</p>}
          </div>
          <span className={`ml-2 flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status]}`}>
            {statusLabels[req.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{req.reference_number}</span>
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium ${requestTypeColors[req.type as DemoRequestType]}`}>
            {requestTypeLabels[req.type as DemoRequestType]}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(req.start_date)} – {formatDate(req.end_date)}
        </span>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_120px_120px] gap-4 items-center">
        <div>
          <p className="text-sm font-medium truncate">{req.title}</p>
          <p className="text-xs text-muted-foreground">
            {req.reference_number}
            {owner && ` · ${owner.name}`}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestTypeColors[req.type as DemoRequestType]}`}>
          {requestTypeLabels[req.type as DemoRequestType]}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status]}`}>
          {statusLabels[req.status]}
        </span>
        <span className="text-sm">{formatDate(req.start_date)}</span>
        <span className="text-sm">{formatDate(req.end_date)}</span>
        <span className="text-sm text-muted-foreground">{formatDate(req.submitted_at)}</span>
      </div>
    </Link>
  )
}
