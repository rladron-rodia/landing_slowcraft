# Slowcraft Platform — PERFORMANCE

> Pilar no negociable. La performance no se "ajusta después" — se diseña desde el primer commit.
>
> Este documento define los budgets de performance que toda página, query y deploy debe respetar. Cualquier degradación es tratada como un bug, no como una mejora pendiente.

**Versión:** 1.0
**Última actualización:** Mayo 2026
**Audiencia:** Cualquier persona que escriba código para la Plataforma o sus Productos.

---

## Índice

1. [Filosofía de performance](#1-filosofía-de-performance)
2. [Budgets globales](#2-budgets-globales)
3. [Core Web Vitals — targets por superficie](#3-core-web-vitals--targets-por-superficie)
4. [Bundle size budgets](#4-bundle-size-budgets)
5. [Database query performance](#5-database-query-performance)
6. [Caching strategy](#6-caching-strategy)
7. [Edge runtime y server components](#7-edge-runtime-y-server-components)
8. [Image, font y asset optimization](#8-image-font-y-asset-optimization)
9. [Agent runs — performance asíncrono](#9-agent-runs--performance-asíncrono)
10. [Monitoring continuo](#10-monitoring-continuo)
11. [Procedimiento ante regresión](#11-procedimiento-ante-regresión)

---

## 1. Filosofía de performance

Cuatro principios:

1. **Performance es UX.** Una página que tarda > 3s en interactiva pierde el 50% de usuarios. La performance no compite con el diseño — es parte del diseño.

2. **Medir antes de optimizar.** Sin métricas reales (no benchmarks teóricos), las optimizaciones son adivinanza. Lighthouse, RUM (Posthog), Sentry Performance.

3. **Budgets como contratos.** Si un budget se excede, el PR no se mergea. Sin excepciones "lo arreglo después".

4. **Simplicidad sobre micro-optimización.** No optimizar por adelantado. Pero tampoco escribir código manifiestamente lento "porque después se ve". Sentido común.

---

## 2. Budgets globales

Aplicables a todas las apps de la Plataforma. Verificados automáticamente en cada release.

| Métrica | Budget | Severidad si excede |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s en p75 mobile 4G | Bloquea release |
| **INP** (Interaction to Next Paint) | < 200ms en p75 | Bloquea release |
| **CLS** (Cumulative Layout Shift) | < 0.1 en p75 | Bloquea release |
| **TTFB** (Time to First Byte) | < 600ms en p75 | Bloquea release |
| **JS bundle inicial (gzip)** | < 200 KB primera carga | Bloquea release |
| **Total page weight** | < 1 MB primera carga | Warning |
| **Lighthouse Performance score** | ≥ 90 | Warning si entre 80-90, bloquea < 80 |
| **Cold start de Next.js** | < 2s en Railway | Warning |
| **Build time del monorepo completo** | < 3 min | Warning |
| **Build time per app (incremental con Turbo)** | < 30s | Warning |

---

## 3. Core Web Vitals — targets por superficie

Cada app/superficie tiene sus propios targets más estrictos según su naturaleza:

### 3.1 Mission Control (`app.slowcraft.ai`)

| Métrica | Target |
|---|---|
| LCP | < 1.8s |
| INP | < 150ms |
| CLS | < 0.05 |
| TTFB | < 400ms |

Justificación: usuarios internos, equipo desktop, conexiones rápidas. Esperamos UX premium.

### 3.2 Agency Hub (`hub.slowcraft.ai`)

| Métrica | Target |
|---|---|
| LCP | < 2.0s |
| INP | < 150ms |
| CLS | < 0.05 |
| TTFB | < 500ms |

Justificación: similar a Mission Control pero con más data tables y agent runs en vivo.

### 3.3 Client Portal (`[slug].slowcraft.ai`)

| Métrica | Target |
|---|---|
| LCP | < 2.0s |
| INP | < 200ms |
| CLS | < 0.05 |
| TTFB | < 500ms |

Justificación: el cliente final puede entrar desde mobile. La primera impresión cuenta. **Es lo más cercano que el cliente ve a "la marca Slowcraft" — debe sentirse premium.**

### 3.4 Productos del cliente (`[slug].slowcraft.ai` o dominio custom)

| Métrica | Target |
|---|---|
| LCP | **< 1.5s** |
| INP | < 200ms |
| CLS | < 0.05 |
| TTFB | < 400ms |
| Lighthouse Performance | **≥ 95** |

Justificación: estos son los productos del cliente. Su performance reflexiona directamente sobre la marca del cliente Y sobre Slowcraft. Tiene que ser excepcional. Particularmente para el Producto #001 (Landing Site), que es lo primero que un visitante ve del cliente.

---

## 4. Bundle size budgets

### 4.1 Por app de la Plataforma

```
mission-control:
  initial JS (gzip): < 250 KB
  initial CSS (gzip): < 30 KB
  per-route additional: < 80 KB
  
agency-hub:
  initial JS (gzip): < 250 KB
  initial CSS (gzip): < 30 KB
  per-route additional: < 80 KB

client-portal:
  initial JS (gzip): < 180 KB    (más estricto, audiencia cliente)
  initial CSS (gzip): < 25 KB
  per-route additional: < 60 KB
```

### 4.2 Por producto (template)

```
template-landing-site:
  initial JS (gzip): < 80 KB     (Astro o Next.js con minimal JS)
  initial CSS (gzip): < 20 KB
  total page weight: < 500 KB

template-ai-chatbot widget (cuando se construya en su proyecto):
  embeddable script (gzip): < 50 KB
  
template-perf-seo-audit:
  PDF generation worker: < 15s para reporte estándar
```

### 4.3 Verificación en CI

```yaml
# .github/workflows/check.yml
- name: Bundle size check
  run: |
    pnpm build
    npx bundlesize
    # bundlesize.config.json define los budgets por archivo
```

Si el bundle excede, el check falla → bloquea merge.

---

## 5. Database query performance

### 5.1 Budgets de query

| Tipo de query | Budget p95 | Budget p99 |
|---|---|---|
| Lookup por PK | < 5ms | < 20ms |
| Listado paginado (con índice) | < 50ms | < 200ms |
| Agregaciones simples (count, sum) | < 100ms | < 300ms |
| Reportes complejos (multi-join) | < 500ms | < 1500ms |
| Full-text search | < 200ms | < 500ms |

Cualquier query consistentemente sobre el budget → optimización obligatoria (índice, denormalización, caché).

### 5.2 Reglas innegociables

- **Cero N+1 queries.** Usar `select` con joins anidados de Supabase, o data loaders.
- **Cero `SELECT *`** en producción. Solo las columnas que se necesitan.
- **Índices en TODAS las FK** y en columnas filtradas frecuentemente.
- **EXPLAIN ANALYZE** en cualquier query nueva no trivial antes de mergearla.
- **Connection pooling** vía Supavisor (PgBouncer-equivalente de Supabase).

### 5.3 Slow query log

Supabase logs > 1s automáticamente. Revisión semanal del log → tickets de optimización.

### 5.4 Migraciones de índices

Crear índices en tablas grandes con `CREATE INDEX CONCURRENTLY` (no bloquea writes):

```sql
CREATE INDEX CONCURRENTLY idx_projects_org_status
  ON projects(organization_id, status)
  WHERE status != 'archived';
```

---

## 6. Caching strategy

### 6.1 Capas de caché

```
┌──────────────────────────────────────────────────┐
│ L1 — Browser (HTTP cache + service worker)       │
│ TTL: 1h-1 año según asset                        │
└──────────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────────┐
│ L2 — Cloudflare CDN edge cache                   │
│ TTL: 5 min para HTML, 1 año para assets          │
└──────────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────────┐
│ L3 — Next.js cache (ISR, fetch cache, route)     │
│ TTL: configurable por route                      │
└──────────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────────┐
│ L4 — Upstash Redis (sesiones, rate limit, hot)   │
│ TTL: 1 min - 24h según tipo                      │
└──────────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────────┐
│ L5 — Supabase PostgreSQL                         │
│ shared_buffers + index cache                     │
└──────────────────────────────────────────────────┘
```

### 6.2 Patrones de uso

- **Catálogo de productos** (cambia pocas veces al día) → ISR con `revalidate: 300` (5 min).
- **Dashboard de métricas** (data viva) → SSR con tag-based cache invalidation.
- **Listas paginadas** → server component con `unstable_cache` 30s.
- **Datos por usuario** → no cachear server-side, cliente con SWR/React Query.
- **Assets estáticos** → `Cache-Control: public, max-age=31536000, immutable`.

### 6.3 Invalidación

- `revalidatePath('/projects')` después de cada mutation que afecte la lista.
- `revalidateTag('client-acme')` para invalidar todas las páginas de un cliente.
- Cloudflare purge vía API en deploys (automático).

---

## 7. Edge runtime y server components

### 7.1 Edge para casos correctos

Ideal para edge:
- API routes de auth (login, sesión).
- Webhooks de baja CPU (validación + queue).
- Páginas de marketing y landing.
- Custom domain routing.

NO para edge:
- Operaciones de DB pesadas (latencia adicional).
- Procesamiento de imágenes.
- Generación de PDFs.

### 7.2 Server components por default

Cliente components solo cuando son estrictamente necesarios:
- Interactividad (forms, dropdowns).
- Browser APIs (localStorage, navigator).
- State management complejo.

Heurística: si no necesitas `useState`, `useEffect`, `onClick`, ni browser API → server component.

### 7.3 Streaming + Suspense

Para páginas con múltiples queries de distinta latencia:

```tsx
export default function Dashboard() {
  return (
    <>
      <FastMetrics />  {/* render inmediato */}
      <Suspense fallback={<MetricsSkeleton />}>
        <SlowMetrics />  {/* streamea cuando esté listo */}
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />
      </Suspense>
    </>
  )
}
```

---

## 8. Image, font y asset optimization

### 8.1 Imágenes

- **`next/image` siempre.** Nunca `<img>` raw excepto casos específicos documentados.
- **Formatos**: WebP/AVIF servidos por Next.js automáticamente con fallback.
- **Sizes responsivos**: `srcset` automático.
- **LQIP** (low quality image placeholder) o blurhash para hero images.
- **Storage**: Supabase Storage con transformaciones on-the-fly (quality, resize).

### 8.2 Fonts

- **`next/font`** para Newsreader, Inter, JetBrains Mono.
- **Subsetting**: solo glifos latinos extendidos (sin Cyrillic, sin CJK).
- **Display swap**: con FOUT controlado para evitar CLS.
- **Preload**: solo el peso 400 de Newsreader y 400 de Inter (los demás cargan diferidos).

### 8.3 Iconos

- **Tree-shakeable**: Lucide o Heroicons importados individualmente, no la librería completa.
- **Sprite SVG** para iconos custom de Slowcraft.
- Para Font Awesome (en mockups del UX Pilot): migrar a Lucide en v1.1 (per ARCHITECTURE).

### 8.4 Otros assets

- JS y CSS de terceros: **autohospedar** cuando sea posible (Cloudflare CDN nuestro = mejor caché).
- Excepciones: Stripe.js, PayPal SDK (deben cargarse desde sus dominios oficiales por seguridad y compliance).

---

## 9. Agent runs — performance asíncrono

### 9.1 Budgets por tipo

| Agente | Budget objetivo | Budget máximo |
|---|---|---|
| Generación de Brand Book completo | 60s | 120s |
| Performance & SEO Audit | 90s | 180s |
| Construcción inicial de sitio | 180s | 360s |
| Personalización de fork (theme + copy) | 60s | 180s |
| Generación de reporte PDF | 30s | 90s |

Si un run excede el budget máximo → alerta, investigación.

### 9.2 Optimización de costos por run

Cada run registra `cost_usd_estimated`. Reportes mensuales:

- Cost por run (median, p95).
- Cost por organización.
- Modelos más usados y su rendimiento (tokens / segundo).

Si el costo promedio por run sube > 20% mes-a-mes sin razón clara → investigación.

### 9.3 Concurrencia

- Inngest: máx 10 jobs concurrentes por organización.
- Si una org excede, los jobs adicionales se encolan FIFO.
- Plan Enterprise: límite 30 (3x).

---

## 10. Monitoring continuo

### 10.1 RUM (Real User Monitoring)

Posthog Web Analytics + Web Vitals plugin captura por usuario real:
- LCP, INP, CLS, FCP, TTFB.
- Por superficie, por country, por device.
- Dashboard semanal de tendencias.

### 10.2 Synthetic monitoring

Lighthouse CI corre en cada PR (preview) y en producción cada 6h:
- Comparación contra baseline.
- Si cae >10%, PR bloqueado o alerta de prod.

### 10.3 Server-side performance

- **Sentry Performance**: traces de cada request HTTP, queries de DB, calls a APIs externas.
- **Railway metrics**: CPU, memoria, request rate por servicio.
- **Supabase metrics**: connections, slow queries, cache hit rate.

### 10.4 Dashboards consolidados

Mission Control → tab "Health" muestra:
- Web Vitals last 7 days (Posthog data).
- Slow queries (Supabase log).
- Failed agent runs (agent_runs table).
- Error rate (Sentry).
- Uptime (Railway healthchecks).

---

## 11. Procedimiento ante regresión

Si los CI checks de performance fallan en una PR:

```
1. Identificar el commit que introdujo la regresión (Lighthouse diff).
2. Investigar la causa:
   - ¿Nueva dep pesada?
   - ¿Bundle no tree-shakeable?
   - ¿Server component convertido en client component?
   - ¿Query nueva sin índice?
3. Opciones:
   a. Optimizar (preferido).
   b. Lazy load / dynamic import.
   c. Mover lógica a server.
   d. Aceptar el costo si está justificado por valor — escalación a tech lead + actualización del budget en este documento.
4. Re-ejecutar CI hasta que pase.
```

Si la regresión llega a producción (no detectada en CI):

```
1. Si LCP > 4s o INP > 500ms en p75 — incident SEV-2.
2. Identificar deploy que la introdujo.
3. Rollback inmediato si la causa no es trivial.
4. Fix + redeploy en hotfix branch.
5. Postmortem: por qué CI no la detectó; agregar test que la hubiera detectado.
```

---

## Apéndice A — Herramientas de diagnóstico

```bash
# Bundle analyzer
ANALYZE=true pnpm build

# Lighthouse local
pnpm dlx lighthouse https://app.slowcraft.ai --view

# Bundle size check
pnpm dlx bundlesize

# Supabase EXPLAIN
psql $SUPABASE_DB_URL -c "EXPLAIN ANALYZE SELECT ..."

# Performance budget check (CI integration)
pnpm dlx @lhci/cli autorun
```

---

*PERFORMANCE.md · v1.0 · Mayo 2026 · Slowcraft Platform · Pilar no negociable*
