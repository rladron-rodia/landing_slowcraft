/**
 * Plugin: Google Search Console verification.
 *
 * Activación: NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION set y no vacío.
 * Solo agrega un meta tag en <head>. No carga scripts de terceros.
 *
 * Render desde app/layout.tsx en metadata.verification (preferido) o como
 * componente directo en <head>. Aquí lo dejamos como fallback simple.
 */
export function SearchConsoleMeta() {
  const value = process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION
  if (!value) return null
  return <meta name="google-site-verification" content={value} />
}
