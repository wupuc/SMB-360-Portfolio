# PRP-003: Authentication Flow

## Context
- Existing: `Shadcn/src/app/(auth)/` has login, register, forgot-password pages with UI forms (no actual auth logic — just UI shell from the shadcnblocks-admin template).
- Files exist: `user-auth-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx` — all have placeholder/mock logic.
- Supabase packages installed in PRP-002. `lib/supabase/client.ts` and `lib/supabase/server.ts` created.
- Source spec: PLATFORM_PRP_1.md §12 "SECURITY & RLS" + §3 structure

## Goal
Wire up real Supabase authentication to the existing auth UI. Implement login, register, password reset, and session middleware. Result: users can sign up, log in with email+password, reset their password, and are redirected appropriately on auth state changes.

## Implementation steps

### 1. Login page (`/login`)
Update `user-auth-form.tsx`:
- Import Supabase browser client
- `signInWithPassword({ email, password })`
- On success: redirect to `/platform/dashboard`
- On error: show inline error message using shadcn `Alert`
- Loading state on submit button
- "Forgot password?" link to `/forgot-password`

### 2. Register page (`/register`)
Update `register-form.tsx`:
- `signUp({ email, password, options: { data: { first_name, last_name } } })`
- On success: show "Check your email" confirmation (email verification)
- Zod schema for validation: email, password (min 8), first_name, last_name required

### 3. Forgot password page (`/forgot-password`)
Update `forgot-password-form.tsx`:
- `resetPasswordForEmail(email, { redirectTo: '/auth/callback?next=/reset-password' })`
- On success: show confirmation message

### 4. Password reset page (new: `/auth/callback` + `/reset-password`)
Create `src/app/auth/callback/route.ts`:
- Handle Supabase PKCE callback (exchange code for session)
- Redirect to `next` param or `/platform/dashboard`

Create `src/app/(auth)/reset-password/page.tsx`:
- Form with new password + confirm password
- `updateUser({ password: newPassword })`
- Redirect to `/platform/dashboard` on success

### 5. Auth middleware
Update `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
// Refresh session on every request
// Redirect unauthenticated users from /platform/* to /login
// Redirect authenticated users from /login, /register to /platform/dashboard
```

### 6. Auth state in layout
Update `src/app/(auth)/layout.tsx`:
- Server component — check session; if authenticated, redirect to platform

### 7. User profile creation trigger
In `supabase/migrations/` add trigger: on `auth.users` insert → insert row into `public.users` with `first_name`, `last_name` from `raw_user_meta_data`.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 8. Session hook
Create `src/lib/hooks/use-user.ts`:
- Client-side hook returning current user + loading state
- Subscribes to `supabase.auth.onAuthStateChange`

## Files to create/modify
- `Shadcn/src/app/(auth)/login/components/user-auth-form.tsx` — wire Supabase auth
- `Shadcn/src/app/(auth)/register/components/register-form.tsx` — wire Supabase auth
- `Shadcn/src/app/(auth)/forgot-password/components/forgot-password-form.tsx` — wire Supabase
- `Shadcn/src/app/(auth)/reset-password/page.tsx` — new
- `Shadcn/src/app/auth/callback/route.ts` — new PKCE callback handler
- `Shadcn/src/middleware.ts` — session refresh + route protection
- `Shadcn/src/lib/hooks/use-user.ts` — new
- `supabase/migrations/20240002000000_auth_trigger.sql` — handle_new_user trigger

## Validation
- [ ] TypeScript: `pnpm tsc --noEmit` — no errors
- [ ] `pnpm lint` passes
- [ ] Manual: sign up with email → receive confirmation email → verify → redirected to dashboard
- [ ] Manual: login with wrong password → shows inline error
- [ ] Manual: forgot password → email received → click link → set new password → login works
- [ ] Manual: unauthenticated browser visits `/platform/dashboard` → redirected to `/login`
- [ ] Manual: authenticated user visits `/login` → redirected to `/platform/dashboard`
- [ ] Supabase dashboard shows new user row in `public.users` after registration
