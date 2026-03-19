"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setUserLocale } from "@/app/actions/users"
import { localeLabels, type Locale, locales } from "@/i18n/config"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LanguageFormProps {
  currentLocale: string
  companyLocale: string
}

export function LanguageForm({ currentLocale, companyLocale }: LanguageFormProps) {
  const [selectedLocale, setSelectedLocale] = useState<string>(currentLocale)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  async function handleSave() {
    setIsLoading(true)
    setMessage(null)
    const result = await setUserLocale(selectedLocale)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Language updated. Refreshing..." })
      setTimeout(() => {
        router.refresh()
      }, 800)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-4 max-w-sm">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="locale">Your language</Label>
        <Select value={selectedLocale} onValueChange={setSelectedLocale}>
          <SelectTrigger id="locale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locales.map((locale) => (
              <SelectItem key={locale} value={locale}>
                {localeLabels[locale as Locale]}
                {locale === companyLocale && " (company default)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Company default: {localeLabels[companyLocale as Locale] ?? companyLocale}
        </p>
      </div>

      <Button onClick={handleSave} disabled={isLoading || selectedLocale === currentLocale}>
        {isLoading ? "Saving..." : "Save Language"}
      </Button>
    </div>
  )
}
