"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  ClipboardList,
  TrendingUp,
  Kanban,
  Users,
  CalendarDays,
  Headphones,
  LayoutDashboard,
  Settings,
  FileText,
  CheckSquare,
  Calendar,
  BarChart2,
  UserPlus,
  Building2,
  BookOpen,
  AlertCircle,
  Clock,
  Target,
  Book,
  MapPin,
  ListChecks,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModuleSwitcher } from "@/components/shared/module-switcher"
import type { ModuleKey } from "@/types/database.types"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const MODULE_NAV: Record<ModuleKey | "platform", NavItem[]> = {
  platform: [
    { title: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  ],
  request_flow: [
    { title: "Dashboard", href: "/platform/request-flow", icon: LayoutDashboard },
    { title: "New Request", href: "/platform/request-flow/new", icon: FileText },
    { title: "My Requests", href: "/platform/request-flow/my-requests", icon: ListChecks },
    { title: "Approvals Inbox", href: "/platform/request-flow/approvals", icon: CheckSquare },
    { title: "Team Calendar", href: "/platform/request-flow/calendar", icon: Calendar },
    { title: "Reports", href: "/platform/request-flow/reports", icon: BarChart2 },
  ],
  sales_track: [
    { title: "Dashboard", href: "/platform/sales-track", icon: LayoutDashboard },
    { title: "Clients", href: "/platform/sales-track/clients", icon: Building2 },
    { title: "Opportunities", href: "/platform/sales-track/opportunities", icon: Target },
    { title: "Interactions", href: "/platform/sales-track/interactions", icon: Clock },
    { title: "Campaigns", href: "/platform/sales-track/campaigns", icon: BarChart2 },
    { title: "Forecast", href: "/platform/sales-track/forecast", icon: TrendingUp },
  ],
  project_hub: [
    { title: "Dashboard", href: "/platform/project-hub", icon: LayoutDashboard },
    { title: "My Tasks", href: "/platform/project-hub/my-tasks", icon: CheckSquare },
    { title: "Projects", href: "/platform/project-hub/projects", icon: Kanban },
    { title: "Team Workload", href: "/platform/project-hub/workload", icon: Users },
  ],
  people_hub: [
    { title: "Dashboard", href: "/platform/people-hub", icon: LayoutDashboard },
    { title: "Employees", href: "/platform/people-hub/employees", icon: Users },
    { title: "Recruitment", href: "/platform/people-hub/recruitment", icon: UserPlus },
    { title: "Training", href: "/platform/people-hub/training", icon: BookOpen },
    { title: "Performance", href: "/platform/people-hub/performance", icon: Target },
  ],
  book_it: [
    { title: "Dashboard", href: "/platform/book-it", icon: LayoutDashboard },
    { title: "Book a Resource", href: "/platform/book-it/book", icon: MapPin },
    { title: "My Bookings", href: "/platform/book-it/my-bookings", icon: Calendar },
  ],
  helpdesk: [
    { title: "Dashboard", href: "/platform/helpdesk", icon: LayoutDashboard },
    { title: "Tickets", href: "/platform/helpdesk/tickets", icon: AlertCircle },
    { title: "Knowledge Base", href: "/platform/helpdesk/kb", icon: Book },
  ],
}

function getActiveModule(pathname: string): ModuleKey | "platform" {
  if (pathname.startsWith("/platform/request-flow")) return "request_flow"
  if (pathname.startsWith("/platform/sales-track")) return "sales_track"
  if (pathname.startsWith("/platform/project-hub")) return "project_hub"
  if (pathname.startsWith("/platform/people-hub")) return "people_hub"
  if (pathname.startsWith("/platform/book-it")) return "book_it"
  if (pathname.startsWith("/platform/helpdesk")) return "helpdesk"
  return "platform"
}

const MODULE_LABELS: Record<ModuleKey | "platform", string> = {
  platform: "SMB360",
  request_flow: "RequestFlow",
  sales_track: "SalesTrack",
  project_hub: "ProjectHub",
  people_hub: "PeopleHub",
  book_it: "BookIt",
  helpdesk: "Helpdesk",
}

const MODULE_ICONS: Record<ModuleKey | "platform", React.ElementType> = {
  platform: LayoutDashboard,
  request_flow: ClipboardList,
  sales_track: TrendingUp,
  project_hub: Kanban,
  people_hub: Users,
  book_it: CalendarDays,
  helpdesk: Headphones,
}

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  enabledModules?: ModuleKey[]
  userDisplayName?: string
  userEmail?: string
  userAvatarUrl?: string
}

export function PlatformSidebar({
  enabledModules,
  userDisplayName,
  userEmail,
  ...props
}: PlatformSidebarProps) {
  const pathname = usePathname()
  const activeModule = getActiveModule(pathname)
  const navItems = MODULE_NAV[activeModule]
  const ActiveIcon = MODULE_ICONS[activeModule]
  const moduleLabel = MODULE_LABELS[activeModule]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <ActiveIcon className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold">{moduleLabel}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="gap-0.5 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <div className="flex items-center gap-2">
          <ModuleSwitcher enabledModules={enabledModules} />
          <SidebarMenuButton asChild>
            <Link href="/platform/settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
