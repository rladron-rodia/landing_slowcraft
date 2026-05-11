import Script from 'next/script'

/**
 * Plugin: Google Analytics 4.
 *
 * Activación: NEXT_PUBLIC_GA4_ID set y no vacío.
 * Si NEXT_PUBLIC_GTM_ID también está set, GA4 se carga vía GTM (no aquí).
 */
export function Ga4() {
  const id = process.env.NEXT_PUBLIC_GA4_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  if (!id) return null
  // Si GTM está activo, GA4 se carga desde el contenedor de GTM
  if (gtmId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
