import { useTranslations } from 'next-intl'

export function Tesis() {
  const t = useTranslations('tesis')

  return (
    <section className="bg-crema-soft py-32 md:py-48">
      <div className="container-editorial">
        <p className="eyebrow mb-8">{t('eyebrow')}</p>

        <h2 className="mb-16 max-w-4xl font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-tinta">
          {t.rich('h2', {
            em: (chunks) => <em className="italic text-cobre">{chunks}</em>,
          })}
        </h2>

        <div className="grid gap-12 md:grid-cols-3">
          {(['b1', 'b2', 'b3'] as const).map((key, i) => (
            <div key={key} className="border-t border-tinta pt-6">
              <p className="mb-4 font-mono text-xs text-piedra">0{i + 1}</p>
              <p className="text-lg leading-relaxed text-tinta">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
