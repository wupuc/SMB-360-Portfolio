"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import {
  demoOpportunities, demoPipelineStages, OWNER_NAMES, demoOwners,
  clientMap, stageMap,
} from "@/lib/demo/sales-data"
import { isDemoMode } from "@/lib/demo/data"
import { fetchOpportunities, fetchPipelineStages, fetchOwners } from "@/lib/supabase/salestrack"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ── helpers ────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(v)
}

function formatPLNAbbrev(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

const POLISH_MONTHS = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
]

const POLISH_MONTHS_FULL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
]

function getMonthFullKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${POLISH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
}

/** Returns YYYY-MM string for a given date string */
function toYearMonth(dateStr: string) {
  return dateStr.slice(0, 7)
}

const STAGE_COLORS: Record<string, string> = {
  "stage-001": "bg-indigo-100 text-indigo-800",
  "stage-002": "bg-blue-100 text-blue-800",
  "stage-003": "bg-amber-100 text-amber-800",
  "stage-004": "bg-green-100 text-green-800",
  "stage-005": "bg-red-100 text-red-800",
}

// ── component ──────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const [periodFilter, setPeriodFilter] = useState<"month" | "quarter" | "year">("quarter")
  const [ownerFilter,  setOwnerFilter]  = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState(isDemoMode ? demoOpportunities : [])
  const [stages, setStages] = useState(isDemoMode ? demoPipelineStages : [])
  const [owners, setOwners] = useState(isDemoMode ? demoOwners : [])

  useEffect(() => {
    if (isDemoMode) return
    Promise.all([fetchOpportunities(), fetchPipelineStages(), fetchOwners()]).then(
      ([opps, stgs, ownrs]) => {
        setOpportunities(opps as typeof demoOpportunities)
        setStages(stgs as typeof demoPipelineStages)
        setOwners(ownrs)
      }
    )
  }, [])

  const localClientMap = Object.fromEntries(opportunities.map(o => [o.clientId, { name: (o as any).clientName ?? o.clientId }]))
  const localStageMap  = Object.fromEntries(stages.map(s => [s.id, s]))

  // Filter: only in-progress stages, optionally by owner
  const inProgressIds = new Set(
    stages
      .filter(s => s.systemFlag === "in_progress")
      .map(s => s.id)
  )

  const filteredDeals = opportunities.filter(o => {
    if (!inProgressIds.has(o.stageId)) return false
    if (ownerFilter !== "all" && o.ownerId !== ownerFilter) return false
    return true
  })

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const pipelineTotal    = filteredDeals.reduce((s, o) => s + o.value, 0)
  const weightedForecast = filteredDeals.reduce((s, o) => s + o.value * o.probability / 100, 0)
  const avgDealSize      = filteredDeals.length > 0 ? pipelineTotal / filteredDeals.length : 0

  const now = new Date()
  const closingThisMonth = filteredDeals.filter(o => {
    const d = new Date(o.expectedClose)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  // ── Chart data ────────────────────────────────────────────────────────────
  function buildChartData() {
    if (periodFilter === "month") {
      // Show 4 weeks of the current month
      const year  = now.getFullYear()
      const month = now.getMonth()
      const weeks: { label: string; month: string; start: Date; end: Date }[] = Array.from({ length: 4 }, (_, i) => {
        const start = new Date(year, month, 1 + i * 7)
        const end   = new Date(year, month, Math.min(7 + i * 7, new Date(year, month + 1, 0).getDate()))
        // Use YYYY-MM for the month key (weeks all share same month)
        const mm = String(month + 1).padStart(2, "0")
        return { label: `Tydz. ${i + 1}`, month: `${year}-${mm}`, start, end }
      })
      return weeks.map(w => {
        const weighted = filteredDeals
          .filter(o => {
            const d = new Date(o.expectedClose)
            return d >= w.start && d <= w.end
          })
          .reduce((s, o) => s + o.value * o.probability / 100, 0)
        return { label: w.label, month: w.month, weighted: Math.round(weighted) }
      })
    }

    if (periodFilter === "year") {
      return Array.from({ length: 12 }, (_, i) => {
        const label = `${POLISH_MONTHS[i]} ${String(now.getFullYear()).slice(2)}`
        const mm = String(i + 1).padStart(2, "0")
        const monthKey = `${now.getFullYear()}-${mm}`
        const weighted = filteredDeals
          .filter(o => {
            const d = new Date(o.expectedClose)
            return d.getFullYear() === now.getFullYear() && d.getMonth() === i
          })
          .reduce((s, o) => s + o.value * o.probability / 100, 0)
        return { label, month: monthKey, weighted: Math.round(weighted) }
      })
    }

    // quarter: next 4 months
    return Array.from({ length: 4 }, (_, i) => {
      const monthIdx = (now.getMonth() + i) % 12
      const year  = now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
      const label = `${POLISH_MONTHS[monthIdx]} ${String(year).slice(2)}`
      const mm = String(monthIdx + 1).padStart(2, "0")
      const monthKey = `${year}-${mm}`
      const weighted = filteredDeals
        .filter(o => {
          const d = new Date(o.expectedClose)
          return d.getFullYear() === year && d.getMonth() === monthIdx
        })
        .reduce((s, o) => s + o.value * o.probability / 100, 0)
      return { label, month: monthKey, weighted: Math.round(weighted) }
    })
  }

  const chartData = buildChartData()

  // ── Table data: filtered by selected month if any ─────────────────────────
  const tableDeals = selectedMonth
    ? filteredDeals.filter(o => o.expectedClose.slice(0, 7) === selectedMonth)
    : filteredDeals

  const sorted = [...tableDeals].sort((a, b) =>
    a.expectedClose.localeCompare(b.expectedClose)
  )

  const groups: Map<string, typeof filteredDeals> = new Map()
  for (const o of sorted) {
    const key = getMonthFullKey(o.expectedClose)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(o)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prognoza sprzedaży</h1>
        <p className="text-sm text-muted-foreground">Ważona prognoza pipeline na podstawie aktywnych szans</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Okres:</Label>
          <Select value={periodFilter} onValueChange={v => {
            setPeriodFilter(v as typeof periodFilter)
            setSelectedMonth(null)
          }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Miesiąc</SelectItem>
              <SelectItem value="quarter">Kwartał</SelectItem>
              <SelectItem value="year">Rok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Handlowiec:</Label>
          <Select value={ownerFilter} onValueChange={v => {
            setOwnerFilter(v)
            setSelectedMonth(null)
          }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy</SelectItem>
              {owners.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Pipeline łącznie
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">{formatPLN(pipelineTotal)}</p>
            <p className="text-xs text-muted-foreground">{filteredDeals.length} szans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Ważona prognoza
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">{formatPLN(weightedForecast)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Zamknięcie w tym miesiącu
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">{closingThisMonth}</p>
            <p className="text-xs text-muted-foreground">szans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
              Śr. wartość szansy
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">{formatPLN(avgDealSize)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ważona prognoza wg okresu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Kliknij słupek, aby przefiltrować tabelę szans poniżej.
          </p>
          <ResponsiveContainer width="100%" minHeight={200} height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={formatPLNAbbrev}
                tick={{ fontSize: 12 }}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatPLN(value), "Ważona wartość"]}
              />
              <Bar
                dataKey="weighted"
                name="Ważona wartość"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => {
                  const month = data.month as string
                  setSelectedMonth(prev => prev === month ? null : month)
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={selectedMonth === entry.month ? "#4f46e5" : "#6366f1"}
                    fillOpacity={selectedMonth && selectedMonth !== entry.month ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table grouped by month */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Szczegóły szans</CardTitle>
          {selectedMonth && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filtrowanie: {selectedMonth}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedMonth(null)}
              >
                Wyczyść ×
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Szansa</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Etap</TableHead>
                <TableHead className="text-right">Wartość</TableHead>
                <TableHead className="text-right">Prawdopodobieństwo</TableHead>
                <TableHead className="text-right">Ważona wartość</TableHead>
                <TableHead>Data zamknięcia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.size === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Brak szans spełniających kryteria
                  </TableCell>
                </TableRow>
              ) : (
                Array.from(groups.entries()).map(([monthLabel, opps]) => {
                  const monthSubtotal = opps.reduce((s, o) => s + o.value * o.probability / 100, 0)
                  return (
                    <>
                      {/* Month header row */}
                      <TableRow key={`header-${monthLabel}`} className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={5} className="py-2 px-4 font-semibold text-sm text-muted-foreground">
                          {monthLabel}
                        </TableCell>
                        <TableCell className="py-2 text-right font-semibold text-sm text-muted-foreground">
                          {formatPLN(monthSubtotal)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      {/* Opportunity rows */}
                      {opps.map(o => {
                        const client = localClientMap[o.clientId]
                        const stage  = localStageMap[o.stageId]
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium text-sm pl-8">{o.name}</TableCell>
                            <TableCell className="text-sm">{client?.name ?? o.clientId}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[o.stageId] ?? "bg-gray-100 text-gray-700"}`}>
                                {stage?.name ?? o.stageId}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatPLN(o.value)}</TableCell>
                            <TableCell className="text-right text-sm">{o.probability}%</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatPLN(o.value * o.probability / 100)}
                            </TableCell>
                            <TableCell className="text-sm">{o.expectedClose}</TableCell>
                          </TableRow>
                        )
                      })}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
