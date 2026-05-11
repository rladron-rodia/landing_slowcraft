import { Ga4 } from './ga4'
import { Gtm } from './gtm'
import { MetaPixel } from './meta-pixel'
import { Hotjar } from './hotjar'

/**
 * Root del plugin system.
 * Cada hijo es un componente que renderea null si su env var no está set.
 *
 * Search Console verification se inyecta vía metadata.verification del
 * layout.tsx (es la forma idiomática de Next.js para meta tags).
 *
 * Cargar dentro de <body>, después del contenido principal.
 */
export function Plugins() {
  return (
    <>
      <Ga4 />
      <Gtm />
      <MetaPixel />
      <Hotjar />
    </>
  )
}
