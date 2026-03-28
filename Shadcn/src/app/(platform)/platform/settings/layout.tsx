import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { isDemoMode } from '@/lib/demo/data'

const navItems = [
  { title: 'Profil',       href: '/platform/settings/profile' },
  { title: 'Firma',        href: '/platform/settings/company' },
  { title: 'Użytkownicy', href: '/platform/settings/users' },
  { title: 'Działy',      href: '/platform/settings/departments' },
  { title: 'Moduły',      href: '/platform/settings/modules' },
  { title: 'Waluty',      href: '/platform/settings/currencies' },
  { title: 'Język',       href: '/platform/settings/language' },
  { title: 'Request Flow',href: '/platform/settings/request-flow' },
  { title: 'Sales Track', href: '/platform/settings/sales-track' },
  { title: 'Project Hub', href: '/platform/settings/project-hub' },
]

interface Props {
  children: React.ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  if (!isDemoMode) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) redirect('/login')

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      redirect('/platform/dashboard')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zarządzaj konfiguracją firmy, użytkownikami i ustawieniami platformy.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="lg:w-48 shrink-0">
          <ScrollArea orientation="horizontal" className="w-full">
            <nav className="flex gap-1 lg:flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-muted hover:text-foreground',
                    'text-muted-foreground whitespace-nowrap'
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
