-- ============================================================
-- SMB 360 Platform — i18n: Add locale_override to users
-- Migration: 20240003000000_i18n_locale_override
-- Phase 1 / PRP-008
-- ============================================================

-- Add per-user locale override column.
-- NULL = use company default (companies.locale)
-- 'pl' | 'en' | 'de' | 'fr' = user's personal override

ALTER TABLE users
  ADD COLUMN locale_override TEXT
  CHECK (locale_override IN ('pl', 'en', 'de', 'fr'));

-- Update database.types.ts to add this column after running:
-- supabase gen types typescript --local > Shadcn/src/types/database.types.ts
