# BRIEF — Producto #001 (Landing_Site) para el equipo del otro Cowork

> **Para Claude trabajando en el proyecto Cowork del Producto #001.**
> Este documento es autocontenido. Léelo completo antes de tocar código.
> Cuando termines, lee también los archivos en `contractual-snapshot/` que se referencian aquí.

**Versión del brief:** 1.0
**Fecha del snapshot:** 2026-05-10
**Owner:** Rodrigo Ladrón de Guevara (rladron@gmail.com)

---

## 1. Quién eres y qué tienes en frente

Estás trabajando en el proyecto Cowork del **Producto #001 — Landing_Site**, que actualmente vive en el repo [`rladron-rodia/landing_slowcraft`](https://github.com/rladron-rodia/landing_slowcraft). El landing **ya existe y está funcionando** — es el sitio público de Slowcraft hoy.

Tu trabajo es **evolucionar ese landing para que cumpla doble función**:

1. **Seguir funcionando como el sitio público de Slowcraft** (no romper nada).
2. **Convertirse en el primer Product Template de la Plataforma Slowcraft** (capacidad nueva).

Esto no es una migración de un día. Es una evolución por fases. La primera tarea concreta es una **auditoría de gap** (sección 8 de este brief). No empieces a refactorizar antes de entregar la auditoría.

---

## 2. La Plataforma Slowcraft en 60 segundos

**Slowcraft** es una consultoría boutique de estrategia con IA en Ciudad de México. La **Plataforma Slowcraft** es su sistema operativo interno: una fábrica donde el equipo configura, lanza y entrega productos digitales a clientes (sitios de marca, chatbots, audits) con ayuda de agentes IA.

La Plataforma se construye en un **proyecto Cowork separado del tuyo** ("Plataforma de Productos Slowcraft"). Tú no la tocas. Solo necesitas saber cómo conectarte a ella.

El ecosistema tiene **tres componentes**:

```
Componente 1 — PLATFORM (otro Cowork)
  Monorepo slowcraft-ai/platform · 3 apps Next.js + packages compartidos
  Mission Control + Agency Hub + Client Portal
                       │
                       │ instancia / configura / despliega
                       ▼
Componente 2 — PRODUCT TEMPLATES (Tú estás aquí 👋)
  Repos privados separados (uno por tipo de producto)
  product-landing-site ← TU REPO cuando evolucione
  product-ai-chatbot, product-perf-seo-audit (futuros)
                       │
                       │ fork por cliente
                       ▼
Componente 3 — CLIENT INSTANCES
  client-acme-landing, client-slowcraft-landing, ...
  Forks transferibles al cliente cuando lo solicite
```

El landing actual va a transitar de "sitio público de Slowcraft" a "**Template Landing_Site + Instance `client-slowcraft-landing`**" — el primer Template del catálogo. El equipo lo usará para:

- **Producción real:** sigue siendo el landing en `slowcraft.ai`.
- **Laboratorio:** donde se experimentan mejoras antes de propagarlas al Template.
- **Showcase comercial:** la mejor demo viva del producto que se vende.

Triple rol. Está documentado y es intencional.

---

## 3. La Plataforma: contexto operativo que necesitas

**No es** un CMS, un project manager, un marketplace, ni un sitio público. La Plataforma tiene **acceso siempre limitado**: solo administradores Slowcraft y clientes registrados. **El marketing vive fuera de la Plataforma**, en el Producto #001 (el sitio público).

Tres caras, un solo dominio raíz `slowcraft.ai`:

| Cara | URL | Audiencia |
|---|---|---|
| Mission Control | `app.slowcraft.ai` | Equipo Slowcraft (super admin) |
| Agency Hub | `hub.slowcraft.ai` | Consultores Slowcraft |
| Client Portal | `[slug].slowcraft.ai` o dominio del cliente | Cliente final |

