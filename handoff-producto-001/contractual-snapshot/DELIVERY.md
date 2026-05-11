# Slowcraft Platform — DELIVERY

> Qué entrega esta versión de la Plataforma. Qué incluye, qué se personalizó, qué no incluye.

**Versión documentada:** 0.1.0 (próxima a release)
**Estado:** Documentación lista, implementación en Fase 0

---

## 1. Naturaleza del entregable

A diferencia de los **Productos Slowcraft** (Brand Site, AI Chatbot, etc.) que son entregables transferibles al cliente, **la Plataforma misma NO se entrega a clientes**. Es:

- **IP permanente de Slowcraft** — no transferible, no vendible.
- **Infraestructura interna** — los clientes la usan a través de sus tres caras (Mission Control, Agency Hub, Client Portal) pero no reciben copia del código ni de la DB.
- **Operada exclusivamente por Slowcraft** — incluyendo deploys, migraciones, backups, monitoreo.

Este DELIVERY.md documenta qué está incluido en cada versión publicada de la Plataforma, principalmente para **trazabilidad interna** y para informar a clientes sobre nuevas capacidades disponibles.

---

## 2. Qué incluye la versión 0.1.0 (Fase 0 — Setup)

### 2.1 Infraestructura

- Monorepo Turborepo con 3 apps Next.js separadas.
- Supabase configurado en local + staging + production con RLS habilitada en todas las tablas.
- Railway con 3 environments (preview, staging, production).
- Cloudflare con DNS, wildcard SSL para `*.slowcraft.ai` y `*.preview.slowcraft.ai`.
- 4 GitHub Actions workflows funcionando (check, preview, staging, release).
- Semantic Release configurado en main.

### 2.2 Documentación

- Los 8 archivos contractuales completos en `platform-docs/`.
- README con quick start de 5 minutos.
- ARCHITECTURE con 15 secciones técnicas detalladas.
- RUNBOOK con playbook de setup paso a paso (15 pasos validados).
- .env.example con todas las variables documentadas.

### 2.3 Componentes y UI

- packages/tokens con CSS variables canónicas del DS v2.0.
- packages/ui con primer componente base (Button) + Storybook configurado.

### 2.4 Datos

- Schema inicial de DB con 18+ tablas (incluye tabla nueva `sites`).
- Seed data: Producto #001 (Brand Site) + Cliente #001 (Slowcraft).

### 2.5 Pagos

- Stripe configurado en TEST mode con multi-currency USD/MXN.
- PayPal configurado en Sandbox.
- Abstracción `packages/payments` con interfaz común.
- 4 productos creados en Stripe (Starter, Growth, Studio, Enterprise) — pricing concreto pendiente.

---

## 3. Qué NO incluye la versión 0.1.0

Funcionalidades que están planeadas pero no entran en la versión inicial:

- Auth funcional con login real (llega en Fase 1).
- Gestión de clientes desde Mission Control (Fase 1).
- Crear proyectos desde Agency Hub (Fase 2).
- Marketplace de productos en Client Portal (Fase 2).
- Theming whitelabel del Client Portal (Fase 3).
- Custom domains funcionales para clientes (Fase 3).
- Agent engine (Fase 4).
- CMS del Brand Site (Fase 5).
- Sistema de feedback loops (Fase 4 paralelo).
- Propagación de mejoras de templates (Fase 5).

Ver `PLAN_FASE_0.md` sección 11 para el roadmap completo de las 7 fases.

---

## 4. Personalizaciones específicas en esta versión

Esta sección se actualiza en cada release con cambios particulares al setup de Slowcraft:

### v0.1.0
- **Cliente seed:** Slowcraft mismo se registra como Cliente #001, plan Enterprise, modo Agency.
- **Producto seed:** Brand Site se registra como Product #001 con compatibility matrix abierta a Chatbot, Performance Audit y Custom Domain.
- **Subdominios reservados:** `app`, `hub`, `api`, `docs`, `cdn`, `bot`, `cnames`, `preview`, `storybook`, `admin`, `static` — no se asignan a clientes.

---

## 5. Compatibilidad

### 5.1 Compatible con

- Node.js 20.x, 21.x
- pnpm 9.x
- PostgreSQL 16.x (vía Supabase)
- Next.js 15.x
- macOS, Linux, Windows con WSL2

### 5.2 No compatible con

- Node.js < 20.
- Browsers sin soporte de ES2022 (todos los navegadores modernos lo soportan).
- IE11 (ni siquiera bromeando).

---

## 6. Métricas de la versión

Métricas que se reportan al cierre de cada versión mayor:

| Métrica | v0.1.0 (objetivo) | v0.1.0 (real) |
|---|---|---|
| Cobertura de tests unitarios | 60% | (pendiente medición) |
| Componentes en `packages/ui` | 5 | (pendiente) |
| Lighthouse score (mission-control) | 90+ | (pendiente) |
| Tamaño bundle inicial (gzip) | < 200 KB | (pendiente) |
| Tiempo de cold start (Next.js) | < 2s | (pendiente) |
| Tiempo de build completo del monorepo | < 3 min | (pendiente) |

Las métricas reales se llenan al ejecutar el Paso 15 del playbook de RUNBOOK.

---

## 7. Próximos entregables planeados

| Versión | Fase | Entregable principal | ETA |
|---|---|---|---|
| 0.2.0 | Fase 1 | Auth + Roles + ciclo base operacional | Junio 2026 |
| 0.3.0 | Fase 2 | Gestor de proyectos multi-tipo | Julio 2026 |
| 0.4.0 | Fase 3 | UI pulida + theming whitelabel + custom domains | Agosto 2026 |
| 0.5.0 | Fase 4 | Agent Engine + primer agente productivo | Septiembre 2026 |
| 0.6.0 | Fase 5 | Brand Site (Producto #001) en producción | Octubre 2026 |
| 1.0.0 | Fase 6 | Plataforma lista para conectar Producto #002 | Noviembre 2026 |

---

## 8. Cómo verificar que recibiste el entregable correcto

Para cada release, validar:

```bash
# 1. La versión publicada coincide con la esperada
gh release list --repo slowcraft-ai/platform | head -5

# 2. El CHANGELOG tiene una entrada para esta versión
grep -A 30 "## \[0.1.0\]" platform-docs/CHANGELOG.md

# 3. El gate de la fase está cerrado
# (ver checklist en RUNBOOK Paso 15)

# 4. Las migraciones aplicadas matchean el código
supabase migration list
# Comparar con infra/supabase/migrations/
```

Si algún check falla, abrir issue `incident` con la discrepancia.

---

*DELIVERY.md · v1.0 · Mayo 2026 · Slowcraft Platform*
