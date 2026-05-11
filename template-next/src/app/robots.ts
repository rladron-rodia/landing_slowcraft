import type { MetadataRoute } from 'next'
import { brand } from '@/brand.config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.domain}`

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
