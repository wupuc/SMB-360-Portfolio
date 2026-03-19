"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Save, RotateCcw } from "lucide-react"
import { demoTeam, demoLeaveEntitlements, type DemoLeaveEntitlement } from "@/lib/demo/data"

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const DEFAULTS: DemoLeaveEntitlement = { userId: "", vacation: 26, sick: 14, homeOffice: 20, overtime: 8 }

export default function LeaveEntitlementsPage() {
  const { toast } = useToast()
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [entitlements, setEntitlements] = useState<DemoLeaveEntitlement[]>(
    demoTeam.map(member => {
      const found = demoLeaveEntitlements.find(e => e.userId === member.id)
      return found ?? { ...DEFAULTS, userId: member.id }
    })
  )
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  function updateField(userId: string, field: keyof Omit<DemoLeaveEntitlement, "userId">, value: string) {
    const num = Math.max(0, parseInt(value) || 0)
    setEntitlements(prev => prev.map(e => e.userId === userId ? { ...e, [field]: num } : e))
    setDirty(prev => new Set(prev).add(userId))
  }

  function saveRow(userId: string) {
    const member = demoTeam.find(m => m.id === userId)
    setDirty(prev => { const next = new Set(prev); next.delete(userId); return next })
    toast({ title: `Zapisano limity: ${member?.name}` })
  }

  function resetRow(userId: string) {
    setEntitlements(prev => prev.map(e =>
      e.userId === userId ? { ...DEFAULTS, userId } : e
    ))
    setDirty(prev => { const next = new Set(prev); next.delete(userId); return next })
    toast({ title: "Przywrócono wartości domyślne" })
  }

  function saveAll() {
    setDirty(new Set())
    toast({ title: `Zapisano limity urlopowe dla roku ${year}` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Limity urlopowe</h2>
          <p className="text-sm text-muted-foreground">Ustaw roczne limity dla każdego pracownika</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={saveAll} disabled={dirty.size === 0}>
            <Save className="mr-2 h-4 w-4" />
            Zapisz wszystko
          </Button>
        </div>
      </div>

      {/* Global default */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Globalny limit roczny (nowi pracownicy)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <EntitlementInput label="Urlop wypoczynkowy" unit="dni" defaultValue={26} />
            <EntitlementInput label="L4 (chorobowe)" unit="dni" defaultValue={14} />
            <EntitlementInput label="Home Office" unit="dni" defaultValue={20} />
            <EntitlementInput label="Nadgodziny" unit="h" defaultValue={8} />
            <Button size="sm" variant="outline" onClick={() => toast({ title: "Globalny limit zapisany" })}>
              <Save className="mr-2 h-3.5 w-3.5" />Zapisz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-employee table */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[1fr_110px_100px_110px_100px_100px] gap-3 border-b px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Pracownik</span>
            <span>Urlop (dni)</span>
            <span>L4 (dni)</span>
            <span>Home Office (dni)</span>
            <span>Nadgodziny (h)</span>
            <span></span>
          </div>

          <div className="divide-y">
            {demoTeam.map(member => {
              const ent = entitlements.find(e => e.userId === member.id)!
              const isDirtyRow = dirty.has(member.id)
              return (
                <div key={member.id}
                  className={`grid grid-cols-1 lg:grid-cols-[1fr_110px_100px_110px_100px_100px] gap-3 items-center px-6 py-4 transition-colors ${isDirtyRow ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}>
                  {/* Employee */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold flex-shrink-0">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.department}</p>
                    </div>
                  </div>

                  {/* Vacation */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground lg:hidden">Urlop</span>
                    <Input
                      type="number" min="0" max="365"
                      value={ent.vacation}
                      onChange={e => updateField(member.id, "vacation", e.target.value)}
                      className="h-8 w-full text-sm"
                    />
                  </div>

                  {/* Sick */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground lg:hidden">L4</span>
                    <Input
                      type="number" min="0" max="365"
                      value={ent.sick}
                      onChange={e => updateField(member.id, "sick", e.target.value)}
                      className="h-8 w-full text-sm"
                    />
                  </div>

                  {/* Home office */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground lg:hidden">Home Office</span>
                    <Input
                      type="number" min="0" max="365"
                      value={ent.homeOffice}
                      onChange={e => updateField(member.id, "homeOffice", e.target.value)}
                      className="h-8 w-full text-sm"
                    />
                  </div>

                  {/* Overtime */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground lg:hidden">Nadgodziny</span>
                    <Input
                      type="number" min="0" max="999"
                      value={ent.overtime}
                      onChange={e => updateField(member.id, "overtime", e.target.value)}
                      className="h-8 w-full text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant={isDirtyRow ? "default" : "outline"}
                      className="h-8 flex-1" onClick={() => saveRow(member.id)} disabled={!isDirtyRow}>
                      <Save className="h-3.5 w-3.5" />
                      <span className="ml-1.5 hidden sm:inline">Zapisz</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground"
                      onClick={() => resetRow(member.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function EntitlementInput({ label, unit, defaultValue }: { label: string; unit: string; defaultValue: number }) {
  const [val, setVal] = useState(String(defaultValue))
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Input type="number" min="0" value={val} onChange={e => setVal(e.target.value)}
          className="h-8 w-20 text-sm" />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
