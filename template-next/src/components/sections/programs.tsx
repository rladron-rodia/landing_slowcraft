import { useTranslations } from 'next-intl'

export function Programs() {
  const t = useTranslations('programs')
  const items = t.raw('items') as Array<{ h: string; p: string; modules: string[] }>

  return (
    <section id="programs" className="container-editorial py-32 md:py-48">
      <p className="eyebrow mb-8">{t('eyebrow')}</p>
      <h2 className="mb-6 max-w-3xl font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight text-tinta">
        {t('h2')}
      </h2>
      <p className="mb-20 max-w-2xl text-lg leading-relaxed text-piedra">{t('intro')}</p>

      <div className="grid gap-12 md:grid-cols-2">
        {items.map((item, i) => (
          <article key={item.h} className="border border-[var(--border-default)] p-12">
            <p className="mb-3 font-mono text-xs text-cobre">P{i + 1}</p>
            <h3 className="mb-4 font-serif text-2xl text-tinta">{item.h}</h3>
            <p className="mb-8 text-base leading-relaxed text-piedra">{item.p}</p>
            <div className="border-t border-[var(--border-default)] pt-6">
              <ul className="space-y-2 font-mono text-xs uppercase tracking-wider text-tinta">
                {item.modules.map((m) => (
                  <li key={m} className="flex gap-3">
                    <span className="text-salvia">+</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
