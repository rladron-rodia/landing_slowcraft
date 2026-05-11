import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { brand } from '@/brand.config'
import { Plugins } from '@/plugins'
import '@/styles/globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${brand.domain}`

// ---------------------------------------------------------------------------
// Metadata API — replica el SEO del index.html legacy 1:1
// ---------------------------------------------------------------------------
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  const tagline = brand.tagline.es // default; el lang attr del <html> ya cubre

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${brand.name} — ${tagline}`,
      template: `%s · ${brand.name}`,
    },
    description: t('hero.p'),
    applicationName: brand.name,
    authors: [{ name: brand.legalName }],
    keywords: [
      'consultora IA México',
      'estrategia inteligencia artificial empresas',
      'implementación IA LATAM',
      'AI strategy consulting Mexico',
      'automatización procesos IA',
      'consultoría IA Ciudad de México',
    ],
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    alternates: {
      canonical: SITE_URL,
      languages: {
        'es-MX': SITE_URL,
        en: SITE_URL,
        'x-default': SITE_URL,
      },
    },
    verification: process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION }
      : undefined,
    openGraph: {
      type: 'website',
      siteName: brand.name,
      locale: 'es_MX',
      alternateLocale: ['en_US'],
      url: SITE_URL,
      title: `${brand.name} — ${tagline}`,
      description: t('hero.p'),
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${brand.name} — ${tagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.name} — ${tagline}`,
      description: t('hero.p'),
      images: ['/og-image.png'],
    },
    icons: {
      icon: [
        {
          url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Cpath d='M12 0h12v24H12z'/%3E%3C/clipPath%3E%3C/defs%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%230F0F0E' stroke-width='2'/%3E%3Ccircle cx='12' cy='12' r='10' fill='%230F0F0E' clip-path='url(%23c)'/%3E%3C/svg%3E`,
          type: 'image/svg+xml',
        },
      ],
      apple: '/favicon-180.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0E' },
    { media: '(prefers-color-scheme: light)', color: '#F5F1EA' },
  ],
  width: 'device-width',
  initialScale: 1,
}

// ---------------------------------------------------------------------------
// JSON-LD: Organization + LocalBusiness + Services
// ---------------------------------------------------------------------------
function jsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
        '@id': `${SITE_URL}#organization`,
        name: brand.name,
        alternateName: brand.legalName,
        description:
          'Consultora boutique de estrategia IA para empresas en crecimiento en LATAM.',
        url: SITE_URL,
        logo: `${SITE_URL}/og-image.png`,
        image: `${SITE_URL}/og-image.png`,
        foundingDate: brand.foundingYear,
        ...(brand.address && {
          address: {
            '@type': 'PostalAddress',
            addressLocality: brand.address.locality,
            addressRegion: brand.address.region,
            addressCountry: brand.address.country,
          },
        }),
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: brand.contactEmail,
          availableLanguage: ['Spanish', 'English'],
        },
        knowsAbout: [
          'Estrategia de Inteligencia Artificial',
          'AI Readiness',
          'Workflow Architecture humano-IA',
          'Implementación de IA en empresas',
          'Automatización de procesos',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: brand.name,
        description: brand.tagline.es,
        publisher: { '@id': `${SITE_URL}#organization` },
        inLanguage: ['es-MX', 'en-US'],
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href={SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Plugins />
      </body>
    </html>
  )
}
