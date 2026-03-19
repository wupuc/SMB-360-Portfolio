"use client"

import { useState } from "react"
import { isDemoMode, demoCompany } from "@/lib/demo/data"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CompanyFormState {
  name: string
  email_sender_name: string
  email_sender_address: string
  timezone: string
  locale: string
  brand_color: string
}

export default function CompanySettingsPage() {
  const { toast } = useToast()

  const [form, setForm] = useState<CompanyFormState>({
    name: demoCompany.name,
    email_sender_name: demoCompany.email_sender_name,
    email_sender_address: demoCompany.email_sender_address,
    timezone: demoCompany.timezone,
    locale: demoCompany.locale,
    brand_color: demoCompany.brand_color,
  })

  if (!isDemoMode) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Ładowanie...
      </div>
    )
  }

  function handleChange(field: keyof CompanyFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    toast({ title: "Ustawienia firmy zapisane" })
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold">Firma</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Konfiguracja tożsamości firmy, brandingu i preferencji regionalnych.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dane podstawowe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nazwa firmy</Label>
            <Input
              id="company-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nazwa firmy"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ustawienia e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-sender-name">Nazwa nadawcy</Label>
            <Input
              id="email-sender-name"
              value={form.email_sender_name}
              onChange={(e) => handleChange("email_sender_name", e.target.value)}
              placeholder="Nazwa wyświetlana w e-mailach"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-sender-address">Adres nadawcy</Label>
            <Input
              id="email-sender-address"
              type="email"
              value={form.email_sender_address}
              onChange={(e) => handleChange("email_sender_address", e.target.value)}
              placeholder="noreply@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencje regionalne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Strefa czasowa</Label>
            <Select
              value={form.timezone}
              onValueChange={(val) => handleChange("timezone", val)}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Wybierz strefę czasową" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Warsaw">Europe/Warsaw</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Język</Label>
            <Select
              value={form.locale}
              onValueChange={(val) => handleChange("locale", val)}
            >
              <SelectTrigger id="locale">
                <SelectValue placeholder="Wybierz język" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-color">Kolor marki</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-md border shadow-sm overflow-hidden flex-shrink-0"
                style={{ backgroundColor: form.brand_color }}
              >
                <input
                  id="brand-color"
                  type="color"
                  value={form.brand_color}
                  onChange={(e) => handleChange("brand_color", e.target.value)}
                  className="w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={form.brand_color}
                onChange={(e) => handleChange("brand_color", e.target.value)}
                placeholder="#000000"
                className="font-mono uppercase"
                maxLength={7}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Zapisz zmiany</Button>
      </div>
    </div>
  )
}
