# Slowcraft Platform — ROADMAP del MVP

> Plan de las 7 fases del MVP organizado por **entregables visuales puntuales** y **journeys navegables**.
>
> Cada fase entrega algo demostrable que se puede ver, probar y validar antes de pasar a la siguiente.

**Versión:** 1.0
**Última actualización:** Mayo 2026
**Duración total del MVP:** 18 semanas (4.5 meses)
**Audiencia:** Equipo Slowcraft + clientes piloto.

---

## Filosofía del roadmap

El MVP de la Plataforma resuelve **un problema concreto**: que Slowcraft pueda producir, configurar y deployar herramientas, servicios y productos digitales rápidamente, con UX optimizada, alta performance, seguridad robusta, escalamiento controlado y portabilidad real para el cliente.

Cada fase entrega un **journey navegable end-to-end** que demuestra que un pedazo del problema está resuelto. No hay fases "solo backend" ni "solo infraestructura sin UI" — todo lo que se construye debe ser visible, demostrable y evaluable.

**Reglas que aplican a todas las fases:**

- **Entregable visual obligatorio** — pantallas funcionando, no archivos en disco.
- **Journey demostrable** — pasos concretos que se pueden recorrer en 10-15 minutos.
- **Validación binaria** — checklist binario que decide si la fase cierra.
- **Gate de fase** — sin completar el gate no se avanza a la siguiente.
- **Demo session al final de cada fase** — Rodrigo y stakeholders revisan el journey, dan feedback, se cierra o se itera.
- **Cumple SECURITY.md y PERFORMANCE.md** — los pilares aplican desde día uno, no se agregan al final.

---

## Resumen de las 7 fases

| Fase | Semanas | Tema | Journey demostrable |
|---|---|---|---|
| **0** | 1-2 | Fundamentos técnicos | Login funcional en las 3 apps con layouts vacíos branded |
| **1** | 3-5 | Acceso por invitación | Super_admin invita → email bonito → cliente entra a su Portal |
| **2** | 6-8 | Cliente, proyecto y catálogo administrable | Super_admin edita catálogo → consultor crea cliente y le asigna producto |
| **3** | 9-11 | Pricing multi-moneda y checkout | Cliente ve precio en su moneda → checkout en Stripe TEST → suscripción activa |
| **4** | 12-13 | Theming whitelabel + Custom Domain | Client Portal con marca del cliente → opcional dominio propio funcional |
| **5** | 14-16 | Agent Engine + primer agente real | Consultor lanza agente → ve progreso en vivo → cliente descarga deliverable |
| **6** | 17-18 | Producto #001 deployado + portabilidad demo | Landing_Site instance de Slowcraft deployada + demo de Export & Migrate |

---

## Fase 0 — Fundamentos técnicos

**Semanas 1-2** · *Sin dependencias previas, esta es la base.*

### Objetivo
Toda la infraestructura técnica corriendo: las 3 apps Next.js levantan en local, en preview, en staging. CI/CD funcional. Base de datos lista. Componentes base extraídos. Login básico funcional.

### Entregable visual
Tres pantallas de login funcionales, una por cada app:
- `app.slowcraft.ai/login` (Mission Control) — fondo crema, logo Slowcraft, login Google + email/password.
- `hub.slowcraft.ai/login` (Agency Hub) — variante pero con el mismo branding.
- `slowcraft.slowcraft.ai/login` (Client Portal del propio Slowcraft) — magic link como CTA principal.

Tres pantallas post-login con layout vacío branded:
- Mission Control: sidebar + main vacío con "Bienvenido, [super_admin]".
- Agency Hub: top nav + main vacío con "Bienvenido, [consultor]".
- Client Portal: header con logo + main vacío con "Bienvenido, [cliente]".

Plus: Storybook accesible en `storybook.slowcraft.ai` con los primeros 8-10 componentes (Button, Input, Badge, Card, Sidebar, TopBar, FormField, ConfirmModal).

### Journey demostrable (10 min)
1. Visitar `app.slowcraft.ai` → ver login.
2. Login con Google → entrar al Mission Control vacío.
3. Visitar `hub.slowcraft.ai` → ver login (sesión persiste).
4. Visitar `slowcraft.slowcraft.ai` → ver login del Portal.
5. Visitar `storybook.slowcraft.ai` → navegar componentes.

