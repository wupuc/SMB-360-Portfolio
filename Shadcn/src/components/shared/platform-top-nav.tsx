"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/shared/notification-bell"
import { ThemeSwitch } from "@/components/theme-switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PlatformTopNavProps {
  userId: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
  companyName: string
  companyLogoUrl: string | null
}

export function PlatformTopNav({
  userId,
  userDisplayName,
  userEmail,
  userAvatarUrl,
  companyName,
  companyLogoUrl,
}: PlatformTopNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = userDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 backdrop-blur md:px-6">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1" />

      {/* Company logo / name */}
      <div className="flex flex-1 items-center gap-2">
        {companyLogoUrl ? (
          <Image
            src={companyLogoUrl}
            alt={companyName}
            width={100}
            height={28}
            className="h-7 w-auto object-contain"
          />
        ) : (
          <span className="text-sm font-semibold">{companyName}</span>
        )}
      </div>

      {/* Right side: notifications + settings + user menu */}
      <div className="flex items-center gap-2">
        <NotificationBell userId={userId} />
        <ThemeSwitch />

        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/platform/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatarUrl ?? undefined} alt={userDisplayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                <p className="text-muted-foreground text-xs leading-none">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/platform/settings/profile">
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
