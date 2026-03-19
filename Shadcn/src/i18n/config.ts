export const locales = ['pl', 'en', 'de', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'pl'

export const localeLabels: Record<Locale, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
}

// Locales that have full translations (de/fr are stubs, fall back to en)
export const fullyTranslatedLocales: Locale[] = ['pl', 'en']
