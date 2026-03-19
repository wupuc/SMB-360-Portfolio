import { BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SalesTrackPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales Track</h1>
        <p className="text-muted-foreground text-sm">Zarządzaj sprzedażą i relacjami z klientami</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <BarChart2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">Sales Track — wkrótce</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Zarządzaj lejkiem sprzedaży, śledź okazje biznesowe, kampanie i interakcje z klientami
          w jednym miejscu.
        </p>
        <Button className="mt-6" disabled variant="outline" size="sm">
          Dowiedz się więcej
        </Button>
      </div>
    </div>
  )
}
