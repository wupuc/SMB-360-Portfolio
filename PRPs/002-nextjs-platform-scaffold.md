# PRP-002: Next.js Platform Scaffold

## Context
- Existing: `Shadcn/` — Next.js 15.1.7, React 19, TypeScript, shadcn/ui, Tailwind 4, TanStack Table, Recharts, zod, react-hook-form, date-fns. This is the shadcnblocks-admin starter template.
- Current structure uses `src/app/(auth)/` and `src/app/(dashboard)/` route groups.
- Target structure (from PLATFORM_PRP_1.md §3): `src/app/(auth)/` and `src/app/(platform)/` with sub-routes for each of the 6 modules.
- Supabase client/server packages not yet installed.

## Goal
Adapt the existing Shadcn scaffold to the platform's target folder structure, install Supabase packages, configure TypeScript strict mode, and establish the routing skeleton for all 6 module apps. Result: a running Next.js app with empty placeholder pages for every module route.

## Implementation steps

### 1. Install Supabase packages
```bash
cd Shadcn
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2. Install additional required packages
```bash
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools
pnpm add resend react-email @react-email/components
pnpm add tiptap @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add react-dropzone
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3. Configure TypeScript strict mode
`Shadcn/tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 4. Environment variables
Create `Shadcn/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_DEFAULT=noreply@smb360.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SMB360
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false
NEXT_PUBLIC_ENABLE_MICROSOFT_AUTH=false
```

### 5. Supabase client setup
Create `Shadcn/src/lib/supabase/client.ts` — browser client (singleton)
Create `Shadcn/src/lib/supabase/server.ts` — server-side client (cookies)
Create `Shadcn/src/lib/supabase/middleware.ts` — session refresh helper

### 6. Route structure refactor
Rename `src/app/(dashboard)/` → `src/app/(platform)/`
Create module sub-routes (all with placeholder `page.tsx`):
```
src/app/(platform)/
├── layout.tsx              # Platform shell (PRP-004)
├── dashboard/page.tsx      # Cross-app home dashboard
├── request-flow/
│   ├── page.tsx           # RequestFlow dashboard
│   ├── new/page.tsx
│   ├── my-requests/page.tsx
│   ├── approvals/page.tsx
│   ├── calendar/page.tsx
│   └── reports/page.tsx
├── sales-track/
│   ├── page.tsx
│   ├── clients/page.tsx
│   ├── opportunities/page.tsx
│   ├── interactions/page.tsx
│   ├── campaigns/page.tsx
│   └── forecast/page.tsx
├── project-hub/
│   ├── page.tsx
│   ├── my-tasks/page.tsx
│   ├── projects/page.tsx
│   └── workload/page.tsx
├── people-hub/
│   ├── page.tsx
│   ├── employees/page.tsx
│   ├── recruitment/page.tsx
│   ├── training/page.tsx
│   └── performance/page.tsx
├── book-it/
│   ├── page.tsx
│   ├── book/page.tsx
│   └── my-bookings/page.tsx
├── helpdesk/
│   ├── page.tsx
│   ├── tickets/page.tsx
│   └── kb/page.tsx
└── settings/
    ├── page.tsx
    ├── company/page.tsx
    ├── users/page.tsx
    ├── modules/page.tsx
    └── currencies/page.tsx
```

### 7. TypeScript database types
Create `Shadcn/src/types/database.types.ts` — placeholder until Supabase CLI generates from schema.
Create `Shadcn/src/types/index.ts` — re-exports + shared platform types (UserRole, ModuleKey, etc.)

### 8. TanStack Query setup
Create `Shadcn/src/lib/query-client.ts`
Wrap root layout in `QueryClientProvider`

### 9. Middleware
Create/update `Shadcn/src/middleware.ts` — protect all `/platform/*` routes via Supabase session check.

## Files to create/modify
- `Shadcn/src/lib/supabase/client.ts`
- `Shadcn/src/lib/supabase/server.ts`
- `Shadcn/src/lib/supabase/middleware.ts`
- `Shadcn/src/middleware.ts` — route protection
- `Shadcn/src/lib/query-client.ts`
- `Shadcn/src/types/database.types.ts`
- `Shadcn/src/types/index.ts`
- `Shadcn/src/app/(platform)/layout.tsx` — platform shell wrapper
- All module placeholder `page.tsx` files (18 files)
- `Shadcn/.env.local` — env vars template
- `Shadcn/tsconfig.json` — strict mode

## Validation
- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `pnpm lint` passes
- [ ] `pnpm dev` — app starts on localhost:3000
- [ ] Navigating to `/platform/dashboard` works (shows placeholder)
- [ ] All 6 module routes return 200 (not 404)
- [ ] Unauthenticated visit to `/platform/*` redirects to `/login`