**El landing público** vive en `slowcraft.ai` (raíz) o `www.slowcraft.ai`. Es la única cara del ecosistema con acceso público no autenticado.

---

## 4. El rol del Producto #001 (Landing_Site)

**Es el primer Product Template del catálogo.** Una vez evolucionado, otros clientes podrán recibir un fork de este Template para tener su propio sitio (`client-acme-landing`, `client-zeta-landing`, etc.).

**Funcionalidades obligatorias** que el Template debe ofrecer a cualquier cliente:

- Branding configurable por cliente (logo, paleta, tipografías) vía un único archivo `brand.config.ts` o equivalente.
- Contenido configurable (copy, secciones activables/desactivables) vía data files o CMS headless.
- Sistema de plugins de medición **activables sin tocar código**: GA4, GTM, Meta Pixel, Search Console, Hotjar — controlados por env vars del fork del cliente.
- Internacionalización es-MX (primario) + en (secundario) vía `packages/i18n` (cuando exista) o estructura compatible.
- Conexión opcional al `@slowcraft/product-sdk` para reportar a la Plataforma: deploys, métricas básicas, status. Opcional porque el sitio debe poder operar standalone también (si el cliente se lleva el fork).
- Compatibilidad con custom domains gestionados desde Cloudflare por la Plataforma.

**Funcionalidades NO obligatorias del Template** pero que son parte del fork de Slowcraft (`client-slowcraft-landing`): blog, casos de estudio, formularios de contacto. Estos pueden vivir en `client-slowcraft-landing` sin estar en el Template upstream — el Template es el mínimo común, no la suma de todas las features.

---

## 5. Stack tecnológico obligatorio

El Template debe correr en este stack (el mismo de la Plataforma, para reducir fricción de mantenimiento):

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSG + ISR para el sitio público |
| UI | React 19 + Tailwind v4 + shadcn/ui | Compatible con el DS v2.0 de Slowcraft |
| Tokens visuales | Design System Slowcraft v2.0 | Archivo canónico: `slowcraft_design_system_v2.html` (en el repo de Plataforma). Tokens consumibles vía `@slowcraft/tokens` cuando exista; mientras tanto, replicar CSS variables del DS v2.0 |
| Lenguaje | TypeScript estricto | No JS |
| Validación | Zod | Inputs, formularios, env vars |
| Email (si aplica) | Resend + React Email | Mismo proveedor que la Plataforma |
| Deploy | Railway o Cloudflare Pages | Cualquiera que soporte preview por PR + custom domains |
| CDN / DNS | Cloudflare | Custom domains se orquestan desde la Plataforma |
| Observabilidad | Sentry (errores) + Posthog (producto) | Mismos proyectos que la Plataforma cuando sea instance de Slowcraft |
| CI/CD | GitHub Actions | 4 workflows: check, preview, staging, release |
| Convenciones de commits | Conventional Commits | Semantic Release para el Template; instances no lo necesitan |

**Si el landing actual está construido en otro stack** (HTML estático, Astro, Vite, otro), eso lo identificas en la auditoría de gap y proponemos una ruta de migración por fases que **no rompa el sitio en producción** durante la transición.

---

## 6. Los contratos que el Template debe respetar

Estos son los puntos de integración con la Plataforma. Léelos en `contractual-snapshot/` y respétalos:

| Contrato | Archivo de referencia | Por qué importa |
|---|---|---|
| Arquitectura general | `contractual-snapshot/ARCHITECTURE.md` | Cómo encajan Plataforma + Templates + Instances; los 28 ADRs |
| Convenciones de código y docs | `contractual-snapshot/CONVENTIONS.md` | Inglés en código, español en docs, UI bilingüe es-MX/en, naming |
| Seguridad | `contractual-snapshot/SECURITY.md` | 10 reglas innegociables; aplican también al Template aunque sea público |
| Performance | `contractual-snapshot/PERFORMANCE.md` | Core Web Vitals budgets, bundle size — un landing debe ser fast |
| Sistema de plugins | `contractual-snapshot/PLUGINS.md` | Cuidado: hay DOS sistemas de plugins. Los del Template son los de medición (GA4, GTM, etc.) |
| Modelo de entrega | `contractual-snapshot/DELIVERY.md` | Qué se entrega al cliente, qué documentación viaja con el fork |
| Roadmap del MVP | `contractual-snapshot/ROADMAP.md` | En qué fase está la Plataforma; cuándo te necesita lista |

