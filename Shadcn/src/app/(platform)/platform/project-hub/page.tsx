import { FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProjectHubPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Hub</h1>
        <p className="text-muted-foreground text-sm">Zarządzaj projektami i zadaniami zespołu</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <FolderKanban className="h-7 w-7 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold">Project Hub — wkrótce</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Twórz projekty, przypisuj zadania do członków zespołu, śledź postępy i zarządzaj
          obciążeniem pracą.
        </p>
        <Button className="mt-6" disabled variant="outline" size="sm">
          Dowiedz się więcej
        </Button>
      </div>
    </div>
  )
}
