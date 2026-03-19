"use client"

import { useState } from "react"
import Link from "next/link"
import { IconArrowRight, IconBriefcase, IconRefresh, IconCheck, IconSearch, IconWorld } from "@tabler/icons-react"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  projects,
  ALL_STATUSES,
  SECTION_ORDER,
  SECTION_ICONS,
  STATUS_CLASSES,
  STATUS_DOT,
  type Status,
} from "@/data/portfolio-projects"

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", STATUS_CLASSES[status])}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </Badge>
  )
}

// ── Tech tag ─────────────────────────────────────────────────────────────────
function TechTag({ label }: { label: string }) {
  return (
    <span className="rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
      {label}
    </span>
  )
}

// ── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: typeof projects[0] }) {
  return (
    <Link href={`/portfolio/${project.id}`} className="group block h-full">
      <Card className="flex h-full flex-col transition-all duration-200 hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-xl">
              {project.icon}
            </div>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-3">
            <h3 className="font-semibold leading-snug text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {project.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{project.subtitle}</p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 pb-3">
          <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {project.short}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tech.map(t => <TechTag key={t} label={t} />)}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Separator className="mb-3" />
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-muted-foreground">{project.features.length} funkcji</span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              Szczegóły <IconArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [filter, setFilter] = useState<string>("Wszystkie")

  const filtered = filter === "Wszystkie" ? projects : projects.filter(p => p.status === filter)

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "Wszystkie" ? projects.length : projects.filter(p => p.status === s).length
    return acc
  }, {})

  const pocCount  = counts["POC Gotowy"] ?? 0
  const devCount  = counts["W Trakcie"] ?? 0

  return (
    <>
      <Header />

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolio Działu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Przegląd projektów, agentów AI i inicjatyw strategicznych — CEE + GR, 2025
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              {projects.length} projektów
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Wszystkich projektów", value: projects.length, icon: <IconBriefcase size={18} />, color: "text-foreground" },
            { label: "POC Gotowy",           value: pocCount,         icon: <IconCheck size={18} />,    color: "text-emerald-600 dark:text-emerald-400" },
            { label: "W Trakcie",            value: devCount,         icon: <IconRefresh size={18} />,  color: "text-amber-600 dark:text-amber-400" },
            { label: "Rynki",                value: "CEE + GR",       icon: <IconWorld size={18} />,    color: "text-sky-600 dark:text-sky-400" },
          ].map((s, i) => (
            <Card key={i} className="flex items-center gap-4 p-4">
              <div className={cn("shrink-0", s.color)}>{s.icon}</div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                filter === s
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-violet-300 hover:text-foreground"
              )}
            >
              {s}
              <span className="ml-1.5 opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Sections */}
        {SECTION_ORDER.map(section => {
          const cards = filtered.filter(p => p.section === section)
          if (cards.length === 0) return null
          return (
            <div key={section} className="space-y-4">
              {/* Section heading */}
              <div className="flex items-center gap-3">
                <span className="text-lg">{SECTION_ICONS[section]}</span>
                <h2 className="text-base font-semibold text-foreground">{section}</h2>
                <div className="h-px flex-1 bg-border" />
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {cards.length} {cards.length === 1 ? "projekt" : cards.length <= 4 ? "projekty" : "projektów"}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(p => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
