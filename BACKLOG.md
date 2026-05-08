# Slowcraft — Backlog

Cosas pendientes / ideas. Se priorizan por iteración.

## Próximo

- **Chat widget de WhatsApp** — el botón "Contáctanos por WhatsApp" en el form de contacto hoy muestra un toast "próximamente". Hay que conectar un widget tipo chat embebido (no abrir `wa.me/PHONE` directo, sino una ventana custom dentro del sitio). Ubicación del handler: `index.html` → buscar `cf-whatsapp` en el JS. Decisión pendiente: usar un widget existente (Chaty, WhatsApp Web Embed, etc.) o construir uno propio que respete el design system.

## Fase 3 — CMS de textos/CTAs

- Tabla `content_blocks` (sección + clave + valor) en Postgres.
- Endpoints públicos (read) + admin (CRUD).
- Pre-cargar el contenido actual del `index.html` como seed.
- Landing fetch del contenido al cargar, con fallback hardcoded.
- Admin con editor por sección dentro del dashboard actual.

## Fase 4 — Polish operacional

- Cron-job.org cada 14 min pingueando `/healthz` para evitar cold starts (free Render se duerme tras 15 min).
- Exportar leads a CSV desde el dashboard (botón "Download" en `/admin/dashboard`).
- Filtros bulk: marcar varios leads como `closed` o `spam` de una vez.
- Notificación a Slack cuando llega un lead nuevo (webhook simple en el handler de `/api/contact`).
- Audit log expandido: ver desde el admin todas las acciones del admin (ya tenemos `lead_events` para leads, falta una tabla `admin_events` para login/logout/password-reset).

## Producción

- Configurar dominio real `slowcraft.ai`:
  - Migrar DNS de GoDaddy a Cloudflare (recomendado).
  - Apex `slowcraft.ai` → A records de GitHub Pages.
  - `www.slowcraft.ai` → CNAME a `rladron-rodia.github.io`.
  - `api.slowcraft.ai` → CNAME a `slowcraft-api.onrender.com` (custom domain en Render).
  - Verificar dominio en Resend (TXT/MX records).
  - Cambiar en Render Environment: `CONTACT_FROM_EMAIL` → `Slowcraft <noreply@slowcraft.ai>`, `CONTACT_TO_EMAIL` → `hola@slowcraft.ai`, `APP_BASE_URL` → `https://api.slowcraft.ai`, sumar nuevo origen al `ALLOWED_ORIGINS`.
  - Actualizar `index.html` para que `window.SLOWCRAFT_FORM_ENDPOINT` apunte a `https://api.slowcraft.ai/api/contact`.
  - Archivo `CNAME` en la raíz del repo con `slowcraft.ai`.

## Mejoras posibles

- Auto-respuesta al usuario cuando envía el formulario (email confirmando que recibimos su mensaje).
- reCAPTCHA o Cloudflare Turnstile si el honeypot no es suficiente.
- Multi-admin (tabla `admin_users` ya soporta múltiples; falta UI de gestión).
- Internacionalización (botón EN/ES ya está como placeholder en el nav).
- Dark mode (paleta DS ya tiene los tokens; falta el toggle y los overrides).
