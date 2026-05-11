# Slowcraft Platform — Arquitectura

**Versión del documento:** 1.0
**Versión de la Plataforma:** 0.1.0
**Última actualización:** Mayo 2026

---

## Índice

1. [Principios arquitectónicos](#1-principios-arquitectónicos)
2. [Los tres componentes del ecosistema](#2-los-tres-componentes-del-ecosistema)
3. [Las tres caras de la Plataforma](#3-las-tres-caras-de-la-plataforma)
4. [Modelo de URLs y dominios](#4-modelo-de-urls-y-dominios)
5. [Stack tecnológico justificado](#5-stack-tecnológico-justificado)
6. [Schema de base de datos](#6-schema-de-base-de-datos)
7. [Multi-tenancy y aislamiento (RLS)](#7-multi-tenancy-y-aislamiento-rls)
8. [Modelo de roles y permisos](#8-modelo-de-roles-y-permisos)
9. [Agent Engine — síncrono y asíncrono](#9-agent-engine--síncrono-y-asíncrono)
10. [Estrategia de GitHub y forks](#10-estrategia-de-github-y-forks)
11. [Sistema de pagos (Stripe + PayPal)](#11-sistema-de-pagos-stripe--paypal)
12. [CI/CD y los cuatro environments](#12-cicd-y-los-cuatro-environments)
13. [Observabilidad y monitoreo](#13-observabilidad-y-monitoreo)
14. [Seguridad — reglas innegociables](#14-seguridad--reglas-innegociables)
15. [ADRs registrados](#15-adrs-registrados)

---

## 1. Principios arquitectónicos

Cinco principios que rigen todas las decisiones técnicas:

1. **Portabilidad sin lock-in.** Los productos del cliente se construyen con stacks estándar (Next.js, Astro, Postgres). Cada producto es un repo Git transferible al cliente con su DB exportable y documentación de migración. La Plataforma puede medir y mejorar, nunca aprisionar.

2. **Multi-tenancy con aislamiento de día 1.** RLS de PostgreSQL en todas las tablas, no como agregado posterior. Imposible que la organización A vea datos de la organización B, ni siquiera por error de aplicación.

3. **Separación entre IP permanente y entregables transferibles.** El monorepo de la Plataforma y los Product Templates son IP de Slowcraft. Las instances forkeadas por cliente son del cliente. Esa frontera es física (repos distintos), no convencional.

4. **Editorial sobre decorativo.** El producto es la operación, no la interfaz. La UI sirve a la operación, no se interpone. Densidad de información donde aplica, espacios respirados donde mejor.

5. **Cada decisión es revertible o documentada como ADR.** Si una decisión técnica no es trivial, queda como ADR (Architecture Decision Record). Ver sección 15.

---

## 2. Los tres componentes del ecosistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   COMPONENTE 1 — SLOWCRAFT PLATFORM                                  │
│   Repo: slowcraft-ai/platform (monorepo privado, IP permanente)      │
│                                                                      │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │ Mission Control  │  │   Agency Hub     │  │  Client Portal   │   │
│   │ app.slowcraft.ai │  │ hub.slowcraft.ai │  │[slug].slowcraft  │   │
│   │  (super admin)   │  │  (consultores)   │  │   (clientes)     │   │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
│   Backend compartido: Supabase (Postgres + Auth + Storage + RLS)     │
│   Packages: auth, ui, agent-engine, payments, github-engine, ...     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ instancia / configura / despliega / monitorea
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   COMPONENTE 2 — CATÁLOGO DE PRODUCT TEMPLATES                       │
│   Repos privados separados, IP permanente, NUNCA se transfieren      │
│                                                                      │
│   slowcraft-ai/product-brand-site                                    │
│   slowcraft-ai/product-ai-chatbot                                    │
│   slowcraft-ai/product-perf-seo-audit                                │
│   slowcraft-ai/product-... (uno por cada tipo de producto)           │
│                                                                      │
│   Cada uno: standalone, deployable, los 8 archivos contractuales,    │
│   product.config.ts con archetype + compatibility matrix.            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ fork por cliente (un fork por instancia activada)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   COMPONENTE 3 — PRODUCT RUNTIME INSTANCES                           │
│   Repos privados forkeados, transferibles al cliente bajo demanda    │
│                                                                      │
│   slowcraft-ai/client-acme-site (fork de product-brand-site)         │
│   slowcraft-ai/client-acme-chatbot (fork de product-ai-chatbot)      │
│   slowcraft-ai/client-[slug]-[producto] (patrón general)             │
│                                                                      │
│   Cada instancia: deployada en su URL Slowcraft, con su DB propia,   │
│   su admin, su CMS, su configuración del cliente.                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Por qué esta separación:**

- La Plataforma y los Product Templates son la **propuesta de valor de Slowcraft**. Son IP. Nunca salen.
- Las instances son **propiedad del cliente** (parcial al inicio, completa al transferir). El cliente paga por algo que es suyo, no por una licencia de uso. Esto es lo que diferencia a Slowcraft de Webflow, HubSpot CMS, Wix.

---

## 3. Las tres caras de la Plataforma

Tres apps Next.js separadas, no una app monolítica con rutas por rol (ADR 028).

**Postura clave:** la Plataforma **no es un sitio público**. No tiene signup abierto, no tiene blog, no tiene marketing. Las tres caras son herramientas operativas con acceso limitado a administradores Slowcraft y clientes registrados. El marketing y la captación viven fuera, en el sitio público de Slowcraft (que es una instance del Producto #001 Landing_Site, deployado como `client-slowcraft-landing`).

| App | URL | Audiencia | Stack y particularidades |
|---|---|---|---|
| **mission-control** | `app.slowcraft.ai` | Super admins Slowcraft | UX denso, dashboards business, audit log completo, gestión de productos del catálogo, gestión de billing global |
| **agency-hub** | `hub.slowcraft.ai` | Consultores Slowcraft | Workspace por proyecto, agent runs, deliverables, comunicación con cliente, ejecución de mode switch |
| **client-portal** | `[slug].slowcraft.ai` o dominio cliente | Cliente final | Whitelabel completo (logo, colores, fuentes, favicon), modo dual (Agency = solo lectura · Self-serve = marketplace + configuración) |

**¿Por qué 3 apps separadas y no una con roles?**

- **Seguridad:** una vulnerabilidad en client-portal no debe poder escalar a mission-control.
- **Performance:** Mission Control carga muchísimos datos; Client Portal debe ser ligero y rápido.
- **Iteración independiente:** el equipo puede deployar Agency Hub sin tocar Client Portal.
- **Theming:** Client Portal renderiza con tema del cliente; Mission Control siempre Slowcraft.
- **Bundle size:** cada app envía solo el JS que necesita su audiencia.

Comparten:
- Misma DB Supabase.
- Mismos `packages/*`.
- Misma autenticación (Supabase Auth) — pero providers distintos según contexto.

---

## 4. Modelo de URLs y dominios

Tres niveles de dominio para los productos del cliente, además de los dominios de la Plataforma.

### 4.1 Dominios de la Plataforma

| Dominio | Uso |
|---|---|
| `slowcraft.ai` | Landing pública (es Product #001 del catálogo, instancia "slowcraft") |
| `app.slowcraft.ai` | Mission Control + admin de productos en `app.slowcraft.ai/[slug]/admin` |
| `hub.slowcraft.ai` | Agency Hub |
| `api.slowcraft.ai` | API pública para integraciones (opcional, fase posterior) |
| `docs.slowcraft.ai` | Documentación pública de productos y SDK |

### 4.2 Dominios de productos del cliente

| Nivel | Patrón | Cuándo |
|---|---|---|
| Staging del producto | `[slug].preview.slowcraft.ai` | Auto-generado, siempre disponible para QA y aprobación |
| Subdominio default | `[slug].slowcraft.ai` | Incluido en todos los planes, sin costo extra |
| Custom Domain | `miempresa.com` del cliente | Add-on de pago en Starter/Growth · incluido en Studio/Enterprise |

**Decisión clave (ADR 022):** el admin del producto **siempre** vive en `app.slowcraft.ai/[slug]/admin`, sin importar dónde apunte el dominio público. Esto desacopla seguridad (admin centralizado en infra Slowcraft) de propiedad (sitio público en dominio del cliente). El cliente puede migrar el dominio sin perder acceso al admin.

### 4.3 Custom Domain — flujo técnico

```
Cliente trae: miempresa.com
  ↓
Plataforma genera CNAME target: miempresa-acme.cnames.slowcraft.ai
  ↓
Cliente configura CNAME en su DNS provider
  ↓
Cloudflare detecta el CNAME y emite SSL automático (Let's Encrypt)
  ↓
La Plataforma verifica via API de Cloudflare → marca dominio como "verified"
  ↓
El sitio del cliente queda servido en miempresa.com con HTTPS
```

Implementación: `packages/github-engine` + Cloudflare API.

---

## 5. Stack tecnológico justificado

### Frontend y monorepo

| Decisión | Razón |
|---|---|
| **Next.js 15 (App Router)** | Server components, server actions, streaming, edge runtime. Estándar de mercado para SaaS. |
| **React 19** | Última estable, server components nativos, mejor compilation. |
| **Tailwind v4** | Performance superior, JIT, CSS variables nativas — perfecto para theming dinámico. |
| **shadcn/ui** | Componentes copiables (no librería), control total. |
| **Turborepo + pnpm workspaces** | Cache nativo de builds, DX superior, instalación 3x más rápida que npm. |
| **TypeScript estricto** | `strict: true` en `tsconfig.json` base. Sin `any` excepto justificación documentada. |

### Backend y datos

| Decisión | Razón |
|---|---|
| **Supabase (Auth + PostgreSQL + Storage + RLS)** | Open source, PostgreSQL real (no NoSQL), RLS nativa, generación de tipos TypeScript. ADR 002. |
| **Tipos generados de Supabase** | `supabase gen types typescript > packages/database/types.ts` — single source of truth. |
| **Server Actions de Next.js** | Para mutaciones síncronas. Type-safe end-to-end sin tRPC. |
| **API Routes de Next.js** | Para webhooks (Stripe, Inngest, GitHub, Cloudflare). |
| **Inngest (asíncrono MVP)** | Serverless, sin workers dedicados, gratis hasta escala. ADR 025. Migración a BullMQ + Redis en escala. |
| **Zod** | Validación de inputs en server actions, env vars y formularios. |

### Infraestructura

| Decisión | Razón |
|---|---|
| **Railway** | Multi-environment nativo, precio predecible, no vendor lock-in (deploys con Dockerfile). ADR 004. |
| **Cloudflare** | DNS, CDN, SSL automático, custom domains, DDoS protection. |
| **Upstash Redis** | Serverless Redis para rate limiting y caché de sesiones. |
| **Resend + React Email** | Templates en React, alta deliverability, DX superior a SendGrid. |
| **Sentry** | Error tracking por ambiente. |
| **Posthog** | Product analytics (eventos, funnels, feature flags si llega el momento). |

### Pagos

| Decisión | Razón |
|---|---|
| **Stripe (primario)** | Multi-currency USD/MXN nativo, OXXO + SPEI para Mexico, subscription items robustos. |
| **PayPal (alternativo)** | Reconocimiento del consumidor, alternativa al cobro con tarjeta, útil en LATAM. |
| **Abstracción `packages/payments`** | Interfaz común para que el resto del código no conozca el gateway. |

---

## 6. Schema de base de datos

Fuente autoritativa: visión §VI. Aquí el resumen estructurado por dominio.

### 6.1 Dominio: Identidad y organizaciones

```sql
profiles            -- Identidad central de usuarios (extiende auth.users de Supabase)
clients             -- Empresas/marcas que contratan Slowcraft
organizations       -- Workspace de un cliente (con client_mode, plan, theme)
memberships         -- Usuarios dentro de una organización (con rol)
invitations         -- Invitaciones pendientes de miembros
```

Campos clave:
```sql
organizations.client_mode          = 'agency' | 'self_serve'
organizations.plan                 = 'starter' | 'growth' | 'studio' | 'enterprise'
organizations.theme                jsonb (logo, colors, fonts del whitelabel)
organizations.mode_switched_at     timestamptz
organizations.mode_switched_by     uuid → profiles
```

### 6.2 Dominio: Catálogo y proyectos

```sql
products            -- Catálogo de tipos de producto (Brand Site, Chatbot, Audit, etc.)
modules             -- Módulos activables por producto (delivery types)
projects            -- Proyectos de un cliente (instancia comercial)
deliverables        -- Entregables versionados de cada proyecto
```

Campos clave:
```sql
products.archetype                 = 'digital_presence' | 'operative_agent' | 'intelligence'
products.version                   semver string (ej. '1.2.0')
products.base_config               jsonb (compatible_addons, available_as_addon, etc.)
```

### 6.3 Dominio: Agentes IA

```sql
agent_runs          -- Ejecuciones de agentes IA (inputs, outputs, status, tokens consumidos)
```

### 6.4 Dominio: Productos activados (instances) y CMS del Brand Site

```sql
product_instances   -- Productos activados para una org (apunta a su repo, su deploy URL, su DB)
sites               -- Sitios construidos sobre product_instances de tipo brand-site
site_sections       -- Secciones editables del CMS
site_assets         -- Assets (logo, imágenes) del CMS
site_plugins        -- Plugins de medición activos por sitio
```

Schema concreto del CMS (`sites`, `site_sections`, `site_assets`, `site_plugins`) detallado en `PLAN_FASE_0.md` sección 1, será materializado como migración SQL inicial.

### 6.5 Dominio: Add-ons, billing y consumo

```sql
product_addons      -- Add-ons activos vinculados a producto base (con stripe_item_id)
subscriptions       -- Suscripciones activas (Stripe + PayPal)
invoices            -- Facturas emitidas
usage_records       -- Registro de consumo variable por uso (mensajes chatbot, agent runs, storage)
```

### 6.6 Dominio: Repos GitHub y propagación

```sql
github_repos        -- Repos GitHub asociados a proyectos y product_instances
template_updates    -- Propagaciones de mejoras de templates a forks (severity, status)
```

Campos clave:
```sql
github_repos.is_transferred        boolean
github_repos.transferred_at        timestamptz
github_repos.transferred_to        text (cuenta/org GitHub del cliente)

template_updates.severity          = 'patch' | 'minor' | 'major'
template_updates.status            = 'pending' | 'applied' | 'dismissed'
```

### 6.7 Dominio: Auditoría

```sql
audit_log           -- Trazabilidad completa de acciones críticas
```

Eventos auditados obligatoriamente:
- Mode switch (Agency ↔ Self-serve)
- Invitar / eliminar miembro de organización
- Aprobar entregable
- Cambios de billing (upgrade/downgrade/cancel)
- Repo transfer al cliente
- Cambios en agentes en producción

### 6.8 Migraciones

Convención: `infra/supabase/migrations/NNNN_descripcion.sql`. Aplicadas con `supabase db push` o GitHub Actions.

**Regla absoluta:** todas las migraciones son backward-compatible. No se ejecutan migraciones destructivas en producción sin un período de transición de al menos 1 semana con campos en paralelo.

---

## 7. Multi-tenancy y aislamiento (RLS)

PostgreSQL RLS (Row Level Security) habilitada en **todas** las tablas con datos de tenant (es decir, todas excepto `products` y `modules` que son catálogo global).

### Patrón general de policy

```sql
-- Ejemplo: política para tabla projects
CREATE POLICY "members can read their org's projects"
ON projects FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM memberships
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "org admins can write their org's projects"
ON projects FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM memberships
    WHERE profile_id = auth.uid()
      AND role IN ('org_owner', 'org_admin')
  )
);
```

### Test obligatorio en Fase 1

Test E2E que crea dos organizations A y B, cada una con su data, y verifica:
- User de A intenta leer projects de B → vacío.
- User de A intenta escribir en projects de B → error 403.
- Service role bypass habilitado solo para jobs de backend (nunca expuesto al cliente).

### Service role key

`SUPABASE_SERVICE_ROLE_KEY` solo usado en:
- Server Actions y API Routes (server-side)
- Inngest workers
- Scripts de migración y seed

**Nunca** en código cliente, **nunca** en logs, **nunca** en respuestas HTTP.

---

## 8. Modelo de roles y permisos

Cuatro niveles de roles, con jerarquía clara.

### 8.1 Nivel Plataforma (Slowcraft interno)

```
super_admin       Control total. Solo founders Slowcraft.
platform_admin    Gestión de productos y clientes. Equipo interno.
```

### 8.2 Nivel Organización (cliente)

```
org_owner         Dueño del tenant. Gestiona billing y miembros.
org_admin         Admin delegado. Gestiona miembros sin tocar billing.
org_member        Miembro activo del equipo del cliente.
```

### 8.3 Nivel Usuario Final (B2C, cuando se abra al público)

```
pro_user          Plan de pago. Acceso completo.
free_user         Plan gratuito. Acceso limitado.
guest             No autenticado. Solo lectura pública.
```

### 8.4 Nivel Recurso (granular por entregable, sitio, agente)

```
owner             CRUD completo.
editor            Leer + editar.
commenter         Leer + comentar.
viewer            Solo lectura.
```

### 8.5 Auth providers

| Contexto | Providers |
|---|---|
| Mission Control + Agency Hub | Email/password + Google |
| Client Portal B2B | Magic Link + Google + SAML (Enterprise) |
| Client Portal B2C (futuro) | Google + Apple + Magic Link |
| Productos para devs (futuro) | GitHub + Google |

---

## 9. Agent Engine — síncrono y asíncrono

### Regla de los 5 segundos

Si una tarea agéntica tarda **menos de 5 segundos** → síncrono (Server Action).
Si tarda **más de 5 segundos** → asíncrono (Inngest).

### 9.1 Síncrono — Server Actions

| Caso de uso | Tiempo esperado |
|---|---|
| Validación de dominio | < 2s |
| Preview de tema en tiempo real | < 1s |
| Generación de copy corto (1-2 párrafos) | < 4s |
| Búsqueda en knowledge base | < 2s |

### 9.2 Asíncrono — Inngest

| Caso de uso | Tiempo esperado |
|---|---|
| Generación del Brand Book completo (PDF) | 30-90s |
| Performance & SEO Audit completo | 60-180s |
| Construcción inicial del sitio | 120-300s |
| Personalización del fork GitHub | 60-180s |
| Generación de reportes PDF | 30-120s |

### 9.3 UX del asíncrono

- Usuario ve estado **"En proceso"** con progreso vía **Supabase Realtime** (subscription a `agent_runs.status`).
- Cuando termina: notificación in-app + email vía Resend.
- Si falla: error categorizado (`temporary` se reintenta, `permanent` notifica al consultor).

### 9.4 Migración a BullMQ + Redis

Cuando las colas superen ~500 jobs/día, migración a BullMQ + Redis dedicado. La interfaz de `agent-engine` abstrae el motor — cambio transparente.

### 9.5 Control de costos

Cada `agent_run` registra:
- `tokens_input`, `tokens_output`, `tokens_total`
- `model_used` (claude-sonnet-4, claude-opus-4, gpt-4o, etc.)
- `cost_usd_estimated` (calculado por modelo)

Mission Control alerta si una organización excede su budget mensual configurado. Permite ajuste manual del límite por consultor/super admin.

---

## 10. Estrategia de GitHub y forks

### 10.1 Estructura de repos

```
GitHub Org: slowcraft-ai (privada)

REPOS PERMANENTES (IP de Slowcraft, NUNCA se transfieren)
├── platform                   # este monorepo
└── (futuro) infrastructure    # IaC, scripts ops globales

PRODUCT TEMPLATES (privados, IP permanente)
├── product-brand-site
├── product-ai-chatbot
├── product-perf-seo-audit
└── product-...

INSTANCIAS DE CLIENTES (privados al inicio, transferibles)
├── client-acme-site           # fork de product-brand-site
├── client-acme-chatbot        # fork de product-ai-chatbot
└── client-[slug]-[producto]   # patrón general
```

### 10.2 Flujo de entrega de un producto

```
1. Consultor activa Producto#001 (Brand Site) para Cliente Acme en Agency Hub
   ↓
2. github-engine forkea: slowcraft-ai/product-brand-site → slowcraft-ai/client-acme-site
   ↓
3. Agente personaliza el fork (theme, copy, config) — commits quedan en el fork
   ↓
4. CI/CD del fork (heredado del template) deploya a acme-site.preview.slowcraft.ai
   ↓
5. Consultor revisa, aprueba — promote a acme-site.slowcraft.ai (production)
   ↓
6. Agente genera/verifica los 8 archivos contractuales (README, MIGRATION, etc.)
   ↓
7. Cuando el cliente solicita transfer: github-engine ejecuta repo transfer
   ↓
8. El cliente recibe: código + DB exportada + checklist de DNS/SSL
```

### 10.3 Propagación de mejoras de templates

Cuando un template sube de versión, `github-engine` automáticamente:

```
1. Detecta release semver del template (ej. product-brand-site v1.2.0 → v1.3.0)
2. Para cada fork activo (client-*-site):
   ├── Genera diff de cambios
   ├── Crea PR en el fork con:
   │   ├── Título: "feat: actualización a brand-site v1.3.0"
   │   ├── Descripción: changelog en español
   │   └── Severidad calculada: patch / minor / major
   └── Notifica al consultor en Mission Control
3. Comportamiento por severidad:
   ├── patch (1.0.X)      → auto-merge tras CI verde (configurable)
   ├── minor (1.X.0)      → requiere aprobación del consultor
   └── major (X.0.0)      → alerta crítica + revisión obligatoria
```

**Nunca forzado. Siempre auditado.** Cada decisión queda en `template_updates`.

---

## 11. Sistema de pagos (Stripe + PayPal)

### 11.1 Stripe (primario)

- Multi-currency USD + MXN nativo.
- Subscription items: cada add-on es un subscription item.
- OXXO + SPEI integrados.
- Webhooks: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`.
- Test mode + production mode con keys separadas (regla §14: `sk_live_*` SOLO en producción).

### 11.2 PayPal (alternativo)

- Soportado para clientes que prefieren PayPal sobre tarjeta de crédito.
- Útil para LATAM (PayPal está bien establecido).
- PayPal Subscriptions API para recurrencia.
- Webhooks: `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`, etc.

### 11.3 Abstracción `packages/payments`

```typescript
interface PaymentProvider {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>
  createSubscription(input: SubscriptionInput): Promise<Subscription>
  cancelSubscription(subscriptionId: string): Promise<void>
  handleWebhook(payload: unknown, signature: string): Promise<WebhookEvent>
  ...
}

class StripeProvider implements PaymentProvider { ... }
class PayPalProvider implements PaymentProvider { ... }

// El resto del código:
const provider = getPaymentProvider(organization.preferred_gateway)
await provider.createCheckoutSession(...)
```

### 11.4 Modelo de monetización (4 niveles)

1. **Suscripción base** — el plan elegido (Starter/Growth/Studio/Enterprise). MRR predecible.
2. **Add-ons transversales** — productos sobre productos (Chatbot encima de Brand Site). Subscription items.
3. **Servicios recurrentes** — Performance Audit mensual, mantenimiento. MRR adicional.
4. **Consumo por uso** — `usage_records` para mensajes de chatbot sobre el límite, agent runs adicionales, storage. Cobrado al final del mes vía Stripe meters / PayPal invoicing.

---

## 12. CI/CD y los cuatro environments

### 12.1 Environments

```
LOCAL → PREVIEW → STAGING → PRODUCTION

Local:    Docker + Supabase local · seeds de desarrollo
Preview:  Por cada PR · URL única · DB de preview · integration tests
Staging:  Espejo exacto de producción · E2E tests · Stripe TEST keys
Prod:     Usuarios reales · Canary deploy · Rollback automático
```

### 12.2 Workflows GitHub Actions

```
.github/workflows/
├── check.yml      → Lint + types + unit tests · ~3 min · por cada push
├── preview.yml    → Deploy preview por PR · ~5 min · comenta URLs en el PR
├── staging.yml    → Migraciones + deploy staging · E2E tests · ~10 min · al merge a develop
└── release.yml    → Semantic Release + canary deploy + healthchecks · al merge a main
```

### 12.3 Canary deploy (release.yml)

```
1. Migraciones ANTES del deploy (siempre backward-compatible)
2. Deploy canary: 10% de tráfico a la nueva versión
3. Health checks por 5 minutos
4. Si error rate > 1% → rollback automático
5. Si OK → ramp up a 100%
6. Notificación al equipo (Slack)
```

---

## 13. Observabilidad y monitoreo

### 13.1 Errores: Sentry

- Tres proyectos Sentry: mission-control, agency-hub, client-portal.
- Source maps subidos en cada release.
- Alertas: error rate > 1%, errores nuevos en producción.

### 13.2 Producto: Posthog

- Eventos clave: signup, mode_switch, project_created, agent_run_completed, deliverable_approved, subscription_changed.
- Funnels: del signup a la primera aprobación de entregable.
- Feature flags (futuro, cuando se necesiten).

### 13.3 Infraestructura: Railway dashboards

- CPU, memoria, request rate por servicio.
- Logs centralizados con búsqueda.
- Alertas en restart loops o memory leaks.

### 13.4 Agentes: tabla `agent_runs`

- Cada run registra duración, tokens consumidos, costo estimado, status.
- Dashboard en Mission Control con queries agregadas.
- Alerta si una organización excede su budget de tokens del mes.

---

## 14. Seguridad — reglas innegociables

1. `SUPABASE_SERVICE_ROLE_KEY` — nunca en código cliente, nunca en logs, nunca en respuestas HTTP.
2. **Permisos en 3 capas siempre:** UI (esconder botones) + Server Action / API (validar) + RLS en PostgreSQL (último resort).
3. **RLS habilitada en todas las tablas con datos de tenant** desde el inicio. Sin excepciones.
4. **Audit log obligatorio en:** mode switch · invitar · eliminar · aprobar entregable · cambios de billing · transfer de repo · cambios en agentes en producción.
5. **Stripe `sk_live_*` SOLO en producción.** Nunca en staging, nunca en preview, nunca local.
6. **Migraciones backward-compatible siempre.** Migraciones ejecutan ANTES del deploy.
7. **Secrets solo en GitHub Secrets y Railway env vars.** Nunca en el repo.
8. **Tokens de PayPal y Stripe webhook signing** validados en cada webhook recibido.
9. **CORS estricto** en API routes — solo dominios Slowcraft permitidos.
10. **Rate limiting** en endpoints públicos (login, signup, webhooks) vía Upstash Redis.

---

## 15. ADRs registrados

Resumen de los 28 ADRs documentados en `SLOWCRAFT_VISION_DOCUMENT.md` Parte IX.

Los ADRs no se cambian, solo se superseden. Si una decisión cambia, se crea un nuevo ADR que referencia al anterior y explica por qué.

| # | Decisión |
|---|---|
| 001 | Turborepo monorepo |
| 002 | Supabase como BaaS |
| 003 | pnpm workspaces |
| 004 | Railway para deploy |
| 005 | Expo para mobile (fase posterior) |
| 006 | RLS en PostgreSQL |
| 007 | Resend para emails |
| 008 | Semantic Release |
| 009 | Canary deploy |
| 010 | Theme engine vía CSS vars |
| 011 | Feature flags en código |
| 012 | 4 environments |
| 013 | 3 arquetipos de producto |
| 014 | Add-ons como productos transversales (subscription items) |
| 015 | Compatibility matrix en product.config.ts |
| 016 | Widget embebible del chatbot |
| 017 | Repos por producto separados del monorepo |
| 018 | Fork de template por cliente |
| 019 | MIGRATION.md obligatorio |
| 020 | notify.yml post-transferencia |
| 021 | packages/github-engine separado |
| 022 | Admin del sitio en `app.slowcraft.ai/[slug]/admin` siempre |
| 023 | Custom Domain como add-on de negocio |
| 024 | Agentes híbridos síncrono/asíncrono |
| 025 | Inngest para MVP asíncrono |
| 026 | CMS custom sobre Supabase |
| 027 | PR opcional + versión semántica para propagar mejoras |
| 028 | 3 apps Next.js separadas (no una app con roles) |

ADRs adicionales propuestos para Fase 0 (pendientes de aprobación):

| # | Decisión |
|---|---|
| 029 | Stripe primario + PayPal alternativo, abstraídos en `packages/payments` |
| 030 | Tabla `sites` agregada al schema (intermedia entre projects y site_sections) |
| 031 | Setup de keys vía script interactivo `scripts/setup.sh` (nunca en chat ni screenshots) |

---

*ARCHITECTURE.md · v1.0 · Mayo 2026 · Slowcraft Platform*
