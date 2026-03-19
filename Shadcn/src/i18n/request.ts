import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale } from './config'

// Resolve the locale for the current request.
// We do NOT use URL-based locale routing — locale is per-user from DB.
// next-intl still needs a locale for server-side translation resolution.
// We read it from a cookie set when the user changes language in Settings.

export default getRequestConfig(async () => {
  // Read locale from cookie (set by server action when user changes language).
  // Falls back to company default or 'pl'.
  // In the full implementation, this reads from the Supabase session + users table.
  // For now, we use a simpler cookie-based approach.

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined

  const locale: Locale = localeCookie ?? defaultLocale

  // Load messages for the resolved locale, falling back to 'pl' if file missing
  let messages: Record<string, unknown>
  try {
    // Messages are in the monorepo root /messages/ directory
    // In Next.js, we load them relative to the project
    messages = (await import(`../../../messages/${locale}.json`)).default as Record<string, unknown>
  } catch {
    messages = (await import(`../../../messages/${defaultLocale}.json`)).default as Record<string, unknown>
  }

  return { locale, messages }
})
