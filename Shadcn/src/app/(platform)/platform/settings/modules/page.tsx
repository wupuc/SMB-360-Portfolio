"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { isDemoMode, demoEnabledModules } from "@/lib/demo/data"
import type { ModuleKey } from "@/types/database.types"
import {
  FileText, BarChart2, FolderKanban, Users, BookOpen, Headphones,
} from "lucide-react"

const ALL_MODULES: ModuleKey[] = [
  "request_flow",
  "sales_track",
  "project_hub",
  "people_hub",
  "book_it",
  "helpdesk",
]

const MODULE_META: Record<ModuleKey, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  request_flow:  { label: "Request Flow",  description: "Wnioski urlopowe, delegacje, nadgodziny i inne.",    icon: <FileText className="h-5 w-5" />,      color: "text-blue-600 bg-blue-50" },
  sales_track:   { label: "Sales Track",   description: "Lejek sprzedaży, kontakty i raporty CRM.",           icon: <BarChart2 className="h-5 w-5" />,     color: "text-green-600 bg-green-50" },
  project_hub:   { label: "Project Hub",   description: "Projekty, zadania, kamienie milowe i kanban.",       icon: <FolderKanban className="h-5 w-5" />,  color: "text-purple-600 bg-purple-50" },
  people_hub:    { label: "People Hub",    description: "Baza pracowników, onboarding i dokumentacja HR.",    icon: <Users className="h-5 w-5" />,         color: "text-orange-600 bg-orange-50" },
  book_it:       { label: "Book It",       description: "Rezerwacje sal, zasobów i sprzętu.",                 icon: <BookOpen className="h-5 w-5" />,      color: "text-teal-600 bg-teal-50" },
  helpdesk:      { label: "Helpdesk",      description: "Zgłoszenia IT, wsparcie i baza wiedzy.",             icon: <Headphones className="h-5 w-5" />,    color: "text-rose-600 bg-rose-50" },
}

export default function ModulesSettingsPage() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState<Record<ModuleKey, boolean>>(
    Object.fromEntries(
      ALL_MODULES.map(k => [k, demoEnabledModules.includes(k)])
    ) as Record<ModuleKey, boolean>
  )

  if (!isDemoMode) {
    return <div className="text-sm text-muted-foreground">Ładowanie...</div>
  }

  function toggle(key: ModuleKey) {
    const next = !enabled[key]
    setEnabled(prev => ({ ...prev, [key]: next }))
    toast({
      title: next
        ? `${MODULE_META[key].label} aktywowany`
        : `${MODULE_META[key].label} wyłączony`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Moduły</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Włącz lub wyłącz moduły platformy dla swojej firmy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_MODULES.map(key => {
          const meta = MODULE_META[key]
          const isOn = enabled[key]
          return (
            <div
              key={key}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                isOn ? "bg-card" : "bg-muted/30 opacity-70"
              }`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isOn ? "bg-primary" : "bg-input"
                }`}
                aria-checked={isOn}
                role="switch"
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isOn ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
