/**
 * Metadata del Producto del que esta instance es fork.
 * Lo consume la Plataforma vía github-engine para validar compatibility
 * y para el flujo de propagación de mejoras del Template.
 */

export type ProductArchetype = 'digital_presence' | 'operative_agent' | 'intelligence'

export interface ProductConfig {
  /** Nombre canónico del Producto */
  name: string
  /** Slug en kebab-case (igual al repo del Template) */
  slug: string
  /** Arquetipo del Producto (define agrupación en el catálogo) */
  archetype: ProductArchetype
  /** Versión semver del Template del que esta instance es fork */
  version: string
  /** Add-ons compatibles con este Producto */
  compatibleAddons: string[]
  /** Si este Producto puede operar como add-on de otro */
  availableAsAddon: boolean
  /** URL del repo del Template upstream (cuando exista en Fase D) */
  upstreamRepo?: string
}

export const product: ProductConfig = {
  name: 'Landing_Site',
  slug: 'landing-site',
  archetype: 'digital_presence',
  version: '0.0.1', // Fase B en construcción; v1.0.0 al cierre de cutover Fase C
  compatibleAddons: ['ai-chatbot', 'perf-seo-audit', 'custom-domain'],
  availableAsAddon: false,
  // upstreamRepo: 'https://github.com/slowcraft-ai/product-landing-site', // Post-Fase D
}
