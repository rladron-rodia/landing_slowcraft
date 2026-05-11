import { defineRouting } from 'next-intl/routing'

/**
 * Locales soportados y default.
 *
 * Estrategia: NO localizar URLs (mismo URL para ambos locales).
 * El locale se resuelve por:
 *   1. Cookie `NEXT_LOCALE` (override del usuario via lang switcher).
 *   2. Header Accept-Language (auto-detect).
 *   3. defaultLocale.
 *
 * Si en el futuro queremos URLs como /es/ y /en/, cambiar localePrefix
 * a 'always' o 'as-needed'.
 */
export const routing = defineRouting({
  locales: ['es-MX', 'en'],
  defaultLocale: 'es-MX',
  localePrefix: 'never',
})

export type Locale = (typeof routing.locales)[number]
