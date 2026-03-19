import { Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HelpdeskPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Helpdesk</h1>
        <p className="text-muted-foreground text-sm">Wsparcie techniczne i zgłoszenia serwisowe</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <Headphones className="h-7 w-7 text-rose-600" />
        </div>
        <h2 className="text-lg font-semibold">Helpdesk — wkrótce</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Zgłaszaj problemy techniczne, śledź statusy ticketów i korzystaj z bazy wiedzy
          firmy.
        </p>
        <Button className="mt-6" disabled variant="outline" size="sm">
          Dowiedz się więcej
        </Button>
      </div>
    </div>
  )
}
