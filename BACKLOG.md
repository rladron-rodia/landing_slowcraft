# Slowcraft — Backlog

Pendientes y mejoras futuras.

## Próximo

- **Dashboards adicionales propuestos** (datos disponibles, falta UI):
  - ⏱ **Tiempo de respuesta promedio** — Δ entre `created_at` y primer cambio de status; útil para SLA del equipo comercial.
  - 🏢 **Top empresas / dominios** — `empresa_web` agrupado, ranking; útil para account-based marketing.
  - 📅 **Pipeline aging** — leads agrupados por días en cada status (qué leads están "estancados"); útil para alertas.
  - 📧 **Salud del email** — % `email_sent_at` vs `email_error`; detectar problemas de deliverability con Resend.
  - 🌎 **Geografía** — `ip` resuelto a país/región (necesita geo-IP service como ipapi o ipinfo).
  - 📈 **Tendencia mensual de conversion rate** — % de leads que llegan a `contacted` o `closed` por mes.

- **GA4 Data API real** — los charts de Analítica hoy muestran **datos del backend (leads)** que es mucho mejor que mockups, pero falta integración con GA4 para ver comportamiento del sitio (visitas, sources, dispositivos, eventos cta_click). Hay 2 caminos: (a) Looker Studio embed (~30min, no-code), (b) GA4 Data API directa con service account (~2-3h). Guía dentro del tab Analítica.

- **WhatsApp chatbot + chat IA embebido** — el setting `whatsapp.mode` ya está preparado. Hoy soporta `link` (abre wa.me en pestaña nueva). Próximo modo `chatbot`:
  - Widget de chat embebido en la landing (no abrir wa.me, sino ventana dentro del sitio).
  - Backend con WhatsApp Business API (Meta Cloud API o Twilio) para recibir y responder.
  - LLM-powered (Claude API o GPT-4): pre-qualifica leads, responde FAQs, agenda demos.
  - Hook de salida: cuando el bot detecta intención de compra/contacto, escala a humano vía email + dashboard de admin.
  - Persistir conversaciones en una nueva tabla `chat_sessions` para review posterior.
  - Implementación sugerida en fases: (a) widget UI mock, (b) backend que reenvía a un humano vía email, (c) integración WA Business API, (d) capa LLM.
- **True self-hosting de fuentes** — actualmente jsdelivr CDN (sin Google tracking). Para 100% offline-capable, correr `bash scripts/download-fonts.sh` (descarga 8 .woff2 a `/fonts/`), después actualizar `index.html` para usar paths relativos `fonts/{file}.woff2`, eliminar `<link rel='preload'>` y `<link rel='preconnect'>` apuntando a jsdelivr, commit + push.

## Follow-ups inmediatos (post v0.14.0)

- **Soportar multi-destinatario en `CONTACT_TO_EMAIL`** — `backend/src/email.js` línea 105 hoy hace `to: process.env.CONTACT_TO_EMAIL` y pasa el string raw. Cambiar a `to: process.env.CONTACT_TO_EMAIL.split(',').map(s => s.trim()).filter(Boolean)` para permitir `hola@slowcraft.ai, rladron@gmail.com`. Tag sugerido `v0.14.1`.
- **Montar inbox `hola@slowcraft.ai`** — Resend solo envía, no recibe. Opciones: Google Workspace (~$6/mes), Zoho (free 5 usuarios), Fastmail (~$3/mes). Agregar MX records de recepción en GoDaddy, crear el usuario, y reapuntar `CONTACT_TO_EMAIL` (después del multi-destinatario, idealmente a `hola@slowcraft.ai` + `rladron@gmail.com`).
- **Auto warm-up de Render free tier** — `/healthz` cada 14 min vía cron-job.org o GitHub Actions schedule.

## Producción — Fase C (cutover a Next.js)

Activación del dominio terminada en `v0.14.0`. Lo siguiente es cambiar el origen público de GitHub Pages (`index.html` legacy) a Cloudflare Pages (`template-next/`):

- Preview de `template-next/` en Cloudflare Pages → `template-next.pages.dev`.
- Validar paridad visual contra `slowcraft.ai` (Lighthouse ≥ 95, form end-to-end, dataLayer events idénticos).
- Reapuntar los 4 A records del apex de GitHub Pages a Cloudflare Pages (cuando se migre DNS a Cloudflare; o seguir en GoDaddy si quieres).
- 14 días de monitoreo con GitHub Pages como fallback.
- Tag `v1.0.0`.

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
- ✅ v0.9.0 — SEO completo (OG, Twitter, Schema JSON-LD, robots, sitemap, hreflang) + a11y (focus-visible, prefers-reduced-motion) + favicon SVG + 404 personalizada + WhatsApp/social administrables
- ✅ v0.10.0 — Fonts vía jsdelivr CDN (sin Google tracking) + WCAG AA contrast (piedra/piedra-soft ajustados) + script para true self-hosting opcional
- ✅ v0.11.0 — WhatsApp config administrable (slug renombrado + business label + mode futuro chatbot) + true self-hosted fonts en /fonts/
- ✅ v0.12.0 — Sistema de usuarios y roles (master_admin/admin/viewer/content/commercial) + invitación por email con verificación + tab Usuarios + tab Analítica con propuesta de dashboards + role-based UI filtering + read-only mode
- ✅ v0.13.0 — Rol `agente` + asignación de leads a agente + tab Analítica con charts reales (leads/período, motivo, status, performance por agente) + filtros por agente + Chart.js dinámico
- ✅ v0.13.1 — Mobile-first admin: top nav y sub-tabs swipeables, tablas con scroll horizontal sangrado al borde, charts apilan en mobile, drawer/modal/forms adaptados, breakpoint extra ≤480px
- ✅ v0.14.0 — Activación de dominio `slowcraft.ai` (apex + www + api) con SSL Let's Encrypt en GitHub Pages, custom domain en Render para api, Resend verified (DKIM+SPF+MX). Fase A + Fase B mergeadas (Conventional Commits, commitlint, husky, gitleaks, GitHub Actions, `platform-docs/`, `template-next/` Next.js 15 + TS + Tailwind v4 scaffold completo). `CONTACT_TO_EMAIL=rladron@gmail.com` temporal hasta montar inbox `hola@slowcraft.ai`.