### Validación binaria (Gate de Fase 0)
- [ ] Las 3 apps responden en sus dominios con HTTPS válido.
- [ ] Login con Google funciona en las 3 apps.
- [ ] Sesión persiste entre apps con el mismo usuario.
- [ ] PR genera preview deploy con URL en comentario automático.
- [ ] Merge a `main` genera versión semántica con CHANGELOG.
- [ ] Schema completo migrado en local + staging.
- [ ] Storybook accesible con ≥ 8 componentes documentados.
- [ ] Lighthouse score ≥ 90 en cada login screen.
- [ ] Tests de RLS verifican aislamiento entre orgs (ya con orgs de prueba).

### Pasos clave
Ver `RUNBOOK.md` Parte A — Initial Setup Playbook (15 pasos validados).

---

## Fase 1 — Acceso por invitación funcional

**Semanas 3-5** · *Depende de Fase 0.*

### Objetivo
Que un super_admin pueda invitar a un usuario por email, ese usuario reciba un email bonito, abra el magic link y entre a la Plataforma con su rol y org configurados. Primer contacto digital de un cliente o consultor con Slowcraft.

### Entregable visual
- **Mission Control → Invitations**: pantalla con form para invitar (email, rol, org, mensaje opcional) + lista de invitaciones pendientes con re-envío y revocación.
- **Email de invitación**: HTML diseñado con DS v2.0 (Newsreader serif, Salvia/Cobre, editorial). Personalizado: nombre del invitado, nombre del consultor que invita, mensaje opcional, CTA "Acceder a tu Portal".
- **Welcome screen post-magic-link**: 3 pasos (confirmar nombre, confirmar rol asignado, ya entras). Estética cálida, copy en español natural.
- **Pantallas vacías post-onboarding**: Agency Hub muestra "Aún no tienes clientes asignados"; Client Portal muestra "Aún no tienes proyectos activos".

### Journey demostrable (15 min)
1. Super_admin entra a Mission Control → Invitations → click "Nueva invitación".
2. Llena form: email del invitado, rol (consultor / cliente), org destino (o "crear nueva org"), mensaje opcional.
3. Recibe el email en una inbox de prueba — se ve bonito en Gmail/Apple Mail.
4. Click en el CTA del email → abre `slowcraft.ai/auth/accept-invite?token=...`.
5. Welcome screen: confirma datos → click "Empezar".
6. Aterriza en su app correspondiente (Hub si es consultor, Portal si es cliente) con su perfil seteado.
7. De vuelta en Mission Control, la invitación aparece como "Aceptada [fecha]".

### Validación binaria
- [ ] Email se renderiza correctamente en Gmail, Apple Mail y Outlook web.
- [ ] Magic link expira en 7 días exactos.
- [ ] Re-envío genera un nuevo token válido.
- [ ] Revocar invitación pendiente invalida el token inmediatamente.
- [ ] Audit log registra: invitación creada, enviada, aceptada, revocada.
- [ ] Permisos correctos: consultor solo ve Agency Hub; cliente solo ve Client Portal.
- [ ] RLS impide que un consultor invitado a org A vea data de org B.
- [ ] LCP de welcome screen < 1.8s.

### Componentes UI nuevos en `packages/ui` (Fase 1)
`InvitationForm`, `EmailTemplate (React Email)`, `WelcomeWizard`, `EmptyState`.

---

## Fase 2 — Cliente, proyecto y catálogo administrable

**Semanas 6-8** · *Depende de Fase 1.*

### Objetivo
Super_admin puede editar el catálogo de productos (administrable, no hardcoded). Consultor puede crear un cliente, asignarle un producto del catálogo y arrancar un proyecto. Cliente lo ve en su Portal.

