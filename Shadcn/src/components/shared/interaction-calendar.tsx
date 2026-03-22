"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Phone, Mail, Users, FileText, CheckSquare2, ChevronDown } from "lucide-react"
import type { DemoInteraction, InteractionType } from "@/lib/demo/sales-data"

// ─── Color scheme ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<InteractionType, string> = {
  call:    "bg-blue-100 text-blue-800 border-blue-200",
  meeting: "bg-green-100 text-green-800 border-green-200",
  email:   "bg-purple-100 text-purple-800 border-purple-200",
  note:    "bg-gray-100 text-gray-700 border-gray-200",
  task:    "bg-orange-100 text-orange-800 border-orange-200",
}

const TYPE_ICONS: Record<InteractionType, React.ElementType> = {
  call: Phone, meeting: Users, email: Mail, note: FileText, task: CheckSquare2,
}

const TYPE_LABELS: Record<InteractionType, string> = {
  call: "Telefon", meeting: "Spotkanie", email: "Email", note: "Notatka", task: "Zadanie",
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
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  return d
    .toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, c => c.toUpperCase())
}

function formatTime(iso: string): string {
  // Extract HH:mm from ISO datetime string
  const timePart = iso.slice(11, 16)
  return timePart || ""
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InteractionCalendarProps {
  interactions: DemoInteraction[]
  title?: string
  description?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InteractionCalendar({
  interactions,
  title,
  description,
}: InteractionCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState(() => {
    const d = new Date().getDay()
    return d >= 1 && d <= 5 ? d - 1 : 0
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  function getInteractionsForDay(day: Date): DemoInteraction[] {
    const iso = toISO(day)
    return interactions.filter(i => i.scheduledAt.slice(0, 10) === iso)
  }

  function toggleExpanded(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Optional title/description */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(TYPE_LABELS) as [InteractionType, string][]).map(([type, label]) => {
          const Icon = TYPE_ICONS[type]
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[type]}`}>
                <Icon className="h-3 w-3" />
                {label}
              </span>
            </div>
          )
        })}
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
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={goToday}
                disabled={isTodaySelected}
              >
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
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setWeekOffset(0)}
                disabled={isCurrentWeek}
              >
                Bieżący
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setWeekOffset(w => w + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* ── Mobile: single-day view ─────────────────────────────────── */}
          <div className="sm:hidden">
            {/* Day header */}
            <div className={`border-b px-4 py-3 text-xs font-medium uppercase tracking-wide ${
              isToday(mobileDay) ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}>
              <div>{formatDayHeader(mobileDay).name}</div>
              <div className={`text-base font-bold ${isToday(mobileDay) ? "text-primary" : "text-foreground"}`}>
                {formatDayHeader(mobileDay).num}
              </div>
            </div>

            {/* Interactions for the day */}
            <div className="divide-y">
              {(() => {
                const dayItems = getInteractionsForDay(mobileDay)
                if (dayItems.length === 0) {
                  return (
                    <div className="px-4 py-6 text-sm text-center text-muted-foreground">
                      Brak zaplanowanych interakcji
                    </div>
                  )
                }
                return dayItems.map(item => {
                  const Icon = TYPE_ICONS[item.type]
                  const isExpanded = expandedId === item.id
                  const time = formatTime(item.scheduledAt)
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium leading-tight">{item.title}</p>
                            {time && (
                              <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                              {TYPE_LABELS[item.type]}
                            </span>
                            <Badge
                              variant={item.status === "done" ? "default" : "outline"}
                              className={`text-xs ${item.status === "done" ? "bg-green-500 hover:bg-green-600" : ""}`}
                            >
                              {item.status === "done" ? "Wyk." : "Todo"}
                            </Badge>
                          </div>
                        </div>
                        {isExpanded && item.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* ── Desktop: 5-day week grid ────────────────────────────────── */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[520px]">

              {/* Column headers */}
              <div className="grid grid-cols-5 border-b divide-x">
                {weekDays.map((day, i) => {
                  const { name, num } = formatDayHeader(day)
                  const today = isToday(day)
                  return (
                    <div
                      key={i}
                      className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wide ${
                        today ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <div>{name}</div>
                      <div className={`text-base font-bold ${today ? "text-primary" : "text-foreground"}`}>
                        {num}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Day columns — interaction chips */}
              <div className="grid grid-cols-5 divide-x min-h-[140px]">
                {weekDays.map((day, dayIdx) => {
                  const today = isToday(day)
                  const dayItems = getInteractionsForDay(day)
                  const visible = dayItems.slice(0, 3)
                  const overflow = dayItems.length - 3
                  const showOverflow = overflow > 0

                  return (
                    <div
                      key={dayIdx}
                      className={`flex flex-col gap-1 p-2 ${today ? "bg-primary/5" : ""}`}
                    >
                      {dayItems.length === 0 && (
                        <span className="text-xs text-muted-foreground/50 mt-1">—</span>
                      )}
                      {visible.map(item => {
                        const Icon = TYPE_ICONS[item.type]
                        const isExpanded = expandedId === item.id
                        const shortTitle = item.title.length > 20
                          ? item.title.slice(0, 20) + "…"
                          : item.title
                        const time = formatTime(item.scheduledAt)

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleExpanded(item.id)}
                            className={`group w-full rounded border px-1.5 py-1 text-xs cursor-pointer transition-shadow hover:shadow-sm ${TYPE_COLORS[item.type]}`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <Icon className="h-3 w-3 shrink-0" />
                              <span className="truncate font-medium leading-tight">
                                {isExpanded ? item.title : shortTitle}
                              </span>
                            </div>
                            {time && (
                              <div className="text-[10px] opacity-70 mt-0.5 pl-4">{time}</div>
                            )}
                            {isExpanded && (
                              <div className="mt-1 pt-1 border-t border-current/20 space-y-0.5">
                                {item.description && (
                                  <p className="opacity-80 leading-relaxed">{item.description}</p>
                                )}
                                <span className={`inline-block rounded px-1 py-0.5 text-[10px] font-semibold ${
                                  item.status === "done"
                                    ? "bg-green-500 text-white"
                                    : "bg-white/60 text-current"
                                }`}>
                                  {item.status === "done" ? "Wykonane" : "Do zrobienia"}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {showOverflow && (
                        <button
                          className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5 px-0.5"
                          onClick={() => {
                            // Show remaining by toggling — just expand first hidden item as affordance
                            const firstHidden = dayItems[3]
                            if (firstHidden) toggleExpanded(firstHidden.id)
                          }}
                        >
                          <ChevronDown className="h-3 w-3" />
                          +{overflow} więcej
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
