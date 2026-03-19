"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { demoTeam, demoCalendarEvents } from "@/lib/demo/data"

// ─── Colours ──────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  vacation:      "bg-green-200 text-green-900 border-green-300",
  business_trip: "bg-blue-200 text-blue-900 border-blue-300",
  home_office:   "bg-purple-200 text-purple-900 border-purple-300",
  sick:          "bg-red-200 text-red-900 border-red-300",
}

const EVENT_LABELS: Record<string, string> = {
  vacation:      "Urlop",
  business_trip: "Wyjazd służb.",
  home_office:   "Home Office",
  sick:          "L4",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(weekOffset: number): Date[] {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff + weekOffset * 7)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isToday(d: Date): boolean {
  return toISO(d) === toISO(new Date())
}

function formatDayHeader(d: Date) {
  const name = d.toLocaleDateString("pl-PL", { weekday: "short" })
  return { name: name.charAt(0).toUpperCase() + name.slice(1), num: d.getDate() }
}

function formatWeekRange(days: Date[]): string {
  const s = days[0].toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
  const e = days[4].toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })
  return `${s} – ${e}`
}

function formatSingleDay(d: Date): string {
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, c => c.toUpperCase())
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState(() => {
    // Start mobile view on today's weekday (0=Mon … 4=Fri), default to 0
    const d = new Date().getDay()
    return d >= 1 && d <= 5 ? d - 1 : 0
  })

  const weekDays = getWeekDays(weekOffset)
  const mobileDay = weekDays[dayIndex]

  function prevDay() {
    if (dayIndex > 0) {
      setDayIndex(i => i - 1)
    } else {
      setWeekOffset(w => w - 1)
      setDayIndex(4)
    }
  }

  function nextDay() {
    if (dayIndex < 4) {
      setDayIndex(i => i + 1)
    } else {
      setWeekOffset(w => w + 1)
      setDayIndex(0)
    }
  }

  function goToday() {
    setWeekOffset(0)
    const d = new Date().getDay()
    setDayIndex(d >= 1 && d <= 5 ? d - 1 : 0)
  }

  const isCurrentWeek = weekOffset === 0
  const isTodaySelected = isCurrentWeek && isToday(mobileDay)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalendarz zespołu</h1>
        <p className="text-muted-foreground text-sm">Obecność i nieobecności pracowników</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm border ${EVENT_COLORS[type]}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">

            {/* Mobile: single day title */}
            <CardTitle className="text-base sm:hidden capitalize">
              {formatSingleDay(mobileDay)}
            </CardTitle>

            {/* Desktop: week range title */}
            <CardTitle className="text-base hidden sm:block">
              {formatWeekRange(weekDays)}
            </CardTitle>

            {/* Mobile nav: prev/today/next day */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs"
                onClick={goToday} disabled={isTodaySelected}>
                Dziś
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={nextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop nav: prev/current/next week */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setWeekOffset(w => w - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-sm"
                onClick={() => setWeekOffset(0)} disabled={isCurrentWeek}>
                Bieżący
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setWeekOffset(w => w + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* ── Mobile: single-day column ──────────────────────────────────── */}
          <div className="sm:hidden">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr] border-b">
              <div className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pracownik
              </div>
              <div className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wide ${
                isToday(mobileDay) ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}>
                <div>{formatDayHeader(mobileDay).name}</div>
                <div className={`text-base font-bold ${isToday(mobileDay) ? "text-primary" : "text-foreground"}`}>
                  {formatDayHeader(mobileDay).num}
                </div>
              </div>
            </div>

            {/* Rows */}
            {demoTeam.map(member => {
              const memberEvents = demoCalendarEvents.filter(e => e.userId === member.id)
              const dayISO = toISO(mobileDay)
              const event = memberEvents.find(e => e.startDate <= dayISO && dayISO <= e.endDate)

              return (
                <div key={member.id} className="grid grid-cols-[140px_1fr] border-b last:border-0 min-h-[52px]">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                    </div>
                  </div>
                  <div className={`flex items-center px-2 py-3 ${isToday(mobileDay) ? "bg-primary/5" : ""}`}>
                    {event && (
                      <div className={`w-full rounded border px-2 py-1 text-xs font-medium ${EVENT_COLORS[event.type]}`}>
                        {event.label}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop: 5-day week grid ───────────────────────────────────── */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Column headers */}
              <div className="grid grid-cols-[160px_repeat(5,1fr)] border-b">
                <div className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pracownik
                </div>
                {weekDays.map((day, i) => {
                  const { name, num } = formatDayHeader(day)
                  const today = isToday(day)
                  return (
                    <div key={i} className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wide ${
                      today ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}>
                      <div>{name}</div>
                      <div className={`text-base font-bold ${today ? "text-primary" : "text-foreground"}`}>{num}</div>
                    </div>
                  )
                })}
              </div>

              {/* Team rows */}
              {demoTeam.map(member => {
                const memberEvents = demoCalendarEvents.filter(e => e.userId === member.id)
                return (
                  <div key={member.id}
                    className="grid grid-cols-[160px_repeat(5,1fr)] border-b last:border-0 min-h-[52px]">
                    <div className="flex items-center gap-2 px-4 py-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {member.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.department}</p>
                      </div>
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const dayISO = toISO(day)
                      const today = isToday(day)
                      const event = memberEvents.find(e => e.startDate <= dayISO && dayISO <= e.endDate)
                      const isStart = event ? event.startDate === dayISO : false
                      const isEnd   = event ? event.endDate   === dayISO : false
                      return (
                        <div key={dayIdx}
                          className={`relative flex items-center px-1 py-3 ${today ? "bg-primary/5" : ""}`}>
                          {event && (
                            <div className={`w-full rounded border px-1.5 py-1 text-xs font-medium ${EVENT_COLORS[event.type]}
                              ${!isStart ? "rounded-l-none border-l-0" : ""}
                              ${!isEnd   ? "rounded-r-none border-r-0" : ""}`}>
                              {isStart ? event.label : ""}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
