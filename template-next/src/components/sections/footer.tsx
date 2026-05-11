import { useTranslations } from 'next-intl'
import { brand } from '@/brand.config'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-[var(--border-default)] bg-crema py-16">
      <div className="container-editorial flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-2xl text-tinta">{brand.name.toLowerCase()}</p>
          <p className="mt-2 max-w-md font-serif italic text-piedra">{t('tagline')}</p>
        </div>

        <div className="font-mono text-xs uppercase tracking-wider text-piedra">
          <p>{t('address')}</p>
          <p className="mt-2">
            <a
              href={`mailto:${brand.contactEmail}`}
              className="transition-colors hover:text-tinta"
            >
              {brand.contactEmail}
            </a>
          </p>
          <p className="mt-6 text-[10px] text-piedra-soft">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
