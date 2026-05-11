# Slowcraft Platform — CONVENTIONS

> Convenciones canónicas de idioma, naming y estilo. Aplican a la Plataforma y a todos los Productos.
>
> **Si tienes duda sobre cómo nombrar algo, consulta este documento primero.**

**Versión:** 1.0
**Última actualización:** Mayo 2026

---

## 1. Convención de idiomas

La Plataforma se construye con dos idiomas en mente desde día uno: **español como idioma primario** (mercado principal LATAM) e **inglés como secundario** (clientes internacionales y portabilidad técnica).

### 1.1 Tabla maestra de qué va en qué idioma

| Categoría | Idioma | Ejemplos |
|---|---|---|
| **Folders y file paths** | **Inglés** | `apps/mission-control/`, `packages/agent-engine/` |
| **Code identifiers** (vars, functions, classes, types) | **Inglés** | `getUserOrganizations()`, `ClientMode`, `useAuth()` |
| **DB tables y columns** | **Inglés** | `organizations`, `client_mode`, `mode_switched_at` |
| **DB enums values** | **Inglés** | `'agency' \| 'self_serve'`, `'in_progress' \| 'approved'` |
| **Slugs y URL segments** | **Inglés** | `/admin/clients`, `plan = 'starter'`, `archetype = 'digital_presence'` |
| **Env vars** | **Inglés SCREAMING_SNAKE_CASE** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL` |
| **Git branches** | **Inglés** | `feature/PLATFORM-123-add-mode-switch` |
| **Conventional Commits** | **Inglés** | `feat(auth): add magic link expiration` |
| **GitHub repo names** | **Inglés** | `slowcraft-ai/platform`, `slowcraft-ai/product-landing-site` |
| **Code comments** | **Español** (por ahora) | `// Verifica si el usuario es super_admin` |
| **Doc strings JSDoc** | **Español** (por ahora) | `/** Devuelve las orgs del usuario actual */` |
| **Documentación** (`platform-docs/`) | **Español** (por ahora) | Como está hoy |
| **CHANGELOG** | **Inglés** (auto-generado por Semantic Release) | `feat: add mode switch` |
| **Display names en UI** | **Español primario** vía i18n | "Bienvenido a tu Portal" |
| **Email templates** | **Español primario** vía i18n | "Hola María, te invité a Slowcraft" |
| **Plan display names** | **Español** | "Explora", "Crece", "Estudio" (slug en inglés: `starter`, `growth`, `studio`) |
| **Brand assets** | Como diseñe la marca del cliente | Custom por cliente |
| **Agent prompts** | **Inglés o español según output esperado** | Si genera contenido en español, prompt en español |

### 1.2 Por qué esta separación

- **Código en inglés:** estándar global de la industria. Cualquier dev nuevo (local o internacional) lo puede leer. Stack Overflow, docs de libs, ejemplos — todo está en inglés. Mezclar idiomas en código degrada la calidad.
- **Documentación en español:** la audiencia primaria del documento (equipo Slowcraft, stakeholders) habla español nativo. Escribir docs en su idioma reduce fricción y errores de comprensión.
- **UI en ambos idiomas vía i18n:** clientes mexicanos esperan español; clientes internacionales esperan inglés. La UI se sirve en el idioma correcto sin mezclas.

---

## 2. Sistema de internacionalización (i18n)

### 2.1 Stack

