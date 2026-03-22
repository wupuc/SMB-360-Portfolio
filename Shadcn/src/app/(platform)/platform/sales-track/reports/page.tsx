"use client"

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import {
  demoOpportunities, demoPipelineStages, demoInteractions,
  demoCampaigns, demoCloseReasons, demoOwners,
} from "@/lib/demo/sales-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ── helpers ────────────────────────────────────────────────────────────────

function formatPLN(v: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency", currency: "PLN", maximumFractionDigits: 0,
  }).format(v)
}

function defaultFrom() {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().slice(0, 10)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}

// ── component ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo,   setDateTo]   = useState(defaultTo)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const fromDate = new Date(dateFrom)
  const toDate   = new Date(dateTo)

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredInteractions = demoInteractions.filter(i => {
    const d = new Date(i.scheduledAt)
    return d >= fromDate && d <= toDate
  })

  const filteredOpportunities = demoOpportunities.filter(o => {
    const d = new Date(o.expectedClose)
    return d >= fromDate && d <= toDate
  })

  // ── 1. Pipeline wg etapów ─────────────────────────────────────────────────
  const activeStages = demoPipelineStages.filter(s => s.isActive && s.systemFlag === "in_progress")

  const pipelineByStage = activeStages.map(s => {
    const opps  = filteredOpportunities.filter(o => o.stageId === s.id)
    const total = opps.reduce((sum, o) => sum + o.value, 0)
    return { id: s.id, name: s.name, count: opps.length, total, color: s.color }
  })

  // Table rows filtered by selectedStage
  const pipelineTableRows = selectedStage
    ? pipelineByStage.filter(s => s.name === selectedStage)
    : pipelineByStage

  // ── 2. Won/Lost ───────────────────────────────────────────────────────────
  const wonCount  = filteredOpportunities.filter(o => o.stageId === "stage-004").length
  const lostCount = filteredOpportunities.filter(o => o.stageId === "stage-005").length
  const winLossData = [
    { name: "Wygrane", value: wonCount,  fill: "#10b981" },
    { name: "Przegrane", value: lostCount, fill: "#ef4444" },
  ]
  const wonReasons  = demoCloseReasons.filter(r => r.type === "won"  && r.isActive)
  const lostReasons = demoCloseReasons.filter(r => r.type === "lost" && r.isActive)

  // ── 3. Aktywność handlowców ───────────────────────────────────────────────
  const ownerActivity = demoOwners.map(owner => {
    const ints = filteredInteractions.filter(i => i.assignedTo === owner.id)
    return {
      name:     owner.name,
      telefony: ints.filter(i => i.type === "call").length,
      spotkania:ints.filter(i => i.type === "meeting").length,
      emaile:   ints.filter(i => i.type === "email").length,
      notatki:  ints.filter(i => i.type === "note").length,
      zadania:  ints.filter(i => i.type === "task").length,
      total:    ints.length,
    }
  })

  // ── 4. ROI kampanii ───────────────────────────────────────────────────────
  const campaignROI = demoCampaigns
    .map(c => {
      const linkedOpps = demoOpportunities.filter(o =>
        c.linkedOpportunityIds.includes(o.id)
      )
      const pipeline = linkedOpps.reduce((s, o) => s + o.value, 0)
      return {
        id:       c.id,
        name:     c.name,
        budget:   c.budget,
        oppCount: c.linkedOpportunityIds.length,
        pipeline,
      }
    })
    .sort((a, b) => b.pipeline - a.pipeline)

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Raporty sprzedaży</h1>
        <p className="text-sm text-muted-foreground">Analiza pipeline, aktywności i kampanii</p>
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-wrap">
            <div className="space-y-1">
              <Label className="text-sm">Data od</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Data do</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <p className="text-sm text-muted-foreground sm:pb-0 sm:self-end sm:mb-0.5">
              {filteredOpportunities.length} szans · {filteredInteractions.length} interakcji
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 1: Pipeline wg etapów ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline wg etapów</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pipelineByStage.every(s => s.count === 0) ? (
            <p className="text-sm text-muted-foreground">Brak danych w wybranym okresie.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Kliknij słupek, aby przefiltrować tabelę etapów poniżej.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={pipelineByStage}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 90, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={84}
                  />
                  <Tooltip formatter={(v: number) => [formatPLN(v), "Wartość"]} />
                  <Bar
                    dataKey="total"
                    name="Wartość"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const name = data.name as string
                      setSelectedStage(prev => prev === name ? null : name)
                    }}
                  >
                    {pipelineByStage.map((s, i) => (
                      <Cell
                        key={i}
                        fill={s.color}
                        fillOpacity={selectedStage && selectedStage !== s.name ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Stage filter indicator */}
              {selectedStage && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Filtrowanie: {selectedStage}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedStage(null)}
                  >
                    Wyczyść ×
                  </Button>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etap</TableHead>
                      <TableHead className="text-right">Liczba szans</TableHead>
                      <TableHead className="text-right">Wartość</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineTableRows.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{s.count}</TableCell>
                        <TableCell className="text-right">{formatPLN(s.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Wygrane / Przegrane ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analiza wygranych / przegranych</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Donut */}
            <div className="flex flex-col items-center">
              {wonCount + lostCount === 0 ? (
                <p className="text-sm text-muted-foreground py-12">Brak danych w wybranym okresie.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {winLossData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v: number) => [`${v} szans`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Reasons */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2">Powody wygranych</p>
                <ul className="space-y-1">
                  {wonReasons.map(r => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 mb-2">Powody przegranych</p>
                <ul className="space-y-1">
                  {lostReasons.map(r => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Aktywność handlowców ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktywność handlowców</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handlowiec</TableHead>
                <TableHead className="text-right">Telefony</TableHead>
                <TableHead className="text-right">Spotkania</TableHead>
                <TableHead className="text-right">E-maile</TableHead>
                <TableHead className="text-right">Notatki</TableHead>
                <TableHead className="text-right">Zadania</TableHead>
                <TableHead className="text-right font-semibold">Łącznie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerActivity.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{row.telefony}</TableCell>
                  <TableCell className="text-right">{row.spotkania}</TableCell>
                  <TableCell className="text-right">{row.emaile}</TableCell>
                  <TableCell className="text-right">{row.notatki}</TableCell>
                  <TableCell className="text-right">{row.zadania}</TableCell>
                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
              {ownerActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Brak danych
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Section 4: ROI kampanii ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ROI kampanii</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kampania</TableHead>
                <TableHead className="text-right">Budżet</TableHead>
                <TableHead className="text-right">Szanse powiązane</TableHead>
                <TableHead className="text-right">Pipeline wygenerowany</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignROI.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-right text-sm">{formatPLN(c.budget)}</TableCell>
                  <TableCell className="text-right text-sm">{c.oppCount}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {c.pipeline > 0 ? formatPLN(c.pipeline) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {campaignROI.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Brak kampanii
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
