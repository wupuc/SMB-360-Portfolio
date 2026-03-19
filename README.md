# SMB 360 Platform

A modular SaaS platform for SMB and mid-market companies (5–200 employees). Six standalone but interconnected web applications, sold individually or as a bundle.

## Applications
1. **RequestFlow** — Employee request & approval platform
2. **SalesTrack** — CRM with pipeline management
3. **ProjectHub** — Task and project management with Gantt
4. **PeopleHub** — HR, recruitment, training, performance
5. **BookIt** — Resource booking (desks, rooms, cars)
6. **Helpdesk** — Internal support ticket system

## Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript strict, shadcn/ui, Tailwind CSS
- **State:** Zustand (global), TanStack Query (server state)
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Email:** Resend
- **Hosting:** Vercel

## Repository Structure
```
/
├── PRPs/               # Product Requirement Prompts (one per feature)
│   ├── 000-master.md   # Master index and build phases
│   └── 001-007-*.md    # Phase 1 PRPs
├── Shadcn/             # Next.js web application (apps/web)
│   └── src/
│       ├── app/
│       │   ├── (auth)/     # Login, register, password reset
│       │   └── (platform)/ # All authenticated module routes
│       ├── components/
│       │   ├── ui/         # shadcn/ui components
│       │   └── shared/     # Platform-wide shared components
│       └── lib/
│           └── supabase/   # Supabase client/server/middleware
├── supabase/
│   ├── migrations/     # Numbered SQL migration files
│   ├── seed.sql        # Development seed data
│   └── functions/      # Supabase Edge Functions
├── docs/               # Architecture and API documentation
└── PLATFORM_PRP_1.md   # Master product spec (full platform brief)
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Supabase CLI
- A Supabase project (one per client)

### Development Setup
```bash
# Install dependencies
cd Shadcn
pnpm install

# Copy env vars
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# Apply database migrations
supabase db reset

# Start dev server
pnpm dev
```

## PRP Discipline
Every feature has its own PRP in `/PRPs`. See `PRPs/000-master.md` for the full build plan and phase breakdown.
