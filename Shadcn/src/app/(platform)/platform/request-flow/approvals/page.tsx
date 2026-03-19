"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, Check, X, CheckSquare, ExternalLink } from "lucide-react"
import {
  demoPendingApprovals,
  requestTypeLabels,
  requestTypeColors,
  type DemoApproval,
  type DemoRequestType,
} from "@/lib/demo/data"

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  const s = new Date(start).toLocaleDateString("pl-PL", opts)
  const e = new Date(end).toLocaleDateString("pl-PL", opts)
  return start === end ? s : `${s} – ${e}`
}

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

export default function ApprovalsInboxPage() {
  const { toast } = useToast()
  const [approvals, setApprovals] = useState<DemoApproval[]>(demoPendingApprovals)

  function handleApprove(id: string, title: string) {
    setApprovals(prev => prev.filter(a => a.id !== id))
    toast({ title: `Zatwierdzono: ${title}` })
  }

  function handleReject(id: string, title: string) {
    setApprovals(prev => prev.filter(a => a.id !== id))
    toast({ title: `Odrzucono: ${title}`, variant: "destructive" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skrzynka zatwierdzeń</h1>
        <p className="text-muted-foreground text-sm">
          {approvals.length > 0
            ? `${approvals.length} wniosek${approvals.length > 1 ? "i" : ""} oczekuje na Twoją decyzję`
            : "Wszystkie wnioski zostały rozpatrzone"}
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CheckSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">Skrzynka pusta</p>
          <p className="text-sm text-muted-foreground mt-1">Brak wniosków do zatwierdzenia</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {approvals.map(approval => (
            <Card key={approval.id} className="flex flex-col">
              <CardContent className="flex flex-col gap-4 pt-5">
                {/* Employee */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{approval.employee.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{approval.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{approval.employee.department}</p>
                    </div>
                  </div>
                  {approval.urgency === "urgent" && (
                    <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                      <AlertCircle className="h-3 w-3" />Pilne
                    </div>
                  )}
                </div>

                {/* Request details */}
                <div className="space-y-1.5">
                  <p className="font-medium">{approval.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestTypeColors[approval.type as DemoRequestType]}`}>
                      {requestTypeLabels[approval.type as DemoRequestType]}
                    </span>
                    <span className="text-xs text-muted-foreground">{approval.reference_number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(approval.start_date, approval.end_date)}
                  </p>
                  {approval.notes && (
                    <p className="rounded-md bg-muted px-3 py-2 text-xs">{approval.notes}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-auto space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Złożono {formatSubmittedAt(approval.submitted_at)}
                    </span>
                    {/* Detail link */}
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs px-2" asChild>
                      <Link href={`/platform/request-flow/requests/${approval.request_id}?action=approve`}>
                        <ExternalLink className="h-3 w-3" />
                        Szczegóły
                      </Link>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="outline"
                      className="flex-1 gap-1.5 text-red-700 border-red-300 hover:bg-red-50"
                      onClick={() => handleReject(approval.id, approval.title)}
                    >
                      <X className="h-3.5 w-3.5" />Odrzuć
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(approval.id, approval.title)}
                    >
                      <Check className="h-3.5 w-3.5" />Zatwierdź
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
