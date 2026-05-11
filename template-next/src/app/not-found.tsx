import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations()

  return (
    <main className="container-editorial flex min-h-dvh flex-col items-center justify-center text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="font-serif text-5xl text-tinta md:text-6xl">
        {t('nav.metodo') /* placeholder while we add 404 keys */ ? 'Página no encontrada' : ''}
      </h1>
      <p className="mt-6 max-w-md text-piedra">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-12 border border-tinta px-8 py-3 font-mono text-xs uppercase tracking-wider text-tinta transition-colors hover:bg-tinta hover:text-crema"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
