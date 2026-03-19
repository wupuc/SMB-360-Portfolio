# PRP-004: Platform Shell

## Context
- Existing: `Shadcn/src/app/(dashboard)/layout.tsx` — has a sidebar + header layout from the shadcnblocks template. This becomes the base for the platform shell.
- PRP-002 established `src/app/(platform)/layout.tsx` as a stub.
- PRP-003 gave us auth middleware and user session.
- Source spec: PLATFORM_PRP_1.md §11 "SHARED PLATFORM SHELL"

## Goal
Build the authenticated platform shell: top navigation bar with module switcher popup (bottom-left), notification bell (top-right with badge), user avatar menu, and the responsive sidebar layout. Every module app renders inside this shell.

## Implementation steps

### 1. Platform layout (`src/app/(platform)/layout.tsx`)
Server component that:
- Fetches current user from Supabase server client
- Fetches `module_config` to know which apps are enabled
- Renders: `<PlatformShell user={user} enabledModules={modules}>{children}</PlatformShell>`

### 2. Top navigation bar (`src/components/shared/top-nav.tsx`)
Client component. Contains:
- Left: App logo (from company settings `logo_url`; fallback to `NEXT_PUBLIC_APP_NAME`)
- Center (or left after logo): current module name / breadcrumb
- Right: `<NotificationBell />`, user avatar dropdown

User avatar dropdown (shadcn `DropdownMenu`):
- Profile settings link
- My account link
- Separator
- Sign out (calls `supabase.auth.signOut()` + redirects to `/login`)

### 3. Module switcher (`src/components/shared/module-switcher.tsx`)
Client component. Spec (PLATFORM_PRP_1.md §11):
- Bottom-left floating panel (not a modal)
- Triggered by clicking the grid icon in the sidebar footer
- Shows all 6 apps in a 2×3 or 3×2 grid
- Active module highlighted (border + bg)
- Disabled modules greyed out (`opacity-50 cursor-not-allowed pointer-events-none`)
- Each card links to that app's dashboard route

Module definitions:
```typescript
const MODULES = [
  { key: 'request_flow', label: 'RequestFlow', icon: ClipboardList, href: '/platform/request-flow' },
  { key: 'sales_track', label: 'SalesTrack', icon: TrendingUp, href: '/platform/sales-track' },
  { key: 'project_hub', label: 'ProjectHub', icon: Kanban, href: '/platform/project-hub' },
  { key: 'people_hub', label: 'PeopleHub', icon: Users, href: '/platform/people-hub' },
  { key: 'book_it', label: 'BookIt', icon: Calendar, href: '/platform/book-it' },
  { key: 'helpdesk', label: 'Helpdesk', icon: Headphones, href: '/platform/helpdesk' },
]
```

### 4. Notification bell (`src/components/shared/notification-bell.tsx`)
Client component:
- Bell icon (Lucide `Bell`)
- Red badge with unread count (hidden at 0)
- On click: opens `Popover` with notification list
- List items: app icon, title, body (truncated), time (relative, date-fns `formatDistanceToNow`)
- "Mark all as read" button → server action → `UPDATE notifications SET is_read=true WHERE user_id=auth.uid()`
- Click notification → navigate to `source_url` + mark as read
- Supabase Realtime subscription: `channel('notifications').on('postgres_changes', { table: 'notifications', filter: 'user_id=eq.{userId}' })` → update badge count

### 5. Sidebar per module
Each module has its own sidebar navigation (rendered within the platform shell, driven by current route):
- `src/components/shared/module-sidebar.tsx` — renders module-specific nav links based on current path segment
- Uses `usePathname()` to determine active module
- Each module exports its nav config: `src/components/request-flow/nav.ts`, etc.

### 6. Sidebar layout
- Collapsible sidebar (desktop: icon + label; mobile: sheet/drawer)
- Settings gear icon at bottom → `/platform/settings`
- Module switcher icon at bottom-left → opens `<ModuleSwitcher />`
- Responsive: sidebar collapses to icons on < 1024px; hidden + hamburger on mobile

### 7. Brand color injection
In platform layout, read `company.brand_color` from DB and inject as CSS custom property:
```tsx
<div style={{ '--brand': company.brand_color } as React.CSSProperties}>
  {children}
</div>
```
(Full white-label implementation is PRP-006; this PRP just reads the value.)

## Files to create/modify
- `Shadcn/src/app/(platform)/layout.tsx` — full platform shell
- `Shadcn/src/components/shared/top-nav.tsx` — top navigation bar
- `Shadcn/src/components/shared/module-switcher.tsx` — module grid popup
- `Shadcn/src/components/shared/notification-bell.tsx` — bell + realtime
- `Shadcn/src/components/shared/module-sidebar.tsx` — per-module nav
- `Shadcn/src/components/shared/platform-shell.tsx` — main layout wrapper
- `Shadcn/src/components/request-flow/nav.ts` — nav config (stub for now)
- (similar nav.ts stubs for other 5 modules)

## Validation
- [ ] `pnpm tsc --noEmit` — no TypeScript errors
- [ ] `pnpm lint` passes
- [ ] Desktop (1280px): sidebar shows icon + label; module switcher opens on click
- [ ] Mobile (375px): sidebar hidden; hamburger opens sheet drawer
- [ ] Notification bell shows badge count matching unread notifications in DB
- [ ] Realtime: insert a notification in Supabase dashboard → badge increments instantly
- [ ] Module switcher: disabled modules are greyed and not clickable
- [ ] User dropdown: sign out clears session and redirects to /login
