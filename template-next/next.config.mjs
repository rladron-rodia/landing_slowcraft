import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — listo para Cloudflare Pages, GitHub Pages, S3, etc.
  // Si en el futuro queremos ISR/Server Actions con persistencia, quitar
  // esta línea y usar Cloudflare Pages con Functions, o Vercel/Railway.
  output: 'export',

  // Las imágenes optimizadas requieren un servidor; en static export
  // hay que desactivar la optimización built-in de Next.
  images: {
    unoptimized: true,
  },

  // Trailing slash uniforme — preferencia de SEO y para servir estático
  trailingSlash: false,

  // Logging mínimo en producción
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  experimental: {
    // Activar cuando React 19 stable + Tailwind v4 stable estén alineados
    // typedRoutes: true,
  },
}

export default withNextIntl(nextConfig)
