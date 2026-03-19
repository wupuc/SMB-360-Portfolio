"use client"

import { useTransition, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toggleModule } from "@/app/actions/modules"
import type { ModuleKey } from "@/types/database.types"

interface ModuleInfo {
  key: ModuleKey
  label: string
  description: string
  icon: string
}

const MODULE_INFO: Record<ModuleKey, Omit<ModuleInfo, "key">> = {
  request_flow: {
    label: "Request Flow",
    description: "Manage internal requests, approvals, and workflows.",
    icon: "📋",
  },
  sales_track: {
    label: "Sales Track",
    description: "CRM tools for managing clients, opportunities, and campaigns.",
    icon: "📈",
  },
  project_hub: {
    label: "Project Hub",
    description: "Project management, tasks, and team workload tracking.",
    icon: "🗂️",
  },
  people_hub: {
    label: "People Hub",
    description: "HR tools for employees, recruitment, and performance.",
    icon: "👥",
  },
  book_it: {
    label: "Book It",
    description: "Resource and room booking management.",
    icon: "📅",
  },
  helpdesk: {
    label: "Helpdesk",
    description: "Support ticket system and knowledge base.",
    icon: "🎧",
  },
}

interface Props {
  moduleKey: ModuleKey
  isEnabled: boolean
}

export function ModuleToggleCard({ moduleKey, isEnabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const info = MODULE_INFO[moduleKey]

  function handleToggle(checked: boolean) {
    setEnabled(checked)
    setError(null)
    startTransition(async () => {
      const result = await toggleModule(moduleKey, checked)
      if (result.error) {
        setEnabled(!checked) // revert
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex items-start justify-between rounded-lg border p-4 gap-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5" aria-hidden="true">
          {info.icon}
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{info.label}</span>
            <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">{info.description}</p>
          {error && <p className="text-destructive text-xs mt-1">{error}</p>}
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`Toggle ${info.label}`}
      />
    </div>
  )
}
