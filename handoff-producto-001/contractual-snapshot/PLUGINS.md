# Slowcraft Platform — PLUGINS

> Sistema de plugins, feature flags y extensibilidad de la Plataforma.

**Versión:** 1.0
**Última actualización:** Mayo 2026

---

## 1. Aclaración importante

Existen **dos sistemas de plugins distintos** en el ecosistema Slowcraft. No confundirlos:

### 1.1 Plugins de la Plataforma (este documento)

Extensiones de la Plataforma misma — funcionalidades opcionales activables por organización o por plan. Implementadas como **feature flags estáticos en código** (ADR 011). Ejemplo: habilitar PayPal como gateway alternativo, habilitar custom domains, habilitar el agent engine.

### 1.2 Plugins del Brand Site (otro documento)

Plugins de medición que el cliente activa en su sitio Brand Site sin tocar código (GA4, GTM, Search Console, Meta Pixel, Hotjar, etc.). Documentados en el `PLUGINS.md` del repo `product-brand-site`, no acá.

---

## 2. Sistema de feature flags de la Plataforma

### 2.1 Filosofía

- Flags **en código**, no en servicio externo (ADR 011). Sin LaunchDarkly ni Unleash en el MVP.
- Flags como variables de entorno, leídas en build time o runtime según el caso.
- Flags categorizados por scope: global, por plan, por organización, por modo (Agency/Self-serve), por ambiente.

### 2.2 Cómo se definen

```typescript
// packages/feature-flags/src/index.ts
export const flags = {
  // Globales (env-based)
  paypalEnabled: process.env.FEATURE_PAYPAL_ENABLED === 'true',
  customDomainEnabled: process.env.FEATURE_CUSTOM_DOMAIN_ENABLED === 'true',
  agentEngineEnabled: process.env.FEATURE_AGENT_ENGINE_ENABLED === 'true',

  // Por plan (función)
  marketplaceVisible: (plan: Plan) =>
    plan === 'starter' || plan === 'growth' ||
    (plan === 'studio' && true) || // condicional adicional
    plan === 'enterprise',

  // Por modo
  selfServeFeatures: (mode: ClientMode) => mode === 'self_serve',

  // Por organización (DB-based, leído de organizations.feature_overrides)
  customFlag: (org: Organization, flagName: string) =>
    org.feature_overrides?.[flagName] ?? false,
}
```

### 2.3 Cómo se consumen

```typescript
import { flags } from '@slowcraft/feature-flags'

// En componentes y server actions
if (flags.paypalEnabled) {
  // mostrar opción PayPal en checkout
}

if (flags.marketplaceVisible(currentOrg.plan)) {
  // renderizar marketplace
}
```

---

## 3. Catálogo actual de plugins/flags de la Plataforma

| Flag | Default | Habilitado en | Descripción |
|---|---|---|---|
| `paypalEnabled` | true | local, staging, production | Habilitar PayPal como gateway alternativo a Stripe |
| `customDomainEnabled` | false | (Fase 3+) | Habilitar configuración de dominios custom para clientes |
| `agentEngineEnabled` | false | (Fase 4+) | Habilitar el motor de agentes asíncronos (Inngest) |
| `marketplaceVisible` | función | starter, growth, studio, enterprise | Mostrar marketplace en Client Portal |
| `selfServeFeatures` | función | mode=self_serve | Habilitar onboarding guiado por IA, configuración autónoma |
| `cmsAccessForClient` | false | (Fase 5+) | Permitir al cliente editar el CMS desde Client Portal (no solo consultor) |
| `templatePropagationEnabled` | false | (Fase 5+) | Habilitar PRs automáticos de mejoras de templates a forks |
| `mobileAppsEnabled` | false | (Fase posterior al MVP) | Habilitar apps Expo |
| `multiCurrencyDisplay` | true | global | Mostrar precios en USD y MXN según geolocalización |

---

## 4. Sistema de extensión: cuando agregar un nuevo flag

### Cuándo SÍ usar un flag

- **Roll-out gradual:** funcionalidad nueva que se quiere probar en staging antes de producción.
- **Diferenciación por plan:** funcionalidad que solo existe en planes premium.
- **Killswitch:** funcionalidad nueva que se puede desactivar rápidamente si causa problemas.
- **A/B testing:** comparar dos versiones de un flow.

### Cuándo NO usar un flag

- **Cambios obvios y de bajo riesgo:** un fix de typo no necesita flag.
- **Cuando el flag se va a quedar para siempre:** si nunca se va a quitar, mejor que sea código directo o una columna de DB.
- **Para configuración de cliente:** eso va en `organizations.config`, no en flags.

### Cómo agregar un flag nuevo

1. Agregar la definición en `packages/feature-flags/src/index.ts`.
2. Agregar la env var en `platform-docs/.env.example` con default seguro (false).
3. Agregar entrada en este documento (sección 3).
4. Configurar la env var en cada Railway environment según corresponda.
5. Documentar en CHANGELOG.

### Cómo retirar un flag

1. Confirmar que la funcionalidad lleva ≥ 30 días estable en producción al 100%.
2. Eliminar la condición del código (asume `true`).
3. Eliminar la definición de `packages/feature-flags`.
4. Eliminar la env var de Railway en todos los environments.
5. Eliminar la entrada de este documento.
6. Documentar en CHANGELOG (`refactor: remove FEATURE_X flag`).

---

## 5. Sistema de plugins MCP (futuro)

Cuando la Plataforma necesite integraciones con servicios externos no anticipados (Slack, Notion, Linear, etc.), se evaluará un sistema de **MCP (Model Context Protocol)** para:

- Permitir a consultores conectar sus propias herramientas a la Plataforma.
- Permitir a clientes conectar integraciones a sus productos.
- Mantener la portabilidad — los MCPs se desactivan al transferir un producto.

Esta evaluación está en backlog para Fase 6+. No es parte del MVP.

---

## 6. Plugins por producto vs plugins por Plataforma

| Tipo | Ejemplo | Vive en | Documentado en |
|---|---|---|---|
| Plugin de Plataforma | PayPal alternativo, Custom Domain | `packages/feature-flags` | Este documento |
| Plugin de Brand Site | GA4, GTM, Meta Pixel | `products/brand-site/plugins/` | `product-brand-site/PLUGINS.md` |
| Plugin de Chatbot (futuro) | Integración con Calendly, Salesforce | `products/ai-chatbot/integrations/` | `product-ai-chatbot/PLUGINS.md` |
| MCP del consultor (futuro) | Slack, Notion | `packages/mcp-registry` (futuro) | TBD |

---

## 7. Auditoría de flags en producción

Cada cambio en flags de producción queda en `audit_log`:

```sql
INSERT INTO audit_log (event, actor_id, target_type, target_id, metadata)
VALUES (
  'feature_flag_changed',
  '<super_admin_id>',
  'platform',
  null,
  '{"flag": "agentEngineEnabled", "from": false, "to": true, "environment": "production"}'::jsonb
);
```

Reporte semanal automático: cambios de flags en los últimos 7 días, enviado a #engineering en Slack.

---

*PLUGINS.md · v1.0 · Mayo 2026 · Slowcraft Platform*