Adicionalmente, **todo Template debe tener sus propios 8 archivos contractuales** en `platform-docs/` del repo del Template:

```
README.md · ARCHITECTURE.md · RUNBOOK.md · CHANGELOG.md ·
DELIVERY.md · PLUGINS.md · MIGRATION.md · .env.example
```

El `MIGRATION.md` del Template es **crítico**: documenta cómo un cliente se lleva el fork si decide salir de Slowcraft. Es la promesa de portabilidad sin lock-in.

---

## 7. La regla de oro: no romper lo que funciona

El landing está **en producción ahora mismo** sirviendo `slowcraft.ai`. La evolución hacia Template no puede provocar downtime ni regresión visual durante la transición.

Reglas de juego:

- **Toda evolución va por feature branch + PR + preview deploy.** Nunca push directo a la rama de producción.
- **Antes de cada cambio estructural** (mover archivos, cambiar framework, refactorizar), confirma con Rodrigo el plan en una iteración corta. No asumas alcance.
- **Cada PR debe pasar `pnpm check`** (lint + types + tests) y tener un preview deploy navegable.
- **Las migraciones de stack se hacen en paralelo, no destructivamente.** Si el landing hoy está en X y migra a Next.js 15, primero levantas el Next.js 15 como sub-app o branch paralela, validas paridad visual, y solo cuando la paridad esté confirmada se hace el cutover.
- **Mantén dos diffs separados** en cada PR: cambios funcionales (lo que el usuario ve) vs cambios estructurales (lo que prepara el camino al Template). Esto facilita revertir si algo se rompe.

---

## 8. Tu primer entregable: auditoría de gap

**Antes de tocar nada del código**, entrega una auditoría de gap entre el landing actual y los contratos de la Plataforma. Este es el deliverable que Rodrigo necesita primero.

