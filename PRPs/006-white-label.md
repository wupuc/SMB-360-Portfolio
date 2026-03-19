# PRP-006: White-Label System

## Context
- PRP-004 (platform shell) reads `company.brand_color` and injects it as a CSS variable on the platform container.
- PRP-005 (admin settings) allows admins to update `logo_url` and `brand_color` in the `companies` table.
- Source spec: PLATFORM_PRP_1.md §11 "SHARED PLATFORM SHELL > White-label system"
- Existing: Tailwind 4 (uses CSS variables natively), shadcn/ui uses `hsl(var(--primary))` pattern.

## Goal
Implement the full white-label system: company brand color generates a complete CSS custom property set at runtime (primary, primary-hover, primary-foreground, ring, etc.), company logo shows on login page and top nav, custom email sender name flows through to all Resend emails. Result: installing the platform for a new client just requires updating `companies` row — zero code changes.

## Implementation steps

### 1. CSS variable generation from brand color
Create `src/lib/brand.ts`:
```typescript
// Takes a hex color (e.g. '#3B82F6') and generates HSL variants
// Returns CSS custom properties as object
export function generateBrandTokens(hexColor: string): Record<string, string> {
  const hsl = hexToHsl(hexColor) // convert hex → {h, s, l}
  return {
    '--brand-primary': `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    '--brand-primary-hover': `${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 8)}%`,
    '--brand-primary-foreground': hsl.l > 60 ? '0 0% 0%' : '0 0% 100%',
    '--brand-ring': `${hsl.h} ${hsl.s}% ${hsl.l}%`,
  }
}
```

### 2. Server-side brand injection
Update `src/app/(platform)/layout.tsx`:
- Fetch `company.brand_color` and `company.logo_url` from Supabase server client
- Pass brand tokens to root `<html>` via `style` attribute OR to a `<BrandProvider>` server component

Create `src/components/shared/brand-provider.tsx` (can be a simple server component):
```tsx
export function BrandProvider({ brandColor, children }: { brandColor: string; children: React.ReactNode }) {
  const tokens = generateBrandTokens(brandColor)
  return (
    <div style={tokens as React.CSSProperties} className="contents">
      {children}
    </div>
  )
}
```

### 3. Tailwind / shadcn CSS variable mapping
Update `src/app/globals.css`:
Map shadcn's `--primary` to use brand tokens:
```css
:root {
  --primary: var(--brand-primary);
  --primary-foreground: var(--brand-primary-foreground);
  --ring: var(--brand-ring);
}
```
This means all shadcn `Button variant="default"`, `Badge`, `Switch`, etc. automatically use the brand color.

### 4. Auth pages (login) — brand color + logo
Update `src/app/(auth)/layout.tsx`:
- Server component: fetch company settings (by domain match or single-company lookup)
- Inject brand color on auth layout too (so login page uses brand color)
- Show company logo in login page header: `<Image src={company.logo_url} alt={company.name} />`
- Show `company.name` as page title
- Custom login background image: if `company.login_background_url` exists, use as full-page background

### 5. Logo in top nav
Update `src/components/shared/top-nav.tsx`:
- Replace static app name with dynamic logo: `<Image src={logoUrl} />` if set; else text `company.name`
- Fallback: first letter of company name in a colored avatar

### 6. Email white-label (Resend integration)
Create `src/lib/email.ts`:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to, subject, react,
  fromName, fromAddress,
}: SendEmailOptions) {
  return resend.emails.send({
    from: `${fromName} <${fromAddress ?? process.env.RESEND_FROM_DEFAULT}>`,
    to,
    subject,
    react,
  })
}
```

All email sends in the codebase import this helper, never call Resend directly.
`fromName` and `fromAddress` are always read from `companies.email_sender_name/address`.

### 7. Email templates base
Create `src/emails/base-layout.tsx` — React Email component:
- Renders company logo at top (if `logo_url` set)
- Uses brand color as accent/button color
- Generic footer with company name
- All module-specific email templates will import and wrap with this layout

## Files to create/modify
- `Shadcn/src/lib/brand.ts` — color token generation
- `Shadcn/src/components/shared/brand-provider.tsx` — CSS var injector
- `Shadcn/src/app/globals.css` — map shadcn vars to brand vars
- `Shadcn/src/app/(platform)/layout.tsx` — wrap with BrandProvider
- `Shadcn/src/app/(auth)/layout.tsx` — inject brand on auth pages
- `Shadcn/src/components/shared/top-nav.tsx` — dynamic logo
- `Shadcn/src/lib/email.ts` — Resend wrapper
- `Shadcn/src/emails/base-layout.tsx` — email base template

## Validation
- [ ] TypeScript: no errors
- [ ] Set `brand_color` to `#E11D48` (red) in DB → all primary buttons turn red instantly on page reload
- [ ] Login page shows company logo if `logo_url` is set
- [ ] Login page falls back to company name text if no logo
- [ ] Top nav shows logo from Supabase Storage
- [ ] `sendEmail()` sends from custom `from` name set in company settings
- [ ] Mobile (375px): logo scales correctly, doesn't overflow nav
