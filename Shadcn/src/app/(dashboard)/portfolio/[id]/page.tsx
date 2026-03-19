import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft, IconStack2, IconTargetArrow, IconCircleCheck } from "@tabler/icons-react"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  projects,
  SECTION_ICONS,
  STATUS_CLASSES,
  STATUS_DOT,
  type Status,
} from "@/data/portfolio-projects"

function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "md" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        size === "md" && "px-3 py-1 text-sm",
        STATUS_CLASSES[status]
      )}
    >
      <span className={cn("rounded-full", size === "sm" ? "size-1.5" : "size-2", STATUS_DOT[status])} />
      {status}
    </Badge>
  )
}

function TechTag({ label }: { label: string }) {
  return (
    <span className="rounded border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
      {label}
    </span>
  )
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = projects.find(p => p.id === Number(id))
  if (!project) notFound()

  const related = projects.filter(p => p.section === project.section && p.id !== project.id)

  return (
    <>
      <Header />

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/portfolio" className="flex items-center gap-1.5">
              <IconArrowLeft size={14} />
              Portfolio
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{project.section}</span>
        </div>

        {/* ── Hero card ── */}
        <Card className="relative overflow-hidden">
          {/* Violet top accent */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-violet-400 to-transparent" />

          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Icon */}
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border bg-muted text-3xl shadow-sm">
                {project.icon}
              </div>

              {/* Title block */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    {project.section}
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {project.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{project.subtitle}</p>
                </div>

                {/* Status + tech */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} size="md" />
                  <Separator orientation="vertical" className="h-4" />
                  {project.tech.map(t => <TechTag key={t} label={t} />)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Two-column layout ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <IconStack2 size={14} className="text-violet-500" />
                  Opis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground">{project.short}</p>
              </CardContent>
            </Card>

            {/* Purpose */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <IconTargetArrow size={14} className="text-violet-500" />
                  Cel i Wartość Biznesowa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{project.purpose}</p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <IconCircleCheck size={14} className="text-violet-500" />
                  Kluczowe Funkcje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {project.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{f}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">

            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={project.status} size="md" />
              </CardContent>
            </Card>

            {/* Tech stack */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stack Technologiczny
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.tech.map(t => (
                  <div key={t} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <span className="size-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-xs text-foreground">{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sekcja
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <span className="text-lg">{SECTION_ICONS[project.section]}</span>
                <span className="text-xs text-muted-foreground leading-snug">{project.section}</span>
              </CardContent>
            </Card>

            {/* Related projects */}
            {related.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inne w tej sekcji
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {related.map(r => (
                    <Link
                      key={r.id}
                      href={`/portfolio/${r.id}`}
                      className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm transition-colors hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
                    >
                      <span className="text-base">{r.icon}</span>
                      <div>
                        <div className="text-xs font-medium text-foreground leading-snug">{r.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{r.status}</div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