### Entregable visual
- **Mission Control → Catálogo**: pantalla CRUD de productos. Cada producto editable (nombre, slug, archetype, versión, compatibility matrix, descripción).
- **Mission Control → Clientes**: lista de clientes con filtros, "Nuevo cliente" wizard (nombre, slug, plan, modo Agency/Self-serve, consultor asignado).
- **Agency Hub → Mis Clientes**: lista de clientes asignados al consultor logueado.
- **Agency Hub → Cliente X → Crear proyecto**: wizard "Selecciona producto del catálogo → configura módulos → crea".
- **Client Portal → Dashboard**: card del proyecto recién creado con estado "Configuración inicial".

### Journey demostrable (15 min)
1. Super_admin → Catálogo → "Nuevo producto" → llena form (Landing_Site v1.0.0, archetype Presencia Digital, descripción) → guarda.
2. Super_admin → Clientes → "Nuevo cliente" → wizard (nombre "Acme Corp", slug "acme", plan "Crece", modo Agency, consultor "Carlos") → guarda.
3. Cambia a sesión del consultor "Carlos" en Agency Hub → ve a Acme Corp en su lista.
4. Click en Acme Corp → "Crear proyecto" → selecciona producto Landing_Site del catálogo → configura módulos disponibles → crea.
5. Cambia a sesión del cliente Acme → entra a Client Portal → ve el proyecto en su dashboard con estado claro.
6. De vuelta en Mission Control, ve el proyecto en el listado global con sus metadatos.

### Validación binaria
- [ ] Catálogo de productos editable sin redeploys.
- [ ] Validaciones server-side de Zod previenen estados inválidos.
- [ ] Asignación de consultor crea la relación correcta (consultor solo ve clientes asignados).
- [ ] Cliente solo ve sus propios proyectos en su Portal.
- [ ] Audit log: cliente creado, proyecto creado, cambios al catálogo.
- [ ] Lighthouse ≥ 90 en cada pantalla.
- [ ] Bundle inicial < 250 KB en cada app.

### Schema clave (extracto)
```sql
products (id, name, slug, archetype, version, base_config, is_active, created_at, updated_at)
clients (id, name, slug, primary_consultant_id, created_at)
projects (id, organization_id, product_id, status, created_at, ...)
```

### Componentes UI nuevos
`ProductForm`, `ClientForm`, `WizardStepper`, `DataTable` con sorting, `ProjectCard`.

---

## Fase 3 — Pricing multi-moneda y checkout

**Semanas 9-11** · *Depende de Fase 2.*

### Objetivo
Paquetes administrables (Starter/Growth/Studio/Enterprise editables en precio y contenido). Cliente ve precios en su moneda local. Checkout funcional con Stripe en TEST mode. Suscripción activa visible en Settings.

### Entregable visual
- **Mission Control → Paquetes**: CRUD de paquetes. Cada paquete editable (nombre, slug, precio USD, precio MXN, features incluidas, productos máximos, horas de consultor, descripción).
- **Client Portal → Marketplace** (versión MVP): grid de paquetes disponibles con `<PriceTag />` en moneda local del usuario. Botón "Suscribirme".
- **Stripe Checkout**: redirige a Stripe Checkout en moneda y método correctos.
- **Client Portal → Settings → Billing**: muestra suscripción activa, próxima renovación, método de pago, link a portal de Stripe para gestión.
- **Mission Control → Billing global**: dashboard de MRR, cuentas activas, churn.

### Journey demostrable (15-20 min)
1. Super_admin → Paquetes → edita el plan "Crece": precio USD 30, precio MXN 600, features incluidas. Guarda.
2. Cambia a sesión del cliente Acme (México) → entra a Marketplace → ve "Crece — $600 MXN/mes".
3. Click "Suscribirme" → redirige a Stripe Checkout en MXN.
4. Completa pago de prueba con tarjeta `4242...` (test mode).
5. Vuelve a Client Portal → suscripción activa, factura en Settings → Billing.
6. Cambia a sesión de cliente extranjero (ej. Colombia) → ve precio "$30 USD" + leyenda "*Precio estimado al momento del cargo. Cobro real en USD".
7. Mission Control → Billing → ve MRR actualizado, cuenta activa nueva.

