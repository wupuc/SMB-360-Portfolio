# PRP-000: Master — SMB 360 Platform

## Overview
This is the master index for all PRPs in the SMB 360 platform. Every sub-feature has its own PRP file derived from `PLATFORM_PRP_1.md` (the full product spec at the repo root).

## Source document
`../PLATFORM_PRP_1.md` — Full platform spec (18 sections, 6 apps, complete DB schema, build order)

## Build phases

### Phase 1 — Foundation (all other phases depend on this)
| PRP | Feature | Status |
|-----|---------|--------|
| [001](./001-supabase-shared-schema.md) | Supabase shared schema migrations | pending |
| [002](./002-nextjs-platform-scaffold.md) | Next.js platform scaffold + TypeScript setup | pending |
| [003](./003-auth-flow.md) | Authentication flow (login, register, password reset, middleware) | pending |
| [004](./004-platform-shell.md) | Platform shell (layout, top nav, module switcher, notification bell) | pending |
| [005](./005-admin-settings.md) | Admin settings (company branding, user management, module toggle) | pending |
| [006](./006-white-label.md) | White-label system (CSS custom properties from company settings) | pending |
| [007](./007-shared-components.md) | Shared components library (DataTable, FileUpload, RichTextEditor, etc.) | pending |
| [008](./008-i18n-multilingual.md) | Internationalisation (Polish / English toggle per user and company) | pending |

### Phase 2 — RequestFlow
| PRP | Feature | Status |
|-----|---------|--------|
| 010 | RequestFlow: database schema migration | pending |
| 011 | RequestFlow: approval engine (flow builder, steps, conditions) | pending |
| 012 | RequestFlow: employee dashboard + new request flow | pending |
| 013 | RequestFlow: approvals inbox (manager view) | pending |
| 014 | RequestFlow: team calendar | pending |
| 015 | RequestFlow: reports | pending |
| 016 | RequestFlow: admin settings (module config, leave entitlements, bank holidays, delegation) | pending |

### Phase 3 — SalesTrack
| PRP | Feature | Status |
|-----|---------|--------|
| 020 | SalesTrack: database schema migration | pending |
| 021 | SalesTrack: clients list + client profile | pending |
| 022 | SalesTrack: opportunities (table + Kanban) | pending |
| 023 | SalesTrack: interactions log | pending |
| 024 | SalesTrack: campaigns + segments | pending |
| 025 | SalesTrack: forecast + reports | pending |
| 026 | SalesTrack: admin settings (pipeline stages, close reasons) | pending |

### Phase 4 — ProjectHub
| PRP | Feature | Status |
|-----|---------|--------|
| 030 | ProjectHub: database schema migration | pending |
| 031 | ProjectHub: my tasks + project list | pending |
| 032 | ProjectHub: project detail (task list, Kanban, Gantt) | pending |
| 033 | ProjectHub: sprints + milestones | pending |
| 034 | ProjectHub: team workload view | pending |
| 035 | ProjectHub: project templates (built-in + custom) | pending |

### Phase 5 — PeopleHub
| PRP | Feature | Status |
|-----|---------|--------|
| 040 | PeopleHub: database schema migration | pending |
| 041 | PeopleHub: employee directory + profiles | pending |
| 042 | PeopleHub: recruitment ATS (positions, candidates) | pending |
| 043 | PeopleHub: training management | pending |
| 044 | PeopleHub: onboarding/offboarding checklists | pending |
| 045 | PeopleHub: performance reviews + goals | pending |
| 046 | PeopleHub: HR requests + self-service portal | pending |

### Phase 6 — BookIt
| PRP | Feature | Status |
|-----|---------|--------|
| 050 | BookIt: database schema migration | pending |
| 051 | BookIt: resource browser + booking flow | pending |
| 052 | BookIt: floor map view + editor | pending |
| 053 | BookIt: admin resource management | pending |

### Phase 7 — Helpdesk
| PRP | Feature | Status |
|-----|---------|--------|
| 060 | Helpdesk: database schema migration | pending |
| 061 | Helpdesk: ticket queue view + ticket detail | pending |
| 062 | Helpdesk: knowledge base (articles + editor) | pending |
| 063 | Helpdesk: SLA tracking + reports | pending |

## PRP discipline rules
1. One PRP per feature — never bundle multiple features
2. Read existing code before writing new code
3. Validation loop after every PRP: TypeScript check → lint → unit tests → smoke test
4. One git commit per completed PRP (include PRP ID in message)
5. No orphaned code — every new file must be used somewhere
6. Every new DB table must have a migration file
