# Contractual snapshot — Plataforma Slowcraft

> Snapshot **congelado** de los archivos contractuales de la Plataforma Slowcraft tal como existían el **2026-05-10**.
> Estos archivos viven en el proyecto Cowork de la Plataforma, en `platform-docs/`. Esta es una copia portable.

**No edites estos archivos aquí.** Si necesitas cambios, pídeselos a Rodrigo para que se hagan en el proyecto de la Plataforma; después se regenera el snapshot completo.

---

## Qué hay aquí y para qué sirve cada archivo

| Archivo | Para qué lo necesitas en el Producto #001 |
|---|---|
| `ARCHITECTURE.md` | Entender los 3 componentes (Plataforma + Templates + Instances) y los 28 ADRs. Especialmente las decisiones de stack, multi-tenancy y portabilidad. |
| `CONVENTIONS.md` | Naming, idioma (inglés en código, español en docs, UI bilingüe es-MX/en), estructura de errores, manejo de IDs. |
| `SECURITY.md` | 10 reglas innegociables. Aplican al Template aunque sea de cara pública. Lee al menos las secciones de secrets, headers, y validación. |
| `PERFORMANCE.md` | Budgets de Core Web Vitals, bundle size, caching. Crítico para un landing — un sitio público que no cumpla esto no se puede deployar. |
| `PLUGINS.md` | Distingue plugins de Plataforma vs plugins del Brand Site/Template. Para el Producto #001 te importa el segundo set (GA4, GTM, Meta Pixel, etc.). |
| `DELIVERY.md` | Qué se entrega al cliente con cada producto. El Template debe diseñarse pensando en este modelo de entrega. |
| `ROADMAP.md` | Las 7 fases × 18 semanas del MVP. Te ubica en el tiempo y muestra cuándo la Plataforma necesita que el Producto #001 esté listo. |

---

## Orden de lectura sugerido

Si tienes 30 minutos: `ARCHITECTURE.md` (skim) → `CONVENTIONS.md` (completo) → `PERFORMANCE.md` (completo) → `PLUGINS.md` (completo).

Si tienes 2 horas: léelos todos en el orden de la tabla.

`ROADMAP.md` es referencia, no necesitas memorizarlo — consúltalo cuando necesites ubicar una decisión en el tiempo.

---

## Lo que NO está en este snapshot

- `README.md` de la Plataforma — no aplica al Producto #001.
- `RUNBOOK.md` — operaciones internas de la Plataforma, no las usas.
- `CHANGELOG.md` — historial de la Plataforma, no del Template.
- `MIGRATION.md` — cómo migrar la Plataforma; tú vas a escribir el `MIGRATION.md` del Template (cómo un cliente migra su instance).
- `.env.example` — env vars de la Plataforma. El Template necesita su propio `.env.example`.
- `PRICING.md` — paquetes comerciales. Solo necesitas saber que existen planes (Explora/Crece/Estudio/Enterprise) y que algunas features se activan según el plan; el detalle no te aplica todavía.

---

*Snapshot generado 2026-05-10. Si la fecha está más de un mes atrás, pide a Rodrigo un snapshot fresco.*
