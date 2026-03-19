"use client"

import React, { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { demoUser, demoTeam } from "@/lib/demo/data"

export default function ProfileSettingsPage() {
  const { toast } = useToast()
  const me = demoTeam.find(m => m.id === demoUser.id) ?? demoTeam[0]
  const initials = `${demoUser.first_name[0]}${demoUser.last_name[0]}`

  const [firstName, setFirstName] = useState(demoUser.first_name)
  const [lastName, setLastName]   = useState(demoUser.last_name)
  const [email]                   = useState(demoUser.email)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
    toast({ title: "Zdjęcie profilowe zaktualizowane" })
  }

  function handleSave() {
    toast({ title: "Profil zapisany" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Mój profil</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Zarządzaj swoimi danymi osobowymi i preferencjami.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl
            ? <img src={avatarUrl} alt={firstName} className="h-full w-full object-cover rounded-full" />
            : <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          }
        </Avatar>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Zmień zdjęcie
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, max. 2 MB</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">Imię</Label>
            <Input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Nazwisko</Label>
            <Input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Adres e-mail nie może być zmieniony w trybie demo.</p>
        </div>

        <div className="space-y-2">
          <Label>Dział</Label>
          <Input value={me.department} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Rola</Label>
          <Input value={me.role} disabled className="bg-muted" />
        </div>

        <Button onClick={handleSave}>Zapisz zmiany</Button>
      </div>
    </div>
  )
}
