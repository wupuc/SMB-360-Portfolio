"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp, AlertTriangle, CheckSquare2,
  Flame, Clock, Phone, Mail, Users, CalendarCheck, FileText, MessageSquare
} from "lucide-react"
import {
  demoOpportunities, demoPipelineStages, demoClients, demoInteractions,
  type DemoOpportunity, type DemoInteraction,
} from "@/lib/demo/sales-data"
import { isDemoMode } from "@/lib/demo/data"
import { fetchOpportunities, fetchPipelineStages, fetchClients, fetchInteractions } from "@/lib/supabase/salestrack"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  note: FileText,
  task: CheckSquare2,
}

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v)
}

export default function SalesTrackDashboard() {
  const { toast } = useToast()
  const [interactions, setInteractions] = useState<DemoInteraction[]>(isDemoMode ? demoInteractions : [])
  const [opportunities, setOpportunities] = useState<DemoOpportunity[]>(isDemoMode ? demoOpportunities : [])
  const [stages, setStages] = useState(isDemoMode ? demoPipelineStages : [])
  const [clients, setClients] = useState(isDemoMode ? demoClients : [])

  useEffect(() => {
    if (isDemoMode) return
    Promise.all([fetchOpportunities(), fetchPipelineStages(), fetchClients(), fetchInteractions()]).then(
      ([opps, stgs, clts, ints]) => {
        setOpportunities(opps as unknown as DemoOpportunity[])
        setStages(stgs as typeof demoPipelineStages)
        setClients(clts as unknown as typeof demoClients)
        setInteractions(ints as unknown as DemoInteraction[])
      }
    )
  }, [])

  const activeStages = stages.filter(s => s.systemFlag === "in_progress")
  const openDeals = opportunities.filter(o => activeStages.some(s => s.id === o.stageId))
  const pipelineValue = openDeals.reduce((sum, o) => sum + o.value, 0)

  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()
  const closingThisMonth = opportunities.filter(o => {
    const d = new Date(o.expectedClose)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.probability < 100
  })

  const todayStr = today.toISOString().slice(0, 10)
  const todayTasks = interactions.filter(i => i.status === "todo" && i.scheduledAt?.slice(0, 10) === todayStr)

  const inactivityAlerts = openDeals.filter(o => o.inactivityFlag === "red" || o.inactivityFlag === "amber")

  const recentActivity = [...interactions]
    .filter(i => i.status === "done" && i.completedAt)
    .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))
    .slice(0, 5)

  function markDone(id: string) {
    setInteractions(prev =>
      prev.map(i => i.id === id ? { ...i, status: "done" as const, completedAt: new Date().toISOString() } : i)
    )
    toast({ title: "Zadanie oznaczone jako wykonane" })
  }

  const maxStageValue = Math.max(
    ...activeStages.map(s => openDeals.filter(o => o.stageId === s.id).reduce((sum, o) => sum + o.value, 0)),
    1
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">SalesTrack</h1>
        <p className="text-muted-foreground text-sm">Dashboard sprzedaży</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-4 w-4" />Otwarte szanse
            </div>
            <div className="text-2xl font-bold">{openDeals.length}</div>
            <div className="text-xs text-muted-foreground">{formatPLN(pipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CalendarCheck className="h-4 w-4" />Zamykane w tym miesiącu
            </div>
            <div className="text-2xl font-bold">{closingThisMonth.length}</div>
            <div className="text-xs text-muted-foreground">{formatPLN(closingThisMonth.reduce((s, o) => s + o.value, 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-4 w-4" />Zadania na dziś
            </div>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <div className="text-xs text-muted-foreground">do wykonania</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />Alerty nieaktywności
            </div>
            <div className="text-2xl font-bold">{inactivityAlerts.length}</div>
            <div className="text-xs text-muted-foreground">szans wymaga uwagi</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Zadania na dziś</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zadań na dziś.</p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map(t => {
                  const Icon = TYPE_ICONS[t.type] ?? Clock
                  const client = clients.find(c => c.id === t.clientId)
                  return (
                    <li key={t.id} className="flex items-start gap-3 rounded-lg border p-2">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        {client && <p className="text-xs text-muted-foreground">{client.name}</p>}
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => markDone(t.id)}>
                        Wykonaj
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Inactivity alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Alerty nieaktywności
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inactivityAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak alertów.</p>
            ) : (
              <ul className="space-y-2">
                {inactivityAlerts.map(o => {
                  const client = clients.find(c => c.id === o.clientId)
                  const isRed = o.inactivityFlag === "red"
                  return (
                    <li
                      key={o.id}
                      className={`rounded-lg border p-3 ${isRed
                        ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                        : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{o.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client?.name} · ostatnia aktywność: {o.lastActivity}
                          </p>
                        </div>
                        <Badge
                          variant={isRed ? "destructive" : "outline"}
                          className={!isRed ? "border-amber-500 text-amber-700" : ""}
                        >
                          {isRed ? "Krytyczny" : "Uwaga"}
                        </Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline summary bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pipeline wg etapów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeStages.map(stage => {
              const stageDeals = openDeals.filter(o => o.stageId === stage.id)
              const stageValue = stageDeals.reduce((sum, o) => sum + o.value, 0)
              const pct = Math.round((stageValue / maxStageValue) * 100)
              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                      <span className="text-muted-foreground text-xs">({stageDeals.length})</span>
                    </span>
                    <span className="font-medium">{formatPLN(stageValue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Ostatnia aktywność
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recentActivity.map(i => {
              const Icon = TYPE_ICONS[i.type] ?? Clock
              const client = demoClients.find(c => c.id === i.clientId)
              const owner = (i as any).ownerName ?? i.assignedTo
              return (
                <li key={i.id} className="flex items-start gap-3 text-sm">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{i.title}</span>
                    {client && <span className="text-muted-foreground"> · {client.name}</span>}
                    <p className="text-xs text-muted-foreground">{owner} · {i.completedAt?.slice(0, 10)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" asChild>
            <Link href="/platform/sales-track/interactions">Zobacz wszystkie interakcje →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
