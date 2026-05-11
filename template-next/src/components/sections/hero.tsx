import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="container-editorial pt-24 pb-32 md:pt-32 md:pb-48">
      <p className="eyebrow mb-8">{t('eyebrow')}</p>

      <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] tracking-[-0.02em] text-tinta">
        {t.rich('h1', {
          em: (chunks) => <em className="font-serif italic text-cobre">{chunks}</em>,
        })}
      </h1>

      <p className="mt-12 max-w-2xl text-lg leading-relaxed text-piedra md:text-xl">
        {t('p')}
      </p>

      <a
        href="#contacto"
        data-gtm-id="cta_hero"
        className="mt-16 inline-block border border-tinta px-10 py-4 font-mono text-xs uppercase tracking-wider text-tinta transition-colors hover:bg-tinta hover:text-crema"
      >
        {t('cta')}
      </a>

      <div className="mt-24 flex items-center gap-4 border-t border-[var(--border-default)] pt-8">
        <span className="h-2 w-2 rounded-full bg-cobre" aria-hidden />
        <span className="font-mono text-xs italic text-piedra">{t('metaText')}</span>
      </div>
    </section>
  )
}
