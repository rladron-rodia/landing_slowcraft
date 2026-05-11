import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LangSwitcher } from '@/components/lang-switcher'
import { brand } from '@/brand.config'

export function Nav() {
  const t = useTranslations('nav')

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-default)] bg-crema/85 backdrop-blur-md">
      <div className="container-editorial flex items-center justify-between py-4">
        <Link
          href="/"
          className="font-serif text-2xl text-tinta"
          aria-label={brand.name}
        >
          {brand.name.toLowerCase()}
        </Link>

        <ul className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-piedra md:flex">
          <li>
            <a href="#metodo" className="transition-colors hover:text-tinta">
              {t('metodo')}
            </a>
          </li>
          <li>
            <a href="#strategy" className="transition-colors hover:text-tinta">
              {t('strategy')}
            </a>
          </li>
          <li>
            <a href="#programs" className="transition-colors hover:text-tinta">
              {t('programs')}
            </a>
          </li>
          <li>
            <a href="#sobre" className="transition-colors hover:text-tinta">
              {t('sobre')}
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <LangSwitcher />
          <a
            href="#contacto"
            data-gtm-id="cta_nav"
            className="border border-tinta px-5 py-2 font-mono text-xs uppercase tracking-wider text-tinta transition-colors hover:bg-tinta hover:text-crema"
          >
            {t('cta')}
          </a>
        </div>
      </div>
    </nav>
  )
}
