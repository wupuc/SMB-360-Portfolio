"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts"
import {
  FolderKanban, CheckSquare2, AlertCircle, Users, TrendingUp,
  CheckCircle2, Clock, BarChart2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportData = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  doneTasks: number
  overdueTasks: number
  teamMembers: number

  tasksByStatus:   { status: string; label: string; count: number; color: string }[]
  tasksByPriority: { priority: string; label: string; count: number; color: string }[]
  sprintVelocity:  { sprint: string; planned: number; completed: number }[]
  weeklyThroughput:{ week: string; completed: number }[]

  projects: {
    id: string; name: string; status: string
    totalTasks: number; doneTasks: number; overdueTasks: number; members: number
  }[]

  memberWorkload: { name: string; activeTasks: number; doneTasks: number }[]
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Project status badge ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  planning: "Planowanie", active: "Aktywny", on_hold: "Wstrzymany",
  completed: "Zakończony", cancelled: "Anulowany",
}
const STATUS_CLASS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700", active: "bg-blue-100 text-blue-700",
  on_hold: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

// ─── Custom pie label ─────────────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportsPageClient({ data }: { data: ReportData }) {
  const [tab, setTab] = useState("overview")

  const completionRate = data.totalTasks > 0 ? Math.round((data.doneTasks / data.totalTasks) * 100) : 0
  const avgVelocity = data.sprintVelocity.length > 0
    ? Math.round(data.sprintVelocity.reduce((s, v) => s + v.completed, 0) / data.sprintVelocity.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Raporty projektów</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Analiza wydajności zespołu, postępu projektów i przepustowości sprintów.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Aktywne projekty"  value={data.activeProjects}    sub={`z ${data.totalProjects} łącznie`}  icon={FolderKanban}  color="bg-blue-500" />
        <KpiCard label="Ukończone zadania" value={`${completionRate}%`}   sub={`${data.doneTasks}/${data.totalTasks} zadań`} icon={CheckSquare2} color="bg-green-500" />
        <KpiCard label="Zaległe zadania"   value={data.overdueTasks}      sub="przekroczony termin"                 icon={AlertCircle}   color="bg-red-500"  />
        <KpiCard label="Śr. predkość sprintu" value={`${avgVelocity} zd.`} sub="zadań na sprint"                  icon={TrendingUp}    color="bg-purple-500" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="projects">Projekty</TabsTrigger>
          <TabsTrigger value="team">Zespół</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Task status pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status zadań</CardTitle>
                <CardDescription className="text-xs">{data.totalTasks} zadań łącznie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.tasksByStatus}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={PieLabel}
                    >
                      {data.tasksByStatus.map(s => (
                        <Cell key={s.status} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task priority bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Priorytety zadań</CardTitle>
                <CardDescription className="text-xs">Rozkład według priorytetu</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.tasksByPriority} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Zadania" radius={[4,4,0,0]}>
                      {data.tasksByPriority.map(p => (
                        <Cell key={p.priority} fill={p.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly throughput */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Przepustowość tygodniowa</CardTitle>
              <CardDescription className="text-xs">Liczba ukończonych zadań w ciągu ostatnich 8 tygodni</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.weeklyThroughput}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Ukończone"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Velocity ── */}
        <TabsContent value="velocity" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Velocity sprintów</CardTitle>
              <CardDescription className="text-xs">
                Porównanie zaplanowanych i ukończonych zadań na sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.sprintVelocity} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="square" iconSize={10} />
                  <Bar dataKey="planned"   name="Zaplanowane" fill="#cbd5e1" radius={[4,4,0,0]} barSize={20} />
                  <Bar dataKey="completed" name="Ukończone"   fill="#8b5cf6" radius={[4,4,0,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sprint summary table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Podsumowanie sprintów</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Sprint</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Zaplanowane</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Ukończone</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Realizacja</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sprintVelocity.map((sv, i) => {
                    const pct = sv.planned > 0 ? Math.round((sv.completed / sv.planned) * 100) : 0
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{sv.sprint}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{sv.planned}</td>
                        <td className="px-4 py-2.5 text-right">{sv.completed}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={pct >= 90 ? "text-green-600 font-medium" : pct >= 70 ? "text-amber-600" : "text-red-600"}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Projects ── */}
        <TabsContent value="projects" className="mt-4 space-y-3">
          {data.projects.map(p => {
            const pct = p.totalTasks > 0 ? Math.round((p.doneTasks / p.totalTasks) * 100) : 0
            return (
              <Card key={p.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link
                        href={`/platform/project-hub/projects/${p.id}`}
                        className="font-medium text-sm hover:underline truncate block"
                      >
                        {p.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.overdueTasks > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <AlertCircle className="h-2.5 w-2.5" /> {p.overdueTasks} zaległe
                        </Badge>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[p.status] ?? ""}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Postęp zadań</span>
                      <span className="font-medium text-foreground">{p.doneTasks}/{p.totalTasks} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {data.projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">Brak projektów do wyświetlenia.</p>
          )}
        </TabsContent>

        {/* ── Team ── */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Obciążenie członków zespołu</CardTitle>
              <CardDescription className="text-xs">Aktywne i ukończone zadania per osoba</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.memberWorkload} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="square" iconSize={10} />
                  <Bar dataKey="activeTasks" name="Aktywne"   fill="#3b82f6" radius={[0,4,4,0]} barSize={14} />
                  <Bar dataKey="doneTasks"   name="Ukończone" fill="#22c55e" radius={[0,4,4,0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Member table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Szczegóły wkładu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Pracownik</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Aktywne</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Ukończone</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Efektywność</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberWorkload.map((m, i) => {
                    const total = m.activeTasks + m.doneTasks
                    const eff = total > 0 ? Math.round((m.doneTasks / total) * 100) : 0
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                              {m.name.slice(0, 1)}
                            </span>
                            <span className="font-medium">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-600 font-medium">{m.activeTasks}</td>
                        <td className="px-4 py-2.5 text-right text-green-600 font-medium">{m.doneTasks}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={eff} className="h-1.5 w-16" />
                            <span className="text-xs font-medium w-8 text-right">{eff}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
