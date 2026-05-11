import { useTranslations } from 'next-intl'

export function Sobre() {
  const t = useTranslations('sobre')

  return (
    <section id="sobre" className="container-editorial py-32 md:py-48">
      <p className="eyebrow mb-8">{t('eyebrow')}</p>
      <h2 className="mb-16 max-w-3xl font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-tinta">
        {t('h2')}
      </h2>

      <div className="grid max-w-4xl gap-12 md:grid-cols-2">
        <p className="text-lg leading-relaxed text-tinta">{t('p1')}</p>
        <p className="text-lg leading-relaxed text-tinta">{t('p2')}</p>
      </div>
    </section>
  )
}
