# PLUGINS — Producto #001 (Landing_Site)

> Sistema de plugins de medición del Template.
> Cada plugin se activa **únicamente** por env var. Sin env var → sin script cargado.

**Versión:** v0.1 (Fase A — sistema diseñado, implementación en Fase B)

---

## 1. Filosofía

- **Activación por env var.** Sin tocar código. El cliente (o la Plataforma) define las env vars de su deploy.
- **Sin env var → sin script.** Si `NEXT_PUBLIC_GA4_ID` está vacío, `<Ga4 />` no renderea nada. Cero overhead, cero llamadas a CDNs externos.
- **Privacidad por default.** Ningún plugin se activa "por si acaso". El cliente decide explícitamente qué medir.
- **Compliance-friendly.** Documentar para cada plugin qué cookies setea, qué datos envía, en qué jurisdicción está el proveedor — útil para banner de cookies si se requiere.
- **No vendor lock-in.** Migrar de un proveedor a otro = cambiar env vars. Sin reescrituras.

---

## 2. Catálogo de plugins (MVP)

| Plugin | Env var | Activado en `slowcraft.ai` hoy | Notas |
|---|---|---|---|
| **GA4** (Google Analytics 4) | `NEXT_PUBLIC_GA4_ID` | ✅ `G-TJEN2EXGSN` (vía DB hoy, env-var post-Fase B) | Carga directa de gtag.js si GTM está vacío. |
| **GTM** (Google Tag Manager) | `NEXT_PUBLIC_GTM_ID` | ✅ `GTM-WM6WHTW3` (vía DB hoy, env-var post-Fase B) | Si está set, toma prioridad: GA4 se routea desde GTM. |
| **Meta Pixel** (Facebook) | `NEXT_PUBLIC_META_PIXEL_ID` | ❌ Pendiente | Para clientes con campañas Meta Ads. |
| **Search Console** (Google) | `NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION` | ❌ Pendiente | Solo verification meta tag (no script — usa property ownership). |
| **Hotjar** | `NEXT_PUBLIC_HOTJAR_ID` | ❌ Pendiente | Para grabación de sesiones + heatmaps. |

---

## 3. Catálogo de eventos del dataLayer

Disparados automáticamente por el Template. GA4 y GTM los reciben sin configuración adicional.

| Evento | Disparado por | Variables |
|---|---|---|
| `cta_click` | Cualquier `<a>` o `<button>` con `data-gtm-id` | `cta_id`, `cta_text`, `cta_lang` |
| `form_view` | Form entra en viewport (IntersectionObserver) | `form_id`, `lang` |
| `form_submit_attempt` | Click en botón submit | `form_id`, `motivo`, `lang` |
| `form_submit_invalid` | Validación cliente falla | `form_id` |
| `form_submit_success` | Backend confirma envío | `form_id`, `motivo`, `lang` |
| `form_submit_error` | Falla envío al backend | `form_id`, `error` |
| `lang_change` | Toggle ES/EN | `from`, `to` |
| `scroll_depth` (futuro) | Cuando el usuario scrollea 25/50/75/100% | `depth` |

### CTA IDs canónicos

`cta_nav` · `cta_hero` · `cta_form_submit` · `cta_whatsapp`. Cada nuevo CTA en el landing debe declarar `data-gtm-id` con un nombre único en este patrón.

---

## 4. Cómo agregar un plugin nuevo

1. Crear `src/plugins/<plugin-name>.tsx`:

```typescript
'use client'
export function MyPlugin() {
  const id = process.env.NEXT_PUBLIC_MY_PLUGIN_ID
  if (!id) return null
  return <Script src={`https://...`} strategy="afterInteractive" />
}
```

2. Agregar a `src/plugins/index.tsx`:

```typescript
export function Plugins() {
  return (
    <>
      <Ga4 />
      <Gtm />
      <MetaPixel />
      <SearchConsole />
      <Hotjar />
      <MyPlugin />   {/* nuevo */}
    </>
  )
}
```

3. Documentar la env var en `platform-docs/.env.example`.
4. Agregar entrada en este documento (sección 2).
5. Documentar cookies + dato enviado para compliance.
6. Conventional Commit: `feat(plugins): add MyPlugin`.

---

## 5. Cómo retirar un plugin

1. Confirmar que ningún cliente lo está usando (env var vacía en todos los deploys).
2. Eliminar el archivo `src/plugins/<plugin-name>.tsx`.
3. Quitar el import de `src/plugins/index.tsx`.
4. Quitar la env var del `.env.example`.
5. Quitar entrada de este documento.
6. Conventional Commit: `feat(plugins)!: remove MyPlugin (BREAKING CHANGE)`.

---

## 6. Activación en la instance Slowcraft

Hoy GA4/GTM viven en `site_settings` table del backend (configurable desde admin). Para mantener esta capacidad post-Fase B sin perder la UX del admin, hay 3 opciones:

- **Opción A — Build-time fetch.** Script `prebuild` en `template-next/package.json` que llama `https://api.slowcraft.ai/api/content`, lee `site_settings`, y escribe `.env.production.local` antes del `next build`. Cada cambio en admin → re-trigger del deploy en Cloudflare Pages.
- **Opción B — Runtime fetch.** Layout server component lee `site_settings` en cada request. Requiere ISR (rompe SSG estático).
- **Opción C — Manual.** El admin actualiza env vars en Cloudflare Pages dashboard cuando cambia. Sencillo, sin acoplamiento.

Recomendación tentativa: **Opción A** para Slowcraft (preserva la UX del admin). El Template puro ofrece solo Opción C (env vars manuales) como contrato general.

---

## 7. Checklist de cumplimiento por plugin

Antes de mergear un plugin nuevo:

- [ ] Componente Client-side puro (no hace data fetch del cliente al servidor).
- [ ] Renderea `null` si la env var no está set.
- [ ] Usa `next/script` con `strategy="afterInteractive"` o `"lazyOnload"` (nunca `"beforeInteractive"` salvo justificación).
- [ ] No carga scripts de terceros sin la env var.
- [ ] Documentado en sección 2 de este archivo.
- [ ] Env var documentada en `.env.example`.
- [ ] Sin secretos en el código (solo env vars públicas — todo lo del plugin va en `NEXT_PUBLIC_*`).
- [ ] Para compliance: documentado qué cookies setea + qué datos envía.

---

## 8. Diferencia con plugins de la Plataforma

Importante: la Plataforma tiene su propio sistema de plugins (feature flags) documentado en `handoff-producto-001/contractual-snapshot/PLUGINS.md`. **No confundir.**

| | Plugins del Template (este doc) | Plugins de Plataforma |
|---|---|---|
| Para qué | Medición del sitio público (GA4, GTM, Meta Pixel) | Features internas de la Plataforma (PayPal, Custom Domain, Agent Engine) |
| Cómo se activan | Env var del fork del cliente | Feature flags en código + env vars de Plataforma |
| Quién decide | Cliente (vía consultor o self-serve) | Equipo Slowcraft (super_admin) |

---

*platform-docs/PLUGINS.md · v0.1 · Producto #001 · 2026-05-10*
