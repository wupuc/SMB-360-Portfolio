import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoTeam, requestTypeLabels, requestTypeColors, type DemoRequestType } from "@/lib/demo/data"
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react"

// ─── Mock report data ──────────────────────────────────────────────────────────

const summaryStats = [
  { label: "Wnioski w tym miesiącu", value: 12, icon: FileText, color: "text-blue-600 bg-blue-50" },
  { label: "Zatwierdzone", value: 8, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  { label: "Oczekujące", value: 3, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  { label: "Odrzucone", value: 1, icon: XCircle, color: "text-red-600 bg-red-50" },
]

const byType: { type: DemoRequestType; count: number }[] = [
  { type: "vacation", count: 5 },
  { type: "home_office", count: 3 },
  { type: "business_trip", count: 2 },
  { type: "equipment", count: 1 },
  { type: "training_course", count: 1 },
]

const maxCount = Math.max(...byType.map((r) => r.count))

const teamBalances = [
  { id: "u1", name: "Anna Kowalska", vacUsed: 14, vacTotal: 26, hoUsed: 12, sickUsed: 0 },
  { id: "u2", name: "Piotr Nowak", vacUsed: 8, vacTotal: 26, hoUsed: 6, sickUsed: 2 },
  { id: "u3", name: "Marta Wiśniewska", vacUsed: 20, vacTotal: 26, hoUsed: 4, sickUsed: 5 },
  { id: "u4", name: "Tomasz Kowalczyk", vacUsed: 3, vacTotal: 26, hoUsed: 18, sickUsed: 0 },
  { id: "u5", name: "Ewa Dąbrowska", vacUsed: 18, vacTotal: 26, hoUsed: 8, sickUsed: 1 },
  { id: "u6", name: "Jan Zieliński", vacUsed: 11, vacTotal: 26, hoUsed: 2, sickUsed: 3 },
]

// ─── Bar segment color derived from requestTypeColors ─────────────────────────
// Converts "bg-X-100 text-X-800" → "bg-X-400" for a solid bar fill
const barColors: Record<DemoRequestType, string> = {
  vacation: "bg-green-400",
  home_office: "bg-purple-400",
  business_trip: "bg-blue-400",
  equipment: "bg-orange-400",
  overtime: "bg-red-400",
  budget_request: "bg-yellow-400",
  training_course: "bg-cyan-400",
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporty</h1>
        <p className="text-muted-foreground text-sm">Statystyki wniosków — bieżący miesiąc</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryStats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                </div>
                <div className={`rounded-lg p-2 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Requests by type — horizontal bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wnioski wg typu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byType.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-36 text-sm text-muted-foreground truncate">
                  {requestTypeLabels[type]}
                </span>
                <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[type]} transition-all`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-sm font-medium text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Approval time stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Czas zatwierdzania</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">1,4</span>
                <span className="text-muted-foreground mb-1">dni średnio</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Najszybciej</span>
                  <span className="font-medium">tego samego dnia</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Najwolniej</span>
                  <span className="font-medium">3 dni</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Zatwierdzone przez Ciebie</span>
                  <span className="font-medium">3 wnioski</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oczekujące decyzji</span>
                  <span className="font-medium text-yellow-600">3 wnioski</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team leave overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bilans urlopów zespołu</CardTitle>
        </CardHeader>
        <CardContent className="p-0">

          {/* ── Mobile: card per employee (hidden md+) ─────────────────────── */}
          <div className="md:hidden divide-y">
            {teamBalances.map((member) => {
              const vacRemaining = member.vacTotal - member.vacUsed
              const usedPct = Math.round((member.vacUsed / member.vacTotal) * 100)
              const initials = demoTeam.find(m => m.id === member.id)?.initials ?? "??"
              return (
                <div key={member.id} className="px-4 py-3 flex flex-col gap-2">
                  {/* Name row */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold flex-shrink-0">
                      {initials}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground mb-0.5">Urlop</p>
                      <p className="font-semibold">{member.vacUsed}/{member.vacTotal} dni</p>
                      <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${usedPct >= 80 ? "bg-red-400" : "bg-green-400"}`}
                          style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground mb-0.5">Home Office</p>
                      <p className="font-semibold">{member.hoUsed} dni</p>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground mb-0.5">L4</p>
                      <p className={`font-semibold ${member.sickUsed > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {member.sickUsed > 0 ? `${member.sickUsed} dni` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop: table (hidden below md) ──────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Pracownik</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Urlop wykorzystany</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Urlop pozostały</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Home Office</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">L4</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamBalances.map((member) => {
                  const vacRemaining = member.vacTotal - member.vacUsed
                  const usedPct = Math.round((member.vacUsed / member.vacTotal) * 100)
                  return (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>{member.vacUsed} / {member.vacTotal} dni</span>
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${usedPct >= 80 ? "bg-red-400" : "bg-green-400"}`}
                              style={{ width: `${usedPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${vacRemaining <= 3 ? "text-red-600" : "text-green-600"}`}>
                          {vacRemaining} dni
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{member.hoUsed} dni</td>
                      <td className="px-4 py-3 text-center">
                        {member.sickUsed > 0
                          ? <span className="text-red-600">{member.sickUsed} dni</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