### Validación binaria
- [ ] Edición de paquete refleja cambios inmediatamente sin redeploy.
- [ ] Detección de moneda funciona vía geolocalización + override manual.
- [ ] Stripe Checkout funcional en USD y MXN.
- [ ] Webhook de Stripe valida signature y crea suscripción en DB.
- [ ] OXXO y SPEI disponibles como métodos de pago en MX.
- [ ] Audit log: paquete editado, suscripción creada, factura emitida.
- [ ] Componente `<PriceTag />` documentado en Storybook.
- [ ] Tests E2E de flujo de checkout pasan.

### Schema clave
```sql
plans (
  id, name, slug, description,
  price_usd_cents, price_mxn_cents,
  stripe_price_id_usd, stripe_price_id_mxn,
  is_active, display_order, created_at, updated_at
)
plan_features (id, plan_id, feature_key, feature_value jsonb)
subscriptions (id, organization_id, plan_id, stripe_subscription_id, status, current_period_end, ...)
```

### Detalle de paquetes propuestos
Ver `PRICING.md` para la propuesta inicial completa de los 4 paquetes con pricing y features.

### Componentes UI nuevos
`PriceTag`, `PlanCard`, `MarketplaceGrid`, `BillingSummary`, `MRRDashboard`.

---

## Fase 4 — Theming whitelabel + Custom Domain

**Semanas 12-13** · *Depende de Fase 3.*

### Objetivo
Client Portal renderiza con la marca del cliente (logo, colores, fuentes, favicon). Subdominio default funcional. Cliente puede opcionalmente configurar su dominio propio con verificación CNAME automática.

### Entregable visual
- **Agency Hub → Cliente X → Theme**: editor visual con preview live. Sube logo, elige colores (primary, secondary, accent), elige fuente (de un set curado). Click "Aplicar" → cambios visibles en `[slug].slowcraft.ai`.
- **Client Portal con marca del cliente**: header con su logo, colores aplicados a botones y elementos interactivos.
- **Mission Control → Cliente X → Custom Domain**: wizard para configurar dominio propio (input domain → genera CNAME target → cliente configura DNS → verificación automática).
- **Estado del dominio**: badge visible "Verificado · SSL activo" o "Pendiente de verificación".

### Journey demostrable (15 min)
1. Consultor → Cliente Acme → Theme → sube logo PNG, elige color coral, fuente "Inter".
2. Click "Aplicar" → preview se actualiza en vivo.
3. Visita `acme.slowcraft.ai` → ve el Portal con la marca de Acme.
4. Cambia a wizard de Custom Domain → ingresa `portal.acme.com` → recibe CNAME target.
5. (Simulado) configura CNAME en DNS de Acme → vuelve a la Plataforma → click "Verificar" → check pasa.
6. Visita `portal.acme.com` → ve el Portal con HTTPS activo y la marca de Acme.

### Validación binaria
- [ ] Cambios de theme se reflejan en < 5 segundos sin recargar la página.
- [ ] SSL automático emitido por Cloudflare en custom domains.
- [ ] Validación de CNAME tiene reintento exponencial (5 min, 15 min, 1h).
- [ ] Falla de SSL muestra mensaje claro al consultor con pasos de remediación.
- [ ] Audit log: theme cambiado, dominio configurado, dominio verificado.
- [ ] Performance: theme cambia sin afectar LCP.
- [ ] Tests verifican que org B no puede cambiar theme de org A.

### Componentes UI nuevos
`ThemeEditor`, `ColorPicker`, `FontSelector`, `LogoUploader`, `DomainWizard`, `DomainStatusBadge`.

---

## Fase 5 — Agent Engine + primer agente real

**Semanas 14-16** · *Depende de Fase 4.*

### Objetivo
El motor de agentes funciona en producción. Un agente concreto (ejemplo: generación de Brand Book) corre asíncronamente, el consultor ve progreso en vivo, aprueba el output, el cliente descarga el deliverable.

### Entregable visual
- **Agency Hub → Proyecto X → Agentes**: lista de agentes disponibles para este proyecto. Botón "Lanzar agente".
- **Modal de lanzamiento**: form con inputs específicos del agente (en este caso: brief de marca, archivos de referencia, tono).
- **Agency Hub → Agent Run #N**: pantalla con timeline en vivo del run (steps con checkmarks, log streaming, métricas en tiempo real).
- **Modal de revisión**: muestra el output generado, botones "Aprobar y publicar" / "Solicitar cambios".
- **Client Portal → Proyecto X → Deliverables**: lista de deliverables aprobados con botón "Descargar".

