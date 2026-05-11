import type { MetadataRoute } from 'next'
import { brand } from '@/brand.config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.domain}`

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'es-MX': SITE_URL,
          en: SITE_URL,
        },
      },
    },
  ]
}
