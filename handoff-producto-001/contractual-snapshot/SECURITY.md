# Slowcraft Platform — SECURITY

> Pilar no negociable. La seguridad no es una feature — es un constraint de diseño.
>
> Este documento consolida todas las prácticas de seguridad que aplican a la Plataforma y a los Productos. Cada práctica tiene un responsable, un mecanismo de verificación, y un plan de respuesta si falla.

**Versión:** 1.0
**Última actualización:** Mayo 2026
**Audiencia:** Cualquier persona que escriba código o opere la Plataforma.

---

## Índice

1. [Filosofía de seguridad](#1-filosofía-de-seguridad)
2. [Threat model](#2-threat-model)
3. [Las 10 reglas innegociables](#3-las-10-reglas-innegociables)
4. [Multi-tenancy y aislamiento (RLS)](#4-multi-tenancy-y-aislamiento-rls)
5. [Manejo de secretos](#5-manejo-de-secretos)
6. [Autenticación y sesiones](#6-autenticación-y-sesiones)
7. [Autorización en 3 capas](#7-autorización-en-3-capas)
8. [Audit log obligatorio](#8-audit-log-obligatorio)
9. [Validación de inputs](#9-validación-de-inputs)
10. [Webhooks y signing](#10-webhooks-y-signing)
11. [Dependencias y supply chain](#11-dependencias-y-supply-chain)
12. [OWASP Top 10 — checklist](#12-owasp-top-10--checklist)
13. [Plan de respuesta a incidentes de seguridad](#13-plan-de-respuesta-a-incidentes-de-seguridad)
14. [Auditorías y rotación periódica](#14-auditorías-y-rotación-periódica)

---

## 1. Filosofía de seguridad

Tres principios que rigen todo:

1. **Defensa en profundidad.** Ninguna capa es suficiente sola. UI, server-side validation y RLS son tres capas que protegen el mismo recurso. Si una falla, las otras siguen.

2. **Secure by default.** El default de cualquier configuración nueva es la opción más restrictiva. Si una tabla nueva se crea, RLS está habilitada y sin policies — nadie lee, nadie escribe — hasta que explícitamente se permitan operaciones.

3. **Auditable siempre.** Toda acción crítica queda registrada. Si pasó algo, se sabe quién, cuándo, dónde y desde qué IP.

---

## 2. Threat model

Vectores de amenaza que la Plataforma debe resistir, en orden de probabilidad:

| Amenaza | Probabilidad | Impacto | Mitigación principal |
|---|---|---|---|
| Filtración de secretos en repo público | Alta | Crítico | Pre-commit hook (gitleaks), GitHub secret scanning, scripts/setup-keys.sh |
| Acceso cruzado entre tenants (org A lee datos de B) | Media | Crítico | RLS en TODAS las tablas + tests E2E obligatorios |
| Account takeover por phishing | Media | Alto | MFA obligatorio para super_admin; magic link sobre password donde se pueda |
| Webhook spoofing (Stripe, GitHub, Inngest) | Media | Alto | Signature verification obligatoria en cada webhook |
| Inyección SQL (vía dynamic queries) | Baja | Crítico | Solo Prisma/Supabase queries parametrizadas; nunca string interpolation a raw SQL |
| XSS por user-generated content | Media | Medio | React escape automático + sanitización de HTML libre con DOMPurify |
| Insecure direct object references (IDOR) | Media | Alto | RLS + verificación explícita de organization_id en cada server action |
| Supply chain attack (dep maliciosa) | Baja | Crítico | pnpm con lockfile + Dependabot + audit semanal |
| Brute force / credential stuffing | Media | Medio | Rate limiting con Upstash Redis en endpoints de auth |
| Data exfiltration via export | Baja | Alto | Audit log de exports; alerta si volumen excede umbral por org |
| Cliente recibe acceso a recursos de otro cliente al activar custom domain | Baja | Crítico | Validación de ownership de DNS antes de routing; SSL por dominio |

---

## 3. Las 10 reglas innegociables

Estas reglas son binarias. No hay excepciones "esta vez". Si necesitas violar una, la decisión escala a super_admin con justificación documentada.

1. **`SUPABASE_SERVICE_ROLE_KEY`** — nunca en código cliente, nunca en logs, nunca en respuestas HTTP, nunca en URLs.
2. **Permisos en 3 capas siempre:** UI (esconder) + Server Action / API (validar) + RLS en PostgreSQL (último resort). Si solo está en UI, no existe.
3. **RLS habilitada en todas las tablas con datos de tenant** desde el inicio. Sin excepciones. Tablas globales (catálogo, modules) sin RLS deben estar explícitamente justificadas en su migration.
4. **Audit log obligatorio** en: mode switch · invitar/eliminar miembro · aprobar entregable · cambios de billing · transfer de repo · cambios de agent en producción · export de datos · cambio de feature flag.
5. **Stripe `sk_live_*` SOLO en production.** Nunca en staging, nunca en preview, nunca local. Test keys solo `sk_test_*`.
6. **Migraciones backward-compatible.** Migración corre ANTES del deploy. Nunca destructivas en una sola migración (drop/rename = dos migraciones con período de transición).
7. **Secrets solo en GitHub Secrets y Railway env vars.** Nunca en el repo. `.env.local` siempre gitignored. `gitleaks` en pre-commit.
8. **Webhooks signature-verified siempre.** Stripe, PayPal, GitHub, Inngest, Cloudflare. Si la firma no valida, 401 inmediato; sin parsear el body.
9. **CORS estricto.** API routes solo aceptan requests de dominios Slowcraft (`*.slowcraft.ai` o el custom domain del cliente apuntando a la Plataforma). Sin `*`.
10. **Rate limiting en endpoints sensibles** (login, signup, password reset, webhooks públicos). 10 req/min por IP. 5 intentos de login fallidos → bloqueo 15 min.

---

## 4. Multi-tenancy y aislamiento (RLS)

### 4.1 Patrón de policy estándar

Toda tabla con datos de tenant tiene al menos estas policies:

```sql
-- READ: solo miembros de la organización pueden leer
CREATE POLICY "members can read"
ON <table> FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM memberships
    WHERE profile_id = auth.uid()
  )
);

-- WRITE: solo admins de la organización pueden escribir
CREATE POLICY "admins can write"
ON <table> FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM memberships
    WHERE profile_id = auth.uid()
      AND role IN ('org_owner', 'org_admin')
  )
);

-- SUPER ADMIN: bypass para soporte
CREATE POLICY "super admins bypass"
ON <table> FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND platform_role = 'super_admin'
  )
);
```

### 4.2 Test E2E obligatorio (Fase 1 gate)

```typescript
// Test que falla si el aislamiento se rompe
test('org A cannot read org B projects', async () => {
  const orgA = await createTestOrg('A')
  const orgB = await createTestOrg('B')
  const userA = await createTestUser(orgA)

  // Crear projects en ambas orgs
  await createProject(orgA.id, { name: 'A project' })
  await createProject(orgB.id, { name: 'B project' })

  // User de A lista projects
  const projects = await listProjects(userA.token)
  expect(projects).toHaveLength(1)
  expect(projects[0].organization_id).toBe(orgA.id)
})
```

Este test corre en cada PR. Si falla → bloquea el merge.

### 4.3 Service role bypass

`SUPABASE_SERVICE_ROLE_KEY` salta RLS. Solo se usa en:
- Server Actions y API Routes (server-side, nunca cliente).
- Inngest workers para tareas batch.
- Scripts de migración y seed.

Sentry alerta si una request HTTP de cara a cliente devuelve datos cruzados (heurística: respuesta contiene IDs de organization distintos al `organization_id` del JWT).

---

## 5. Manejo de secretos

### 5.1 Categorías de secretos

| Categoría | Ejemplo | Storage local | Storage remoto |
|---|---|---|---|
| Secret server-only | `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (chmod 600) | Railway env vars |
| Secret webhook signing | `STRIPE_WEBHOOK_SECRET` | `.env.local` | GitHub Secrets + Railway env vars |
| Public env (no secreto) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `.env.local` | Railway env vars |
| API keys de servicios | `RESEND_API_KEY` | `.env.local` | Railway env vars |
| LLM provider keys | `ANTHROPIC_API_KEY` | `.env.local` | Railway env vars |

### 5.2 Reglas de manejo

- **Nunca pegar keys en chat, screenshots, Slack, email, ni docs.**
- **Nunca echo de keys en scripts.** Usar `read -s` siempre.
- **Nunca log de keys** ni siquiera enmascarados (los enmascaramientos fallan con frecuencia).
- **Nunca compartir keys entre environments.** Cada env tiene su propio set.
- **Rotación obligatoria** post-incidente, post-empleado-saliente, o cada 90 días para webhook secrets.

### 5.3 Detección automática de leaks

Pre-commit hook con `gitleaks`:

```bash
# .husky/pre-commit
gitleaks protect --staged --verbose --redact
```

GitHub secret scanning habilitado en el repo. Si detecta un leak en push → notificación inmediata + revocación automática (vía API del proveedor afectado).

### 5.4 Recuperación post-leak

```
1. Revocar inmediatamente la key comprometida en el dashboard del proveedor.
2. Generar nueva key y configurar en Railway (sin downtime si Railway permite).
3. Forzar deploy con la nueva key.
4. Auditar logs: ¿alguien usó la key comprometida durante la ventana?
5. Si SÍ uso indebido: incident P0, escalar.
6. Postmortem en 48h con cómo evitar el repetido.
```

---

## 6. Autenticación y sesiones

### 6.1 Providers por contexto

| Contexto | Providers permitidos | MFA |
|---|---|---|
| Mission Control | Google · Email/password | **Obligatorio** para super_admin |
| Agency Hub | Google · Email/password | Recomendado |
| Client Portal B2B | Magic Link · Google · SAML (Enterprise) | Opcional cliente |
| Client Portal B2C (futuro) | Google · Apple · Magic Link | Opcional cliente |

### 6.2 Política de sesiones

- **Refresh tokens**: rotación automática en cada uso (Supabase Auth default).
- **Acceso a Mission Control**: token corto (1 hora) + re-auth para acciones críticas (delete, transfer, billing).
- **Acceso a Client Portal**: token largo (7 días) con refresh.
- **Logout en todos los devices**: disponible desde Settings.

### 6.3 Password (cuando aplica)

- Mínimo 12 caracteres.
- Validación contra pwned passwords (HaveIBeenPwned API).
- bcrypt con cost 12 (Supabase Auth default).
- Reset password vía email con token de un solo uso, válido 30 min.

---

## 7. Autorización en 3 capas

Cada acción protegida pasa por las 3 capas:

```
┌──────────────────────────────────────────────────────────┐
│ CAPA 1 — UI (esconder lo que no se puede hacer)         │
│ - Botones, links, menús ocultos según rol                │
│ - Mensaje "no tienes permiso" si intenta navegar URL    │
│ - PROPÓSITO: UX. NO ES SEGURIDAD.                        │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ CAPA 2 — Server Action / API Route (validar)            │
│ - Verifica auth.uid() y rol antes de ejecutar           │
│ - Throw 403 si no autorizado                             │
│ - PROPÓSITO: bloqueo lógico de aplicación               │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│ CAPA 3 — RLS en PostgreSQL (último resort)              │
│ - Policies de DB que filtran por auth.uid() y org      │
│ - Si capas 1-2 fallan, esto previene el daño             │
│ - PROPÓSITO: garantía final de aislamiento              │
└──────────────────────────────────────────────────────────┘
```

Implementación de capa 2 — patrón estándar:

```typescript
// packages/auth/src/guards.ts
export async function requireRole(
  role: PlatformRole | OrgRole,
  context: { organizationId?: string }
): Promise<Profile> {
  const { user } = await getSession()
  if (!user) throw new ForbiddenError('Not authenticated')

  const profile = await getProfile(user.id)
  if (!hasRole(profile, role, context)) {
    throw new ForbiddenError(`Requires role: ${role}`)
  }
  return profile
}

// En server action:
'use server'
export async function deleteClient(clientId: string) {
  const profile = await requireRole('super_admin', {})
  await db.client.delete(clientId)
  await auditLog('client.deleted', profile.id, { clientId })
}
```

---

## 8. Audit log obligatorio

### 8.1 Eventos auditados (mínimo)

```
mode_switched              {organization_id, from, to, reason}
member_invited             {organization_id, email, role}
member_removed             {organization_id, member_id, reason}
deliverable_approved       {project_id, deliverable_id, approved_by}
billing_changed            {organization_id, change_type, from, to}
repo_transferred           {github_repo_id, transferred_to}
agent_config_changed       {agent_id, field_changed}
data_exported              {organization_id, export_type, requested_by}
feature_flag_changed       {flag_name, environment, from, to}
super_admin_action         {action, target, justification}
auth_failure               {ip, attempted_email, reason}
```

### 8.2 Schema de audit_log

```sql
CREATE TABLE audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event           text NOT NULL,
  actor_id        uuid REFERENCES profiles(id),
  actor_ip        inet,
  actor_user_agent text,
  target_type     text,
  target_id       uuid,
  organization_id uuid REFERENCES organizations(id),
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_org ON audit_log(organization_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_log_event ON audit_log(event, created_at DESC);
```

### 8.3 Retención

- **2 años** mínimo en hot storage (PostgreSQL).
- Después: archive a Cloudflare R2 con encriptación, búsqueda manual on-demand.
- Eventos `super_admin_action` y `data_exported`: **7 años** (compliance).

### 8.4 Acceso al audit log

- Super admin: lectura completa.
- Org admin: solo eventos de su organización.
- Org member: solo sus propios eventos.
- Cliente final: solo sus propios eventos vía Settings → Activity.

---

## 9. Validación de inputs

### 9.1 Zod en todos los inputs

```typescript
import { z } from 'zod'

const createProjectSchema = z.object({
  organizationId: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  modules: z.array(z.string().uuid()).min(1).max(20),
})

// Server action
export async function createProject(input: unknown) {
  const data = createProjectSchema.parse(input)  // throws if invalid
  // ... usar data, ya tipado y validado
}
```

### 9.2 Sanitización de HTML libre

User-generated HTML (raro, pero posible en ciertos campos del CMS) se sanitiza con DOMPurify server-side antes de guardar:

```typescript
import DOMPurify from 'isomorphic-dompurify'

const cleanHtml = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})
```

### 9.3 File uploads

- **Tipos permitidos**: explícitos por contexto (logos = png/jpg/svg/webp; documentos = pdf).
- **Tamaño máximo**: 10 MB por archivo, 100 MB por organización por mes.
- **Antivirus scan**: ClamAV en Inngest worker antes de marcar el asset como `available`.
- **Storage**: Supabase Storage con RLS por organización.
- **Servir**: signed URLs con TTL de 1 hora.

---

## 10. Webhooks y signing

### 10.1 Verificación obligatoria

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@slowcraft/payments/stripe'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('No signature', { status: 401 })

  const body = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Invalid signature', { status: 401 })
  }

  // SOLO acá empezamos a procesar el evento
  await processStripeEvent(event)
  return new Response('OK')
}
```

### 10.2 Idempotencia

Cada webhook event tiene un `event.id`. Antes de procesar:

```typescript
const exists = await db.processedWebhook.findUnique({ where: { event_id: event.id } })
if (exists) return new Response('Already processed', { status: 200 })

// Procesar
await db.processedWebhook.create({ data: { event_id: event.id, source: 'stripe' } })
```

### 10.3 Replay protection

Stripe webhook events tienen timestamp. Rechazar eventos con timestamp > 5 min:

```typescript
if (Math.abs(Date.now() - event.created * 1000) > 5 * 60 * 1000) {
  return new Response('Event too old', { status: 401 })
}
```

---

## 11. Dependencias y supply chain

### 11.1 Lock file siempre

`pnpm-lock.yaml` commiteado. CI usa `pnpm install --frozen-lockfile`. Ninguna dep se actualiza implícitamente.

### 11.2 Audit semanal

GitHub Actions workflow cron:

```yaml
# .github/workflows/audit.yml
on:
  schedule: [{cron: '0 9 * * 1'}]  # Lunes 9am
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm audit --audit-level=moderate
      - run: pnpm dlx snyk test
      - run: pnpm outdated
      # Si hay vulns críticas → abre issue automático con label "security"
```

### 11.3 Dependabot

Habilitado para:
- npm packages (semanal).
- GitHub Actions (semanal).
- Docker base images (mensual).

PRs de Dependabot pasan por el mismo CI que cualquier PR. Auto-merge habilitado solo para patch updates con tests verdes.

### 11.4 Whitelist de dependencias críticas

Dependencias de seguridad crítica (auth, payments, crypto) requieren aprobación explícita antes de bump major version. Lista en `packages/config/critical-deps.json`.

---

## 12. OWASP Top 10 — checklist

Verificación al cierre de cada fase:

- [ ] **A01: Broken Access Control** — tests de RLS pasan; tests de IDOR pasan.
- [ ] **A02: Cryptographic Failures** — bcrypt para passwords; HTTPS only; no MD5/SHA1.
- [ ] **A03: Injection** — Zod en todos los inputs; queries parametrizadas; sin `eval()` ni `new Function()`.
- [ ] **A04: Insecure Design** — threat model documentado y revisado por fase.
- [ ] **A05: Security Misconfiguration** — secure defaults; sin debug en prod; CSP headers configurados.
- [ ] **A06: Vulnerable Components** — `pnpm audit` semanal sin findings críticos sin resolver.
- [ ] **A07: Auth Failures** — rate limiting en login; MFA disponible; password policy en su lugar.
- [ ] **A08: Software Integrity Failures** — lockfile commiteado; subresource integrity para CDN scripts.
- [ ] **A09: Logging Failures** — audit log obligatorio en eventos críticos; Sentry capturando errores.
- [ ] **A10: SSRF** — fetch desde el server valida URL whitelist (especialmente en custom domain validation).

---

## 13. Plan de respuesta a incidentes de seguridad

### 13.1 Severidades

| Sev | Definición | Tiempo de respuesta |
|---|---|---|
| **SEV-0** | Brecha confirmada de datos de cliente | Inmediato (0-15 min) |
| **SEV-1** | Vulnerabilidad explotable activamente | < 1 hora |
| **SEV-2** | Vulnerabilidad sin explotación conocida | < 24 horas |
| **SEV-3** | Hallazgo de auditoría sin riesgo inmediato | < 1 semana |

### 13.2 Procedimiento SEV-0/SEV-1

```
1. CONTENER (0-30 min)
   - Bloquear el vector si es posible (kill API key, revocar sesión, deshabilitar feature flag).
   - Aislar el sistema afectado sin destruir evidencia.

2. EVALUAR (30-90 min)
   - Determinar alcance: ¿qué datos? ¿de cuántos clientes?
   - Determinar duración: ¿desde cuándo está expuesto?
   - Determinar si hubo extracción de datos.

3. NOTIFICAR (90 min - 4h)
   - Internal: equipo Slowcraft.
   - Externos: clientes afectados + autoridades si aplica (GDPR-like, LGPD, en MX la Ley Federal de Protección de Datos en Posesión de Particulares).
   - Mensaje claro, sin minimizar, con plan de remediación.

4. REMEDIAR (4-72h)
   - Fix técnico deployado.
   - Rotación de credenciales afectadas.
   - Auditoría de logs en busca de uso indebido.

5. POSTMORTEM (1 semana)
   - RCA completo.
   - Acciones preventivas para que no se repita.
   - Publicar postmortem (al equipo siempre, externamente si aplica).
```

### 13.3 Contactos de escalación

```
SEV-0: Owner técnico (Rodrigo) + super_admin de turno → inmediato.
SEV-1: Owner técnico → < 1h.
SEV-2: Issue con label `security` → triage en daily standup.
SEV-3: Backlog normal con label `security`.
```

---

## 14. Auditorías y rotación periódica

### 14.1 Calendario obligatorio

| Frecuencia | Acción |
|---|---|
| **Diario** | Sentry / Posthog dashboards revisados (alertas automáticas) |
| **Semanal** | `pnpm audit` ejecutado; PRs de Dependabot revisados |
| **Mensual** | Audit log de super_admin_actions revisado; permisos de miembros del equipo verificados |
| **Trimestral** | Rotación de webhook secrets; revisión de RLS policies por nuevas tablas |
| **Semestral** | Penetration test externo (cuando la Plataforma tenga >10 clientes pagados) |
| **Anual** | Auditoría completa de OWASP Top 10; revisión del threat model |

### 14.2 Off-boarding de empleados

Al salir un miembro del equipo Slowcraft:
1. Revocar acceso a GitHub org.
2. Revocar acceso a Railway, Supabase, Cloudflare, Stripe, PayPal, Resend, Sentry, Posthog.
3. Si tenía acceso a producción: rotar todas las keys que pudo haber visto.
4. Eliminar de Slack, 1Password.
5. Audit de su actividad reciente (últimos 30 días).

---

## Apéndice A — Headers de seguridad HTTP

Configurados en `middleware.ts` de cada app Next.js:

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': csp,  // dinámico por app, ver Apéndice B
}
```

---

## Apéndice B — Content Security Policy

CSP estricto por defecto:

```
default-src 'self';
script-src 'self' 'nonce-{nonce}' https://js.stripe.com https://www.paypal.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.paypal.com wss://*.supabase.co;
frame-src https://js.stripe.com https://www.paypal.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Cualquier excepción se documenta y revisa.

---

*SECURITY.md · v1.0 · Mayo 2026 · Slowcraft Platform · Pilar no negociable*
