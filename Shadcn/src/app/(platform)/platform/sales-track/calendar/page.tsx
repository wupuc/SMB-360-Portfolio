"use client"

import { demoInteractions } from "@/lib/demo/sales-data"
import InteractionCalendar from "@/components/shared/interaction-calendar"

export default function SalesCalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalendarz aktywności</h1>
        <p className="text-muted-foreground text-sm">Wszystkie zaplanowane interakcje handlowe</p>
      </div>
      <InteractionCalendar interactions={demoInteractions} />
    </div>
  )
}
