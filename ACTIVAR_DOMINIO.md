# ACTIVAR_DOMINIO — slowcraft.ai

> Checklist para activar `slowcraft.ai` (apex + www + api) apuntando al stack legacy
> (GitHub Pages + Render). DNS se queda en GoDaddy. Email verificado en Resend.
>
> **Tiempo estimado:** 1-2 horas activas + 30 min a 24 h de propagación DNS.
>
> **Cero riesgo de downtime** del landing actual: hasta que la propagación termine,
> los visitantes a `slowcraft.ai` no pegan a nada (hoy ya es así); los del dominio
> github.io siguen viendo el sitio. Y la API en `slowcraft-api.onrender.com` sigue
> respondiendo en paralelo a `api.slowcraft.ai` durante la migración.

**Snapshot:** 2026-05-10 · post-Fase B
**Owner:** Rodrigo

---

## Pre-flight checklist

Antes de empezar, ten a la mano:

- [ ] Acceso a [GoDaddy DNS](https://dcc.godaddy.com/control/portfolio) para `slowcraft.ai`.
- [ ] Acceso a [GitHub Settings → Pages](https://github.com/rladron-rodia/landing_slowcraft/settings/pages) del repo.
- [ ] Acceso al dashboard de [Render](https://dashboard.render.com) → servicio `slowcraft-api`.
- [ ] Cuenta de [Resend](https://resend.com/domains) con permiso para agregar dominios.
- [ ] Branch `feat/template-migration` con los commits de Fase A + B + los cambios del dominio.

---

## 1. GoDaddy DNS — registros del apex y www

Dashboard → My Products → `slowcraft.ai` → DNS → DNS Management.

**Borra cualquier A o CNAME existente para `@` y `www`** (los que vienen por default de GoDaddy parking).

### 1.1 Apex `slowcraft.ai` → GitHub Pages (4 A records)

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `185.199.108.153` | 1 hour |
| A | @ | `185.199.109.153` | 1 hour |
| A | @ | `185.199.110.153` | 1 hour |
| A | @ | `185.199.111.153` | 1 hour |

(Estas 4 IPs son las oficiales de GitHub Pages. Si en el futuro cambian, GitHub
las anuncia en su [docs de custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain).)

### 1.2 `www.slowcraft.ai` → GitHub Pages (CNAME)

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | www | `rladron-rodia.github.io.` | 1 hour |

(Nota el punto final en el value — GoDaddy lo agrega automático si lo omites.)

### 1.3 `api.slowcraft.ai` → Render (CNAME, paso 3.1 lo configura)

Este CNAME lo agregas DESPUÉS de paso 3.1 (Render te dará el target exacto). Por
ahora, déjalo pendiente.

---

## 2. GitHub Pages — Custom domain

### 2.1 Verificar que `CNAME` existe en el repo

Después del merge de `feat/template-migration` a `main`, debe existir el archivo
`CNAME` en la raíz con contenido `slowcraft.ai`. Verifica:

```bash
cat CNAME
# debe mostrar: slowcraft.ai
```

### 2.2 Configurar en GitHub Settings

1. Ir a [Settings → Pages](https://github.com/rladron-rodia/landing_slowcraft/settings/pages).
2. **Source:** Deploy from a branch · `main` · `/ (root)`.
3. **Custom domain:** ingresa `slowcraft.ai` → Save.
4. GitHub valida el dominio (usa el archivo `CNAME` o pregunta al DNS). Esto
   puede tomar 5-10 minutos tras los DNS records.
5. Una vez validado, marca **Enforce HTTPS** (la opción aparece tras la validación
   exitosa; certificate via Let's Encrypt automático).

### 2.3 Verificar

```bash
# Tras 5-30 minutos:
curl -I https://slowcraft.ai
# Debe responder HTTP/2 200 con headers de GitHub Pages.

curl -I https://www.slowcraft.ai
# Idem (302 redirect a apex también es válido).
```

---

## 3. Render — Custom domain para `api.slowcraft.ai`

### 3.1 Agregar el dominio en Render

1. [Dashboard Render](https://dashboard.render.com) → `slowcraft-api` → **Settings** → **Custom Domain**.
2. Click **Add Custom Domain** → ingresa `api.slowcraft.ai`.
3. Render te da un **CNAME target** que se ve así: `slowcraft-api.onrender.com` (con tu propio prefijo si aplica).
4. Copia ese target.

### 3.2 Volver a GoDaddy y agregar el CNAME de la API

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | api | `<el target que dio Render>` | 1 hour |

(Suele ser `slowcraft-api.onrender.com` — verifica el exacto que muestra Render.)

### 3.3 Validar en Render

Render verifica DNS automáticamente cada minuto. Cuando detecte el CNAME, marca
el dominio como **Verified** y emite SSL (Let's Encrypt) automáticamente. Toma
5-15 minutos.

### 3.4 Actualizar env vars en Render

Settings → **Environment** → editar:

| Var | Nuevo valor |
|---|---|
| `APP_BASE_URL` | `https://api.slowcraft.ai` |
| `ALLOWED_ORIGINS` | `https://slowcraft.ai,https://www.slowcraft.ai,https://rladron-rodia.github.io,http://localhost:8000,http://localhost:3000` |
| `CONTACT_FROM_EMAIL` | `Slowcraft <noreply@slowcraft.ai>` (espera a paso 4) |
| `CONTACT_TO_EMAIL` | `hola@slowcraft.ai` |

Guardar dispara redeploy automático. Tras el redeploy:

```bash
curl https://api.slowcraft.ai/healthz
# {"ok":true,"ts":"..."}
```

---

## 4. Resend — verificar dominio `slowcraft.ai`

### 4.1 Agregar el dominio en Resend

1. [Resend Dashboard → Domains](https://resend.com/domains) → **Add Domain**.
2. Ingresa `slowcraft.ai` → región `us-east-1` (o la que usas).
3. Resend te da 3-4 records DNS:
   - **MX** para `send.slowcraft.ai` → `feedback-smtp.us-east-1.amazonses.com` (priority 10)
   - **TXT** para `send.slowcraft.ai` → `v=spf1 include:amazonses.com ~all`
   - **TXT** (DKIM) para `resend._domainkey.slowcraft.ai` → un valor largo `p=...`
   - **TXT** (DMARC, opcional pero recomendado) para `_dmarc.slowcraft.ai` → `v=DMARC1; p=none;`

### 4.2 Agregar esos records en GoDaddy

GoDaddy → DNS Management → Add. **Importante:** GoDaddy recorta el "name" en
algunos casos — si el record es para `send.slowcraft.ai`, escribe solo `send`
en el campo Name (GoDaddy le agrega `.slowcraft.ai` solo).

| Type | Name | Value | TTL |
|---|---|---|---|
| MX | send | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | 1 hour |
| TXT | send | `v=spf1 include:amazonses.com ~all` | 1 hour |
| TXT | resend._domainkey | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4...` (el value largo) | 1 hour |
| TXT | _dmarc | `v=DMARC1; p=none;` | 1 hour |

### 4.3 Verificar en Resend

Volver a Resend → click **Verify Domain**. Tarda 5-30 minutos en propagar.
Cuando los 3 records estén verdes ✅, puedes usar `noreply@slowcraft.ai` como
remitente.

### 4.4 Test del email

```bash
# Desde el sitio (con el form), o vía API:
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Slowcraft <noreply@slowcraft.ai>",
    "to": "tu-email-personal@gmail.com",
    "subject": "Test domain verified",
    "html": "<p>Si recibes esto y no fue a spam, dominio verificado correctamente.</p>"
  }'
```

---

## 5. Update env vars locales (para devs)

Cualquier dev que tenga `backend/.env` local debe actualizar:

```env
APP_BASE_URL=https://api.slowcraft.ai
ALLOWED_ORIGINS=https://slowcraft.ai,https://www.slowcraft.ai,https://rladron-rodia.github.io,http://localhost:8000,http://localhost:3000
CONTACT_FROM_EMAIL=Slowcraft <noreply@slowcraft.ai>
CONTACT_TO_EMAIL=hola@slowcraft.ai
```

(Para dev local, `APP_BASE_URL=http://localhost:8080` — el de prod solo va en Render.)

Para `template-next/.env.local`:

```env
NEXT_PUBLIC_CONTACT_ENDPOINT=https://api.slowcraft.ai/api/contact
NEXT_PUBLIC_SITE_URL=https://slowcraft.ai
```

---

## 6. Validación post-cutover

Cuando todo esté propagado (puede tomar hasta 24-48h en el peor caso, pero
típicamente 1-4h con TTL bajo):

### 6.1 Smoke tests

```bash
# 1. Apex resuelve
curl -I https://slowcraft.ai
# → HTTP/2 200, server: GitHub.com

# 2. www redirect
curl -I https://www.slowcraft.ai
# → HTTP/2 200 o 301 al apex

# 3. API healthz
curl https://api.slowcraft.ai/healthz
# → {"ok":true,...}

# 4. CORS desde el dominio nuevo (debe responder OK)
curl -i -X OPTIONS https://api.slowcraft.ai/api/contact \
  -H "Origin: https://slowcraft.ai" \
  -H "Access-Control-Request-Method: POST"
# → 204 con header Access-Control-Allow-Origin: https://slowcraft.ai

# 5. Form end-to-end (POST real)
curl -X POST https://api.slowcraft.ai/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://slowcraft.ai" \
  -d '{
    "nombre":"Test Apellido",
    "email":"test@empresa.com",
    "cargo":"CTO",
    "empresa_web":"empresa.com",
    "motivo":"proyectos",
    "descripcion":"Test post-cutover de dominio. Por favor ignorar este lead."
  }'
# → {"ok":true,"leadId":N}
# Verificar en /admin/dashboard que aparece y email llegó a hola@slowcraft.ai.
```

### 6.2 Lighthouse + SEO

```bash
# Lighthouse (instalar si no): npm install -g lighthouse
lighthouse https://slowcraft.ai --view
# Verificar Performance ≥ 90 (debe estar similar a antes — solo cambió la URL).

# Search Console URL Inspection (manual)
# https://search.google.com/search-console → URL Inspection → https://slowcraft.ai
# Pedir reindex.
```

### 6.3 OG cards

Probar share en LinkedIn, Twitter, WhatsApp:
- LinkedIn: https://www.linkedin.com/post-inspector/
- Twitter / X: https://cards-dev.twitter.com/validator (o Twitter Card Validator)
- WhatsApp: enviar el link a un chat de prueba, ver el preview.

---

## 7. Rollback (si algo se rompe)

Si tras propagación el sitio no carga o hay errores:

1. **GitHub Pages:** Settings → Pages → Custom domain → eliminar → save.
   El sitio vuelve a `rladron-rodia.github.io/landing_slowcraft/`.
2. **Render:** Settings → Custom Domain → eliminar `api.slowcraft.ai`.
   La API sigue en `slowcraft-api.onrender.com`.
3. **GoDaddy DNS:** revertir los records (GoDaddy guarda historial — Settings → 
   DNS → recientemente modificados).
4. Revertir cambios en repo: `git revert <commit>` del commit del dominio.
5. En `index.html`, las URLs en JSON-LD/canonical/OG vuelven a `rladron-rodia.github.io`.

Tiempo de rollback: 5-15 min para los dashboards + propagación DNS hasta 1h.

---

## 8. Cierre — tag y comunicación

Cuando todo esté validado:

```bash
# Desde la raíz del repo, en main (post-merge de feat/template-migration):
git tag -a v0.14.0 -m "feat: activate slowcraft.ai custom domain (apex + www + api)

- DNS records en GoDaddy (apex 4 A, www CNAME, api CNAME).
- GitHub Pages custom domain con HTTPS.
- Render custom domain api.slowcraft.ai con SSL automático.
- Resend domain verified (DKIM + SPF + DMARC).
- index.html, 404, sitemap, robots actualizados con URLs nuevas.
- backend env vars actualizadas (APP_BASE_URL, ALLOWED_ORIGINS, CONTACT_*)."

git push origin v0.14.0
```

(`v0.14.0` reservamos el `v1.0.0` para el cutover a `template-next/` Cloudflare Pages.)

Comunicar:
- Update LinkedIn / pitch deck si tienen el URL del landing.
- Update firma de email de Slowcraft.
- Notificar a clientes existentes del dominio nuevo.

---

## 9. Coordinación con `template-next/` (Fase C)

Esta activación es **compatible con la Fase C** (cutover a Next.js). Cuando
estemos listos:

1. Preview de `template-next/` en Cloudflare Pages (`template-next.pages.dev`).
2. Validar paridad visual contra `slowcraft.ai` (que ya estará en producción).
3. En Cloudflare DNS (cuando migremos GoDaddy → Cloudflare): reapuntar el A
   record del apex a Cloudflare Pages en lugar de GitHub Pages.
4. Validar 24h, mantener GitHub Pages como rollback durante 14 días.
5. Tag `v1.0.0`.

La API en `api.slowcraft.ai` no se mueve — sigue apuntando a Render. Solo el
landing público cambia de origin.

---

*ACTIVAR_DOMINIO.md · v1.0 · 2026-05-10 · Rodrigo*
