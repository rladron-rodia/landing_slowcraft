import { useTranslations } from 'next-intl'

export function Principios() {
  const t = useTranslations('principios')
  const items = t.raw('items') as Array<{ h: string; p: string }>

  return (
    <section className="bg-tinta py-32 text-crema md:py-48">
      <div className="container-editorial">
        <p className="eyebrow mb-16 text-piedra-light">{t('eyebrow')}</p>

        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {items.map((item, i) => (
            <div key={item.h} className="border-t border-piedra/30 pt-8">
              <p className="mb-4 font-mono text-xs text-cobre-light">0{i + 1}</p>
              <h3 className="mb-4 font-serif text-2xl text-crema">{item.h}</h3>
              <p className="text-base leading-relaxed text-piedra-light">{item.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
