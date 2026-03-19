import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PeopleHubPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People Hub</h1>
        <p className="text-muted-foreground text-sm">HR, rekrutacja i rozwój pracowników</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <Users className="h-7 w-7 text-orange-600" />
        </div>
        <h2 className="text-lg font-semibold">People Hub — wkrótce</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Zarządzaj danymi pracowników, procesami rekrutacyjnymi, ocenami wydajności i
          programami szkoleniowymi.
        </p>
        <Button className="mt-6" disabled variant="outline" size="sm">
          Dowiedz się więcej
        </Button>
      </div>
    </div>
  )
}