- **Library:** [`next-intl`](https://next-intl-docs.vercel.app/) — el estándar para Next.js App Router.
- **Locales soportados en MVP:** `es-MX` (default), `en`.
- **Locales futuros:** `es-CO`, `pt-BR`, `en-US` (granularidad por país cuando llegue la demanda).

### 2.2 Estructura

```
packages/i18n/
├── src/
│   ├── index.ts           ← detectLocale, localeToCurrency, helpers
│   └── routing.ts         ← config de rutas localizadas (futuro)
└── messages/
    ├── es.json            ← traducciones español (canónico)
    └── en.json            ← traducciones inglés (mirror)
```

### 2.3 Reglas

- **`es.json` es la fuente de verdad.** Cualquier traducción nueva se agrega ahí primero.
- **`en.json` es mirror estructural.** Mismo árbol de keys. Los valores son traducciones (no copias literales).
- **Namespaces planos pero agrupados:** `common.welcome`, `auth.signIn`, `plans.starter`, `navigation.dashboard`.
- **Interpolación con `{variable}`:** ej. `"greeting": "Hola {name},"`.
- **Pluralización con ICU:** `"items": "{count, plural, =0 {Sin elementos} one {1 elemento} other {# elementos}}"`.
- **Si una key falta en `en.json`,** la app falla CI (test obligatorio).

### 2.4 Detección de locale

Prioridad (de mayor a menor):

1. **Cookie de override** del usuario (`slowcraft_locale`) — el usuario eligió manualmente desde un selector.
2. **Header `Accept-Language`** del browser.
3. **Default:** `es-MX`.

### 2.5 Currency vinculada al locale

`packages/i18n` exporta `localeToCurrency(locale)`:
- `es-MX` → `MXN`
- `en` (sin país) → `USD`
- `es-CO` (futuro) → `USD` con disclaimer (Colombia, no MXN)

Esto es el default. El usuario puede sobre-escribir manualmente en checkout.

---

## 3. Naming conventions específicas

### 3.1 Files

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes React | `PascalCase.tsx` | `Button.tsx`, `ClientForm.tsx` |
| Hooks | `useCamelCase.ts` | `useAuth.ts`, `useOrganization.ts` |
| Utils / helpers | `kebab-case.ts` | `format-currency.ts`, `slugify.ts` |
| Server Actions | `verb-noun.ts` o agrupado por dominio | `actions/clients.ts`, `actions/projects.ts` |
| API routes | `route.ts` (Next.js convención) | `app/api/webhooks/stripe/route.ts` |
| Tests | `[file].test.ts` o `[file].spec.ts` | `Button.test.tsx`, `auth.spec.ts` |
| Migrations SQL | `NNNN_description.sql` | `0001_initial_schema.sql`, `0002_add_waitlist.sql` |
| Docs Markdown | `UPPERCASE.md` para canónicos, `lowercase.md` para sub-docs | `README.md`, `setup-stripe.md` |

### 3.2 Code identifiers

| Tipo | Convención | Ejemplo |
|---|---|---|
| Variables | `camelCase` | `clientId`, `organizationName` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_LOCALE` |
| Functions | `camelCase` con verbo | `getUser()`, `createInvitation()` |
| Classes | `PascalCase` | `PaymentProvider`, `AgentRunner` |
| Types / Interfaces | `PascalCase` (sin prefijo `I`) | `Organization`, `ClientMode` |
| Enums | `PascalCase` con valores `SCREAMING_SNAKE` o snake_case según contexto DB | `enum Role { SUPER_ADMIN }` |
| Booleans | Prefijo `is` / `has` / `can` / `should` | `isActive`, `hasAgencyMode`, `canEdit` |
| Async functions | Sufijo no obligatorio, usar tipo `Promise<T>` | `async function fetchUser(): Promise<User>` |

### 3.3 Database

| Tipo | Convención | Ejemplo |
|---|---|---|
| Tabla | `snake_case` plural | `organizations`, `agent_runs` |
| Columna | `snake_case` | `created_at`, `mode_switched_by` |
| Enum (PostgreSQL) | `snake_case` singular | `client_mode`, `project_status` |
| Enum value | `snake_case` | `'in_progress'`, `'self_serve'` |
| Foreign key | `<tabla_singular>_id` | `organization_id`, `profile_id` |
| Timestamp | `<verbo>_at` | `created_at`, `published_at`, `mode_switched_at` |
| Boolean flag | `is_<adjetivo>` o `has_<noun>` | `is_active`, `has_sla` |
| Índice | `idx_<tabla>_<columnas>` | `idx_organizations_slug`, `idx_audit_log_org` |
| Constraint | `<tabla>_<purpose>_<type>` | `organizations_plan_fkey` |

---

## 4. Comentarios en código

Por ahora en español. Cuando la documentación se traduzca, los comentarios también.

```typescript
// Verifica si el usuario actual es super_admin
export function isSuperAdmin(profile: Profile): boolean {
  return profile.platform_role === 'super_admin'
}

/**
 * Crea una nueva invitación con magic link de 7 días.
 *
 * @param input - Datos de la invitación
 * @returns La invitación creada con su token
 * @throws ForbiddenError si el actor no es org_admin o superior
 */
export async function createInvitation(input: CreateInvitationInput): Promise<Invitation> {
  // ...
}
```

**Reglas para comentarios:**

- Solo cuando el código no se explica solo. Si necesitas comentar lo obvio, refactoriza.
- TODOs con autor y fecha: `// TODO(rodrigo, 2026-05-15): refactor cuando llegue Fase 3`.
- Código comentado se borra, no se deja "por si acaso".

---

## 5. Convención de display de moneda

Vinculada al locale del usuario y a la decisión de pricing multi-moneda (PRICING.md).

| Locale del usuario | Moneda mostrada | Disclaimer |
|---|---|---|
| `es-MX` | MXN | Ninguno |
| `en` (sin país específico) | USD | Ninguno |
| `en-US`, `en-CA`, `en-GB`, etc. | USD | Ninguno |
| Otros (Colombia, Argentina, Brasil, etc.) | USD | "*Precio estimado al momento del cargo. Cobro real en USD." |

Implementación en componente `<PriceTag />` de `packages/ui`.

---

## 6. Convención de errores

### 6.1 Tipos de error

```typescript
// packages/config/src/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,           // 'INVALID_INPUT', 'NOT_FOUND', etc.
    public messageKey: string,     // key de i18n para mostrar al usuario
    public statusCode = 500,
    public metadata?: Record<string, unknown>,
  ) {
    super(messageKey)
  }
}

export class ValidationError extends AppError {
  constructor(messageKey: string, fields?: Record<string, string>) {
    super('VALIDATION_ERROR', messageKey, 400, { fields })
  }
}

export class ForbiddenError extends AppError {
  constructor(messageKey = 'errors.forbidden') {
    super('FORBIDDEN', messageKey, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(messageKey = 'errors.notFound') {
    super('NOT_FOUND', messageKey, 404)
  }
}
```

### 6.2 Mensajes de error

- Lanzados con `messageKey` (i18n key), no con string hardcoded.
- La UI traduce el key a texto en el idioma del usuario.
- Logs incluyen el `code` (no traducible) para análisis.

```typescript
throw new ValidationError('clients.errors.slugTaken', { slug: input.slug })
// UI muestra: t('clients.errors.slugTaken') → "El slug 'acme' ya está en uso"
```

---

## 7. Migración de documentación de español a inglés

Cuando llegue el momento de traducir la documentación (probablemente al cierre de Fase 6 o cuando entre el primer cliente o consultor que solo hable inglés):

1. **`platform-docs/` se duplica:** `platform-docs/es/` y `platform-docs/en/`.
2. **El root README** queda en ambos idiomas (corto, con links a cada versión).
3. **Cada doc tiene su par exacto**, mismo árbol de archivos.
4. **Comentarios de código se traducen en el mismo PR** que traduce su archivo doc relacionado.
5. **Conventional Commits** quedan en inglés (ya están).

**No traducir todavía.** Esperar a que la Plataforma esté madura y el equipo o el primer cliente lo justifique.

---

## 8. Checklist al crear código nuevo

Antes de mergear cualquier PR:

- [ ] Folders, files, vars en inglés.
- [ ] Slugs y URLs en inglés.
- [ ] Display strings vía `useTranslations()`, no hardcoded.
- [ ] Si agregas key nueva en `es.json`, también en `en.json`.
- [ ] Comentarios en español, claros y concisos.
- [ ] Currency display usa `<PriceTag />` (no `${plan.price}`).
- [ ] Errores lanzados con `messageKey`, no con string.
- [ ] Conventional Commit en inglés.

---

*CONVENTIONS.md · v1.0 · Mayo 2026 · Slowcraft Platform*
