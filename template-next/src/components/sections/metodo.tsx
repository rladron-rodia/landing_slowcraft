import { useTranslations } from 'next-intl'

export function Metodo() {
  const t = useTranslations('metodo')

  return (
    <section id="metodo" className="container-editorial py-32 md:py-48">
      <p className="eyebrow mb-8">{t('eyebrow')}</p>
      <h2 className="mb-20 max-w-3xl font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-tinta">
        {t('h2')}
      </h2>

      <div className="grid gap-16 md:grid-cols-3">
        {(['f1', 'f2', 'f3'] as const).map((fase, i) => (
          <div key={fase}>
            <div className="mb-6 flex items-baseline gap-4">
              <span className="font-mono text-4xl text-cobre">0{i + 1}</span>
            </div>
            <h3 className="mb-4 font-serif text-2xl text-tinta">{t(`${fase}.h`)}</h3>
            <p className="text-base leading-relaxed text-piedra">{t(`${fase}.p`)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
