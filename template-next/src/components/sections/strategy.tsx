import { useTranslations } from 'next-intl'

export function Strategy() {
  const t = useTranslations('serv')
  const items = t.raw('items') as Array<{ h: string; p: string; list: string[] }>

  return (
    <section id="strategy" className="bg-crema-soft py-32 md:py-48">
      <div className="container-editorial">
        <p className="eyebrow mb-8">{t('eyebrow')}</p>
        <h2 className="mb-6 max-w-3xl font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-tinta">
          {t('h2')}
        </h2>
        <p className="mb-20 max-w-2xl text-lg leading-relaxed text-piedra">{t('intro')}</p>

        <div className="grid gap-12 md:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.h}
              className="border-t border-tinta pt-8"
            >
              <p className="mb-3 font-mono text-xs text-cobre">S{i + 1}</p>
              <h3 className="mb-4 font-serif text-2xl text-tinta">{item.h}</h3>
              <p className="mb-6 text-base leading-relaxed text-piedra">{item.p}</p>
              <ul className="space-y-2 font-mono text-xs uppercase tracking-wider text-tinta">
                {item.list.map((li) => (
                  <li key={li} className="flex gap-3">
                    <span className="text-cobre">·</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
