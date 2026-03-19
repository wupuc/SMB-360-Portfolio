import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BookItPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Book It</h1>
        <p className="text-muted-foreground text-sm">Rezerwacje sal i zasobów biurowych</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
          <BookOpen className="h-7 w-7 text-teal-600" />
        </div>
        <h2 className="text-lg font-semibold">Book It — wkrótce</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Rezerwuj sale konferencyjne, biurka, samochody służbowe i inne zasoby biurowe
          szybko i bez konfliktów.
        </p>
        <Button className="mt-6" disabled variant="outline" size="sm">
          Dowiedz się więcej
        </Button>
      </div>
    </div>
  )
}