### Journey demostrable (15-20 min)
1. Consultor → Proyecto Acme → Agentes → "Lanzar Brand Book Agent".
2. Llena form: brief, sube logo de referencia, elige tono "editorial".
3. Click "Lanzar" → ve la pantalla de Agent Run con steps en vivo (Analizando inputs → Generando paleta → Generando tipografías → Componiendo PDF).
4. Mientras corre (~60s), métricas aparecen: tokens consumidos, costo estimado, tiempo restante.
5. Al terminar → botón "Revisar output" → modal con preview del PDF generado.
6. Consultor click "Aprobar y publicar".
7. Cambia a sesión del cliente Acme → Portal → Proyecto → Deliverables → ve "Brand Book.pdf" → descarga.

### Validación binaria
- [ ] Agent run se registra en `agent_runs` con tokens y costo correctos.
- [ ] Progress se actualiza en vivo vía Supabase Realtime (latencia < 1s).
- [ ] Agente que excede 5min sin progreso se marca como `stuck` y notifica.
- [ ] Cancelación de un run en progreso lo detiene limpiamente.
- [ ] Aprobación crea entry en `deliverables` table con storage en Supabase Storage.
- [ ] Cliente solo descarga deliverables aprobados de su org.
- [ ] Audit log: run iniciado, completado, aprobado, descargado.
- [ ] Costo de run dentro del budget esperado del agente.

### Schema clave
```sql
agents (id, name, slug, description, input_schema jsonb, output_schema jsonb, ...)
agent_runs (id, agent_id, project_id, status, input jsonb, output jsonb, tokens_input, tokens_output, cost_usd_estimated, started_at, completed_at, ...)
deliverables (id, project_id, agent_run_id, name, file_url, status, approved_by, approved_at, ...)
```

### Componentes UI nuevos
`AgentLauncher`, `AgentRunTimeline`, `LogStreamer`, `DeliverableCard`, `ApprovalModal`.

---

## Fase 6 — Producto #001 (Landing_Site) deployado + portabilidad demo

**Semanas 17-18** · *Depende de Fase 5.*

### Objetivo
La instance Landing_Site del propio cliente Slowcraft está deployada y operativa en `slowcraft-landing.preview.slowcraft.ai`. Demostración funcional del flujo de "Export & Migrate" mostrando que el cliente puede llevarse su producto a su infraestructura.

### Entregable visual
- **Agency Hub → Cliente Slowcraft → Activar producto Landing_Site**: wizard que dispara el fork del template + configuración + deploy.
- **Pantalla de deploy en vivo**: timeline mostrando "Forkeando repo → Configurando env vars → Deploy inicial → SSL emitido → Listo".
- **Card del producto activo en Client Portal**: estado "Deployado · slowcraft-landing.preview.slowcraft.ai" + botón "Abrir sitio" + botón "Ir al admin del sitio".
- **Pantalla de Export & Migrate**: wizard que entrega el zip del repo + dump de DB + checklist de migración.
- **Demo de migración (simulada)**: descargar el zip, mostrar que tiene los 8 archivos contractuales, el README, el MIGRATION.md.

### Journey demostrable (20 min)
1. Consultor → Cliente Slowcraft → Activar producto → selecciona Landing_Site del catálogo.
2. Wizard pregunta: ¿qué subdominio? → "slowcraft-landing".
3. Click "Crear instance" → ve la pantalla de deploy con timeline en vivo (~2-3 min).
4. Al terminar → muestra URL del sitio: `slowcraft-landing.preview.slowcraft.ai`.
5. Click "Abrir sitio" → se abre el Landing_Site real en otra pestaña, con contenido base.
6. (Demostración) Cliente Slowcraft → Settings → Productos → "Export & Migrate" → click → wizard explica el flujo.
7. Genera el zip → descarga → abre el zip → muestra estructura: README, MIGRATION, ARCHITECTURE, .env.example, código completo, dump SQL.
8. Mensaje: "Este zip puede deployarse en Vercel, Railway o tu propio servidor sin Slowcraft".

