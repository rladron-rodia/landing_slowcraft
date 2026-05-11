import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { routing } from './routing'

const COOKIE_NAME = 'NEXT_LOCALE'

/**
 * Resuelve el locale para cada request.
 * Prioridad: cookie de override → Accept-Language → default.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headersList = await headers()

  const fromCookie = cookieStore.get(COOKIE_NAME)?.value
  const fromHeader = headersList.get('accept-language')?.split(',')[0]?.trim()

  let locale: string = routing.defaultLocale

  if (fromCookie && (routing.locales as readonly string[]).includes(fromCookie)) {
    locale = fromCookie
  } else if (fromHeader) {
    // Match por prefijo del idioma (ej. "en-US" → "en")
    const lang = fromHeader.split('-')[0]?.toLowerCase()
    if (lang === 'en') locale = 'en'
    if (lang === 'es') locale = 'es-MX'
  }

  const messages = (await import(`../../messages/${locale}.json`)).default
  return { locale, messages }
})
