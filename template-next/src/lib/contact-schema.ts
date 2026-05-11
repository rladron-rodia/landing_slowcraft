import { z } from 'zod'

/**
 * Schema del form de contacto.
 * Mismas reglas que el server actual (backend/src/server.js validatePayload):
 *
 * - fullName: string 3-80 chars con al menos un espacio (nombre + apellido).
 * - email: válido + dominio NO en lista de free providers.
 * - jobTitle: string 2-80 chars.
 * - companyWebsite: dominio válido (con o sin scheme).
 * - reason: enum acotado.
 * - description: string 20-1000 chars.
 *
 * Naming en inglés (CONVENTIONS contractual). El mapper a ES legacy vive en
 * actions/submit-contact.ts antes de postear al backend Express.
 */

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.mx',
  'yahoo.es',
  'hotmail.com',
  'hotmail.es',
  'hotmail.com.mx',
  'outlook.com',
  'outlook.es',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'tutanota.com',
  'mail.com',
  'gmx.com',
  'yandex.com',
  'zoho.com',
])

const REASONS = ['proyectos', 'informes', 'bolsa-de-trabajo'] as const
export type ContactReason = (typeof REASONS)[number]

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'errors.contact.fullName.tooShort')
    .max(80, 'errors.contact.fullName.tooLong')
    .refine((s) => /\s/.test(s), 'errors.contact.fullName.needsLastName'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('errors.contact.email.invalid')
    .refine((s) => {
      const domain = s.split('@')[1]
      return domain ? !FREE_EMAIL_DOMAINS.has(domain) : false
    }, 'errors.contact.email.noFree'),

  jobTitle: z
    .string()
    .trim()
    .min(2, 'errors.contact.jobTitle.tooShort')
    .max(80, 'errors.contact.jobTitle.tooLong'),

  companyWebsite: z
    .string()
    .trim()
    .min(1, 'errors.contact.companyWebsite.required')
    .refine((raw) => {
      const stripped = raw
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '')
        .toLowerCase()
      return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(stripped)
    }, 'errors.contact.companyWebsite.invalid'),

  reason: z.enum(REASONS, {
    errorMap: () => ({ message: 'errors.contact.reason.invalid' }),
  }),

  description: z
    .string()
    .trim()
    .min(20, 'errors.contact.description.tooShort')
    .max(1000, 'errors.contact.description.tooLong'),

  // Honeypot — los bots completan este campo invisible.
  website: z.string().optional(),
})

export type ContactInput = z.infer<typeof contactSchema>

/**
 * Mapper EN → ES legacy para postear al backend Express actual.
 * El backend espera nombres ES (nombre, motivo, descripcion, etc.).
 */
export function toLegacyPayload(input: ContactInput): Record<string, string> {
  return {
    nombre: input.fullName,
    email: input.email,
    cargo: input.jobTitle,
    empresa_web: input.companyWebsite,
    motivo: input.reason,
    descripcion: input.description,
  }
}
