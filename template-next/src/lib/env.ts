import { z } from 'zod'

/**
 * Schema de validación de env vars públicas.
 * Las server-only se validan aparte con un schema distinto cuando se usen.
 *
 * Reglas:
 * - NEXT_PUBLIC_CONTACT_ENDPOINT y NEXT_PUBLIC_SITE_URL son requeridas.
 * - Todos los plugins son opcionales — string vacío = plugin inactivo.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_CONTACT_ENDPOINT: z.string().url().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().min(1),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('es-MX'),

  NEXT_PUBLIC_GA4_ID: z.string().optional().default(''),
  NEXT_PUBLIC_GTM_ID: z.string().optional().default(''),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional().default(''),
  NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION: z.string().optional().default(''),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional().default(''),

  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional().default('https://us.i.posthog.com'),
})

/**
 * Llamar al inicio del proceso (en next.config o layout.tsx) para validar.
 * En componentes, usar process.env.NEXT_PUBLIC_* directamente — Next.js los inyecta.
 */
export function validatePublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_CONTACT_ENDPOINT: process.env.NEXT_PUBLIC_CONTACT_ENDPOINT,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION: process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION,
    NEXT_PUBLIC_HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  })

  if (!parsed.success) {
    console.error('❌ Public env validation failed:', parsed.error.flatten())
    throw new Error('Invalid public env vars — see logs')
  }

  return parsed.data
}

export type PublicEnv = z.infer<typeof publicEnvSchema>