### Validación binaria
- [ ] Fork de template a instance del cliente toma < 30 segundos.
- [ ] Deploy inicial completo en < 3 minutos.
- [ ] SSL emitido correctamente para el subdominio.
- [ ] Sitio responde con LCP < 1.5s en medición real (PERFORMANCE.md target).
- [ ] Lighthouse ≥ 95 en el sitio deployado.
- [ ] Export genera zip con los 8 archivos contractuales completos.
- [ ] MIGRATION.md tiene instrucciones específicas para Vercel y Railway.
- [ ] Audit log: producto activado, instance deployada, export solicitado.
- [ ] Repo del fork accesible en GitHub con histórico preservado.

### Cierre del MVP

Al completar el Gate de Fase 6, el MVP está listo para:
- Iterar con feedback de los primeros clientes piloto.
- Iniciar Fase 6 de la visión (observabilidad y escalar) en paralelo.
- Decidir cuándo entrar a Etapa 2 del rollout (tuning con whitelist ampliada).

### Componentes UI nuevos
`ActivationWizard`, `DeploymentTimeline`, `ProductInstanceCard`, `MigrationWizard`.

---

## Demo sessions — protocolo

Al cierre de cada fase, sesión de demo de 30-45 min con la siguiente estructura:

```
1. INTRO (5 min)
   - Recordar el objetivo de la fase.
   - Recordar el journey a demostrar.

2. WALK-THROUGH (15-20 min)
   - Recorrer el journey paso a paso.
   - Mostrar cada pantalla nueva.
   - Explicar decisiones de UX/diseño.

3. VALIDACIÓN (5 min)
   - Recorrer el checklist de validación binaria.
   - Cualquier ítem en rojo bloquea el cierre de fase.

4. FEEDBACK (10-15 min)
   - Rodrigo y stakeholders dan feedback.
   - Anotar issues como tareas para iteración o backlog futuro.

5. DECISIÓN (2 min)
   - Cierre de fase: ¿avanzamos o iteramos?
   - Si iteramos: timeboxed a 1 semana max.
```

Cada demo se graba (con permiso) para referencia y para mostrar a clientes piloto.

---

## Riesgos por fase

| Fase | Riesgo principal | Mitigación |
|---|---|---|
| 0 | Setup tarda más de 2 semanas | Playbook detallado en RUNBOOK; bloqueos con asistencia inmediata |
| 1 | Email de invitación filtrado por spam | Resend con DKIM/SPF correctos; dominio verificado; tests con Gmail/Outlook |
| 2 | Catálogo administrable confuso de usar | UX simplificada con Wizards; defaults sensatos |
| 3 | Webhooks de Stripe fallan en preview | Stripe CLI listener para local; tests E2E con webhook fixtures |
| 4 | Custom domains no resuelven SSL | Validar wildcard SSL en Fase 0 con dominio de prueba |
| 5 | Agente excede budget de tokens | Hard limit por run + alerta a super_admin |
| 6 | Migración del landing actual rompe sitio en prod | Mantener landing actual en GitHub Pages 14 días post-cutover |

---

## Cómo se evalúa el progreso semanal

Independiente de las demos de fase, cada lunes:

- **Burndown:** % de tareas completadas vs planeadas para la fase actual.
- **Métricas técnicas:** Lighthouse scores, bundle size, error rate (Sentry), agent run cost.
- **Issues abiertos:** triage por severidad.
- **Decisiones pendientes:** lista de cosas que necesitan input de Rodrigo.

Reporte de 1 página enviado por email los lunes.

---

## Después del MVP (Fase 7+)

Fuera del scope de las 18 semanas, pero en backlog:

- Sistema de feedback loops (los flujos 35-45 del UX Pilot).
- Propagación automática de mejoras de templates a forks.
- Catálogo público de productos y onboarding self-serve.
- Agentes adicionales (más allá del primero).
- Integración con MCPs externos.
- App móvil con Expo.
- Sub-marcas o spin-offs de la Plataforma.

---

*ROADMAP.md · v1.0 · Mayo 2026 · Slowcraft Platform · 7 fases × 18 semanas × 1 producto vivo al cierre*
