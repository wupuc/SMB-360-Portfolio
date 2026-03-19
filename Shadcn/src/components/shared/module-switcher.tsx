"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ClipboardList,
  TrendingUp,
  Kanban,
  Users,
  CalendarDays,
  Headphones,
  LayoutGrid,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import type { ModuleKey } from "@/types/database.types"

interface ModuleItem {
  key: ModuleKey
  label: string
  description: string
  icon: React.ElementType
  href: string
  color: string
}

const MODULES: ModuleItem[] = [
  {
    key: "request_flow",
    label: "RequestFlow",
    description: "Requests & approvals",
    icon: ClipboardList,
    href: "/platform/request-flow",
    color: "text-blue-600",
  },
  {
    key: "sales_track",
    label: "SalesTrack",
    description: "CRM & pipeline",
    icon: TrendingUp,
    href: "/platform/sales-track",
    color: "text-green-600",
  },
  {
    key: "project_hub",
    label: "ProjectHub",
    description: "Projects & tasks",
    icon: Kanban,
    href: "/platform/project-hub",
    color: "text-purple-600",
  },
  {
    key: "people_hub",
    label: "PeopleHub",
    description: "HR & recruitment",
    icon: Users,
    href: "/platform/people-hub",
    color: "text-orange-600",
  },
  {
    key: "book_it",
    label: "BookIt",
    description: "Resource booking",
    icon: CalendarDays,
    href: "/platform/book-it",
    color: "text-cyan-600",
  },
  {
    key: "helpdesk",
    label: "Helpdesk",
    description: "Support tickets",
    icon: Headphones,
    href: "/platform/helpdesk",
    color: "text-red-600",
  },
]

interface ModuleSwitcherProps {
  enabledModules?: ModuleKey[]
}

export function ModuleSwitcher({ enabledModules }: ModuleSwitcherProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  function getActiveModule(): ModuleKey | null {
    for (const m of MODULES) {
      if (pathname.startsWith(m.href)) return m.key
    }
    return null
  }

  const activeModule = getActiveModule()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Switch module"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        side="right"
        align="end"
        sideOffset={8}
      >
        <p className="text-muted-foreground mb-2 px-1 text-xs font-medium uppercase tracking-wide">
          Applications
        </p>
        <div className="grid grid-cols-2 gap-1">
          {MODULES.map((mod) => {
            const isActive = mod.key === activeModule
            const isDisabled =
              enabledModules !== undefined && !enabledModules.includes(mod.key)

            return (
              <button
                key={mod.key}
                onClick={() => {
                  if (isDisabled) return
                  router.push(mod.href)
                  setOpen(false)
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg p-3 text-left transition-colors",
                  isActive
                    ? "bg-primary/10 border-primary/30 border"
                    : "hover:bg-muted",
                  isDisabled && "cursor-not-allowed opacity-40"
                )}
                aria-disabled={isDisabled}
              >
                <mod.icon className={cn("h-5 w-5", mod.color)} />
                <span className="text-sm font-medium leading-none">
                  {mod.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {mod.description}
                </span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
