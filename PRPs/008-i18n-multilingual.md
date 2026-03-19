# PRP-008: Internationalisation (i18n) — Polish / English

## Context
- Platform spec (§4) already has `companies.locale TEXT DEFAULT 'pl'` (pl, en, de, fr)
- Existing: Next.js 15 App Router; no i18n library installed yet
- Source requirement: user selects language in Settings → full app UI labels switch instantly, persisted per-user or per-company
- Two initial locales: Polish (`pl`) and English (`en`) — German and French as stubs for later

## Goal
Add full internationalisation to the platform so all UI labels, error messages, table headers, status names, email subject lines, and navigation items are translated. Locale can be set at two levels:
1. **Company default** — `companies.locale` (already in DB)
2. **User override** — `users.locale_override` (new column) — user's personal choice takes precedence

## Database change (migration)
Add `locale_override` to `users`:
```sql
ALTER TABLE users ADD COLUMN locale_override TEXT;
-- NULL = use company default
-- 'pl' | 'en' | 'de' | 'fr' = override
```
Migration file: `supabase/migrations/20240003000000_i18n_locale_override.sql`

## Tech approach
Use **next-intl** — the standard i18n library for Next.js App Router (server + client components, no client-only limitation, works with RSC).

```bash
npm install next-intl
```

### File structure
```
Shadcn/
├── messages/
│   ├── en.json      # English translations (default)
│   └── pl.json      # Polish translations
├── src/
│   ├── i18n/
│   │   ├── config.ts        # supported locales, default locale
│   │   ├── request.ts       # next-intl server config (reads locale from user/company)
│   │   └── navigation.ts    # typed Link, useRouter, usePathname with locale
│   └── middleware.ts        # updated to include next-intl middleware
```

### Locale resolution order
1. `users.locale_override` (if set) — personal preference
2. `companies.locale` — company default
3. `'pl'` — global fallback

The locale is resolved server-side in `src/i18n/request.ts` using the Supabase server client. No URL-based locale prefix (e.g. `/en/platform/...`) — locale is per-user from DB, not per-URL.

### Translation file structure (`messages/en.json`)
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
    "loading": "Loading...",
    "noResults": "No results found",
    "search": "Search",
    "actions": "Actions",
    "status": "Status",
    "createdAt": "Created",
    "updatedAt": "Updated"
  },
  "nav": {
    "dashboard": "Dashboard",
    "settings": "Settings",
    "requestFlow": "RequestFlow",
    "salesTrack": "SalesTrack",
    "projectHub": "ProjectHub",
    "peopleHub": "PeopleHub",
    "bookIt": "BookIt",
    "helpdesk": "Helpdesk"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "register": "Create Account",
    "forgotPassword": "Forgot Password",
    "resetPassword": "Reset Password",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password"
  },
  "status": {
    "draft": "Draft",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "in_progress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "open": "Open",
    "closed": "Closed",
    "resolved": "Resolved",
    "confirmed": "Confirmed"
  },
  "settings": {
    "company": "Company",
    "users": "Users",
    "departments": "Departments & Teams",
    "modules": "Modules",
    "currencies": "Currencies",
    "language": "Language",
    "timezone": "Timezone",
    "companyName": "Company Name",
    "brandColor": "Brand Color",
    "emailSender": "Email Sender",
    "saveChanges": "Save Changes"
  },
  "requestFlow": {
    "newRequest": "New Request",
    "myRequests": "My Requests",
    "approvalsInbox": "Approvals Inbox",
    "teamCalendar": "Team Calendar",
    "reports": "Reports",
    "businessTrip": "Business Trip",
    "vacation": "Vacation",
    "homeOffice": "Home Office",
    "equipment": "Equipment Request",
    "overtime": "Overtime",
    "leaveBalance": "Leave Balance"
  },
  "salesTrack": {
    "clients": "Clients",
    "opportunities": "Opportunities",
    "interactions": "Interactions",
    "campaigns": "Campaigns",
    "forecast": "Forecast",
    "pipeline": "Pipeline"
  },
  "projectHub": {
    "myTasks": "My Tasks",
    "projects": "Projects",
    "teamWorkload": "Team Workload",
    "gantt": "Gantt Chart",
    "sprints": "Sprints",
    "milestones": "Milestones"
  },
  "peopleHub": {
    "employees": "Employees",
    "recruitment": "Recruitment",
    "training": "Training",
    "performance": "Performance",
    "onboarding": "Onboarding"
  },
  "bookIt": {
    "bookResource": "Book a Resource",
    "myBookings": "My Bookings",
    "floorMap": "Floor Map",
    "resources": "Resources"
  },
  "helpdesk": {
    "tickets": "Tickets",
    "knowledgeBase": "Knowledge Base",
    "newTicket": "New Ticket",
    "queue": "Queue"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "unauthorized": "You don't have permission to do this.",
    "notFound": "The requested item was not found.",
    "validation": "Please check the form for errors."
  }
}
```

`messages/pl.json` is the full Polish translation of all the same keys.

### Usage in components
Server components:
```tsx
import { getTranslations } from 'next-intl/server'
export default async function Page() {
  const t = await getTranslations('nav')
  return <h1>{t('dashboard')}</h1>
}
```

Client components:
```tsx
"use client"
import { useTranslations } from 'next-intl'
export function MyComponent() {
  const t = useTranslations('common')
  return <button>{t('save')}</button>
}
```

### Language switcher in Settings
In `/settings/company` page (or a new `/settings/language` section):
- Dropdown to select language for the current user (`users.locale_override`)
- Company-level default (changes `companies.locale`) — admin only
- Change takes effect on next page load (server re-fetches locale)

Server action: `setUserLocale(locale: string)` in `src/app/actions/users.ts`

## Files to create/modify
- `supabase/migrations/20240003000000_i18n_locale_override.sql` — add column
- `messages/en.json` — English translations
- `messages/pl.json` — Polish translations
- `Shadcn/src/i18n/config.ts` — locales config
- `Shadcn/src/i18n/request.ts` — next-intl server config
- `Shadcn/src/middleware.ts` — add next-intl middleware
- `Shadcn/src/app/(platform)/settings/language/page.tsx` — language picker
- `Shadcn/src/app/actions/users.ts` — add setUserLocale action
- Update existing shared components to use `t()` instead of hardcoded strings
- Update `PRPs/000-master.md` — add PRP-008 to index

## Validation
- [ ] TypeScript: `pnpm tsc --noEmit` — no errors
- [ ] Switching to PL in settings → all nav labels, button text, table headers switch to Polish on next page load
- [ ] Switching to EN → everything switches to English
- [ ] Server components use `getTranslations` (no hydration mismatch)
- [ ] Client components use `useTranslations`
- [ ] Missing translation key shows key name as fallback (not crash)
- [ ] Email subjects use correct locale based on recipient's locale

## Notes on DB design
- `companies.locale` is the company-wide default — affects all users who haven't set a personal override
- `users.locale_override` = NULL means "use company default"
- Future: `de` and `fr` translation files can be added without code changes (just messages JSON)
- The email system (`src/lib/email.ts`) should accept a `locale` param and load translations for email templates