Estructura esperada del entregable (en un solo archivo `AUDITORIA_GAP.md` dentro del proyecto del Producto #001):

1. **Inventario actual del landing**
   - Stack actual (framework, build tool, lenguaje, hosting, dominio)
   - Estructura de carpetas
   - Páginas y rutas existentes
   - Sistema de styling actual y qué tan cerca está del DS v2.0
   - Plugins de medición activos hoy (GA, Meta Pixel, etc.)
   - Estado de i18n (si tiene)
   - Deploy actual (cómo y dónde)
   - Lo que está funcionando bien y vale la pena conservar

2. **Gaps vs los contratos de la Plataforma**
   Para cada contrato (stack, convenciones, security, performance, plugins, delivery), reporta:
   - ¿Qué falta?
   - ¿Qué hay pero no cumple el contrato?
   - ¿Qué hay y sí cumple?

3. **Priorización por riesgo**
   - **P0 — Bloqueantes para ser Template:** cambios sin los cuales no puede ser fork-eado.
   - **P1 — Necesarios para la primera instance Slowcraft:** lo que el sitio público necesita ya.
   - **P2 — Recomendados:** mejoras de calidad que pueden esperar.
   - **P3 — Nice-to-have:** ideas para más adelante.

4. **Plan de fases propuesto** (sin ejecutar todavía)
   - Fase A: preparación (no destructiva, sin riesgo de regresión).
   - Fase B: migración paralela (levantar el nuevo stack al lado del actual).
   - Fase C: cutover validado (paridad visual confirmada).
   - Fase D: extracción del Template (separar lo común de lo específico de Slowcraft).
   - Fase E: hardening + documentación contractual.

5. **Preguntas abiertas para Rodrigo**
   Cualquier decisión que no puedas tomar sola — no asumas.

**No hagas commits de código en esta fase.** Solo el archivo de auditoría.

---

## 9. Decisiones que ya están tomadas (no las cuestiones)

Estas vienen del Vision Document y los 28 ADRs de la Plataforma. Si tienes objeciones, levántalas con Rodrigo, no las ignores ni las re-decidas:

- **Código en inglés, documentación en español, UI bilingüe** (es-MX primario, en secundario).
- **Privado por defecto.** Repos privados. Sin open source.
- **Stack canónico:** Next.js 15 + Supabase + Railway + Cloudflare.
- **Pagos:** Stripe primario, multi-currency USD/MXN. PayPal alternativo. Esto aplica si el Template incluye paywall (no debería para un landing, pero por si acaso).
- **DS v2.0** es la fuente visual única. No improvises paletas.
- **Conventional Commits + Semantic Release** en repos de Template.
- **Acceso limitado** en la Plataforma; el landing es la única cara con acceso público no autenticado del ecosistema.
- **Portabilidad sin lock-in:** un cliente puede llevarse su fork con DB exportada y migración documentada. El Template debe diseñarse pensando en esto.

---

## 10. Glosario rápido

- **Plataforma** — el monorepo principal (otro proyecto Cowork), no la tocas.
- **Producto** — un tipo de entregable que la Plataforma sabe configurar y desplegar. Tú trabajas el Producto #001.
- **Template** — el repo upstream de un Producto (ej. `product-landing-site`). Lo que vas a construir.
- **Instance** — un fork del Template para un cliente específico (ej. `client-slowcraft-landing`). El landing actual va a convertirse en una de estas.
- **Landing_Site** — el nombre canónico del Producto #001.
- **Cliente** — la organización que recibe una instance. Slowcraft mismo es cliente #0.
- **Marca** — la identidad visual configurable por cliente (logo, colores, tipografías).
- **Modo** — Agency (lo opera Slowcraft) o Self-serve (lo opera el cliente). El Producto #001 puede ser cualquiera.
- **Plan** — paquete comercial (Explora, Crece, Estudio, Enterprise). Determina qué features se activan.

---

## 11. Cómo coordinar con el proyecto de la Plataforma

El proyecto Cowork de la Plataforma vive aparte. Rodrigo orquesta entre ambos. Cuando necesites algo del lado de la Plataforma:

- **Cambios en contratos** (env vars nuevas, schema del SDK, nuevos puntos de integración): pídeselos a Rodrigo, no los inventes.
- **Versión de los contratos**: este brief es snapshot del 2026-05-10. Si Rodrigo entrega una versión nueva del bundle (`v2.0`, etc.), reemplázala completa, no parchees.
- **Conflictos entre contratos** (algo en SECURITY.md contradice algo en PERFORMANCE.md): márcalo en el reporte, no decidas solo.

---

## 12. Qué leer después

En este orden:

1. `MENSAJE_INICIAL.md` (en esta misma carpeta) — el prompt con el que Rodrigo te arrancó. Re-léelo.
2. `contractual-snapshot/ARCHITECTURE.md` — los 28 ADRs y el modelo de tres componentes.
3. `contractual-snapshot/CONVENTIONS.md` — naming, idioma, errores.
4. `contractual-snapshot/PERFORMANCE.md` y `contractual-snapshot/SECURITY.md` — los pilares no negociables.
5. `contractual-snapshot/PLUGINS.md` — distinción entre plugins de Plataforma y plugins del Template.
6. `contractual-snapshot/DELIVERY.md` — qué se entrega al cliente.
7. `contractual-snapshot/ROADMAP.md` — para entender la urgencia y las dependencias.

---

*Brief generado desde el proyecto Cowork "Plataforma de Productos Slowcraft" · 2026-05-10*
