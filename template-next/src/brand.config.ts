/**
 * Identidad de la instance (brand config).
 *
 * Para cada fork del Template, este archivo cambia. Es el único punto de
 * configuración de marca. La paleta y tipografías canónicas viven en
 * src/styles/globals.css (DS v2.0); el cliente puede sobreescribirlas ahí.
 */

export interface BrandConfig {
  name: string
  legalName: string
  tagline: { es: string; en: string }
  domain: string
  contactEmail: string
  whatsapp?: {
    number: string // formato internacional sin espacios, sin "+"
    businessLabel?: { es: string; en: string }
  }
  social?: {
    linkedin?: string
    twitter?: string
    github?: string
    instagram?: string
  }
  fonts: {
    serif: string
    sans: string
    mono: string
  }
  /** Fundación de la organización — usado en JSON-LD */
  foundingYear?: string
  address?: {
    locality: string
    region: string
    country: string // ISO 3166-1 alpha-2
  }
}

// =====================================================================
// Instance: Slowcraft
// =====================================================================
export const brand: BrandConfig = {
  name: 'Slowcraft',
  legalName: 'Slowcraft Strategy & Programs',
  tagline: {
    es: 'Estrategia AI, deliberadamente diseñada.',
    en: 'AI Strategy, deliberately designed.',
  },
  domain: 'slowcraft.ai',
  contactEmail: 'hola@slowcraft.ai',
  whatsapp: {
    number: '5215512345678', // TODO: confirmar número real con Rodrigo
    businessLabel: {
      es: 'WhatsApp Slowcraft',
      en: 'Slowcraft WhatsApp',
    },
  },
  social: {
    // TODO: completar cuando Rodrigo confirme handles
  },
  fonts: {
    serif: 'Newsreader',
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  foundingYear: '2026',
  address: {
    locality: 'Ciudad de México',
    region: 'CDMX',
    country: 'MX',
  },
}
