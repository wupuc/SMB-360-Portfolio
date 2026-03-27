import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/ui/sidebar'
import { PlatformSidebar } from '@/components/shared/platform-sidebar'
import { PlatformTopNav } from '@/components/shared/platform-top-nav'
import type { ModuleKey } from '@/types/database.types'
import { isDemoMode, demoUser, demoCompany, demoEnabledModules } from '@/lib/demo/data'

interface Props {
  children: React.ReactNode
}

export default async function PlatformLayout({ children }: Props) {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar:state')?.value !== 'false'

  // ─── Demo Mode ───────────────────────────────────────────────────────────────
  if (isDemoMode) {
    const userDisplayName = `${demoUser.first_name} ${demoUser.last_name}`

    return (
      <SidebarProvider defaultOpen={sidebarOpen}>
        <div className="flex h-svh w-full overflow-hidden">
          <PlatformSidebar
            enabledModules={demoEnabledModules}
            userDisplayName={userDisplayName}
            userEmail={demoUser.email}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <PlatformTopNav
              userId={demoUser.id}
              userDisplayName={userDisplayName}
              userEmail={demoUser.email}
              userAvatarUrl={null}
              companyName={demoCompany.name}
              companyLogoUrl={null}
            />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // ─── Production Mode ──────────────────────────────────────────────────────────
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile first (need company_id)
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch company + modules in parallel
  const companyId = profile?.company_id
  const [{ data: company }, { data: moduleConfigs }] = await Promise.all([
    companyId
      ? supabase.from('companies').select('*').eq('id', companyId).single()
      : Promise.resolve({ data: null }),
    companyId
      ? supabase.from('module_config').select('module, is_enabled').eq('company_id', companyId)
      : Promise.resolve({ data: [] }),
  ])

  const enabledModules = (moduleConfigs ?? [])
    .filter((m) => m.is_enabled)
    .map((m) => m.module as ModuleKey)

  const userDisplayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user.email ?? 'User'

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex h-svh w-full overflow-hidden">
        <PlatformSidebar
          enabledModules={enabledModules}
          userDisplayName={userDisplayName}
          userEmail={user.email ?? ''}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PlatformTopNav
            userId={user.id}
            userDisplayName={userDisplayName}
            userEmail={user.email ?? ''}
            userAvatarUrl={profile?.avatar_url ?? null}
            companyName={company?.name ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'SMB360'}
            companyLogoUrl={company?.logo_url ?? null}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
