# Slowcraft — Backlog

Pendientes y mejoras futuras.

## Próximo

- **Chat widget de WhatsApp** — el botón "Contáctanos por WhatsApp" hoy muestra un toast "próximamente". Hay que conectar un widget tipo chat embebido (no abrir `wa.me/PHONE` directo, sino una ventana custom dentro del sitio respetando el design system).

## Producción

- **Configurar dominio real `slowcraft.ai`:**
  - Migrar DNS de GoDaddy a Cloudflare (recomendado).
  - Apex `slowcraft.ai` → A records de GitHub Pages.
  - `www.slowcraft.ai` → CNAME a `rladron-rodia.github.io`.
  - `api.slowcraft.ai` → CNAME a `slowcraft-api.onrender.com` (custom domain en Render).
  - Verificar dominio en Resend (TXT/MX records).
  - En Render Environment: cambiar `CONTACT_FROM_EMAIL` → `Slowcraft <noreply@slowcraft.ai>`, `CONTACT_TO_EMAIL` → `hola@slowcraft.ai`, `APP_BASE_URL` → `https://api.slowcraft.ai`, agregar dominio nuevo a `ALLOWED_ORIGINS`.
  - En `index.html` actualizar `window.SLOWCRAFT_FORM_ENDPOINT` → `https://api.slowcraft.ai/api/contact`.
  - Archivo `CNAME` en raíz del repo con `slowcraft.ai`.
  - Tag `v1.0.0` cuando esté en producción real.

## Polish operacional (Fase 4)

- **Cron warm-up** — cron-job.org cada 14 min pingueando `/healthz` para evitar cold starts del free tier de Render.
- **Exportar leads a CSV** desde el dashboard (botón "Download" con filtros aplicados).
- **Bulk actions en leads** — marcar varios como `closed` o `spam` de una vez.
- **Notificación a Slack** cuando llega un lead nuevo (webhook simple en `/api/contact`).
- **Audit log expandido** — tabla `admin_events` para login/logout/password-reset (hoy solo trackeamos lead changes en `lead_events`).
- **Reorder visual con drag-and-drop** — actualmente el `display_order` se edita en modal. Mejor con drag.

## Mejoras posibles

- **Auto-respuesta al usuario** cuando envía el form (email confirmando recepción).
- **reCAPTCHA o Cloudflare Turnstile** si el honeypot no es suficiente con tráfico real.
- **Multi-admin** — la tabla `admin_users` ya soporta múltiples; falta UI de gestión de usuarios admin.
- **Dark mode** — la paleta DS ya tiene tokens; falta el toggle y los overrides.
- **Editor WYSIWYG** para campos `value_type='html'` (hoy se edita HTML crudo en textarea).
- **Validación de imágenes / favicon** administrable.
- **SEO en admin** — campos para meta description, OG image, etc.
- **Export GTM container preset** — generar un JSON descargable con triggers + tags pre-configurados para los eventos del sitio.

## Cosas hechas

- ✅ v0.1.0 — Baseline arquitectura
- ✅ v0.2.0 — Design system v2.0
- ✅ v0.3.0 — Form + backend Render + Resend
- ✅ v0.4.0 — Admin + dashboard leads + reset password
- ✅ v0.5.0 — i18n ES/EN + UX form polish
- ✅ v0.6.0 — Catálogos CRUD (Programs/Servicios/Método)
- ✅ v0.7.0 — Clone + CTA labels + Configuración tab
- ✅ v0.8.0 — Nueva jerarquía menús + GTM events + fix fases bug
