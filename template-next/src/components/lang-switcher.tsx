'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { pushDataLayer } from '@/lib/analytics'
import type { Locale } from '@/i18n/routing'

const COOKIE_NAME = 'NEXT_LOCALE'

export function LangSwitcher() {
  const current = useLocale() as Locale
  const [isPending, startTransition] = useTransition()

  function setLocale(next: Locale) {
    if (next === current) return
    pushDataLayer({ event: 'lang_change', from: current, to: next })

    // Cookie persistente 1 año, path raíz, secure en https
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${secure ? '; secure' : ''}`

    startTransition(() => {
      // Refrescar para que el server resuelva el nuevo locale.
      window.location.reload()
    })
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider"
      data-pending={isPending ? '1' : undefined}
    >
      <button
        type="button"
        onClick={() => setLocale('es-MX')}
        aria-pressed={current === 'es-MX'}
        className={
          current === 'es-MX'
            ? 'text-tinta'
            : 'text-piedra transition-colors hover:text-tinta'
        }
      >
        ES
      </button>
      <span className="text-piedra-soft" aria-hidden>
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={current === 'en'}
        className={
          current === 'en' ? 'text-tinta' : 'text-piedra transition-colors hover:text-tinta'
        }
      >
        EN
      </button>
    </div>
  )
}
