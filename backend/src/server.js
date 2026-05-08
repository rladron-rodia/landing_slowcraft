// Slowcraft API · Express + Postgres + Resend HTTP API
// Fase 1: endpoint público de contacto.
// Fase 2: admin con login + dashboard de leads.
// Próxima fase (TODO):
//   - /api/content (público) + /api/admin/content (CRUD para CMS de textos/CTAs)

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { pool, query } from './db.js';
import { sendContactEmail } from './email.js';
import adminRouter from './routes/admin.js';
import { bootstrapFromEnv } from './services/admin-users.js';
import { getPublicContent } from './services/content.js';
import { getPublicCatalogs } from './services/catalog.js';
import { getPublicSettings } from './services/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 8080);

// ---------- Trust proxy (Render usa proxy delante) ----------
app.set('trust proxy', 1);

// ---------- Hardening ----------
app.use(helmet({
  contentSecurityPolicy: false  // habilitamos inline script en /admin (HTML server-served)
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

// ---------- CORS ----------
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
// Permitir same-origin (admin servido desde el mismo dominio)
const SELF_ORIGIN = (process.env.APP_BASE_URL || '').replace(/\/$/, '');

app.use(cors({
  origin (origin, cb) {
    // requests sin Origin (curl, server-to-server) → permitir
    if (!origin) return cb(null, true);
    // same-origin (admin pages → propios endpoints)
    if (SELF_ORIGIN && origin === SELF_ORIGIN) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origen no permitido: ' + origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true   // requerido para que el browser mande la cookie de sesión
}));

// ---------- Health ----------
app.get('/healthz', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'db_unhealthy' });
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'slowcraft-api', version: '0.1.0', status: 'ok' });
});

// ============================================================
// GET /api/content — público (la landing fetchea esto)
// Cacheable: el contenido cambia poco
// ============================================================
app.get('/api/content', async (_req, res) => {
  try {
    const [content, catalogs, settings] = await Promise.all([
      getPublicContent(),
      getPublicCatalogs(),
      getPublicSettings()
    ]);
    // Sin cache para que los cambios del admin se vean inmediato
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ ...content, catalogs, settings, _ts: Date.now() });
  } catch (err) {
    console.error('[api/content]', err);
    res.status(500).json({ error: 'Error obteniendo contenido' });
  }
});

// ============================================================
// Validación servidor (defensa en profundidad — duplica el cliente)
// ============================================================
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com','googlemail.com','yahoo.com','yahoo.com.mx','yahoo.es',
  'hotmail.com','hotmail.es','hotmail.com.mx','outlook.com','outlook.es',
  'live.com','msn.com','icloud.com','me.com','aol.com','protonmail.com',
  'proton.me','tutanota.com','mail.com','gmx.com','yandex.com','zoho.com'
]);

const ALLOWED_MOTIVOS = new Set(['proyectos','informes','bolsa-de-trabajo']);

function validatePayload (p) {
  const errors = {};
  if (!p || typeof p !== 'object') return { errors: { _: 'Payload inválido' } };

  const nombre = String(p.nombre || '').trim();
  if (!nombre || nombre.length < 3 || nombre.length > 80 || !/\s/.test(nombre)) {
    errors.nombre = 'Nombre completo inválido';
  }

  const email = String(p.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Email inválido';
  } else if (FREE_EMAIL_DOMAINS.has(email.split('@')[1])) {
    errors.email = 'Usar email corporativo';
  }

  const cargo = String(p.cargo || '').trim();
  if (!cargo || cargo.length < 2 || cargo.length > 80) {
    errors.cargo = 'Cargo inválido';
  }

  const empresaWebRaw = String(p.empresa_web || '').trim();
  const empresaWeb = empresaWebRaw.startsWith('http') ? empresaWebRaw : 'https://' + empresaWebRaw;
  const stripped = empresaWebRaw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(stripped)) {
    errors.empresa_web = 'Sitio web inválido';
  }

  if (!ALLOWED_MOTIVOS.has(p.motivo)) {
    errors.motivo = 'Motivo inválido';
  }

  const descripcion = String(p.descripcion || '').trim();
  if (!descripcion || descripcion.length < 20 || descripcion.length > 1000) {
    errors.descripcion = 'Descripción inválida';
  }

  if (Object.keys(errors).length) return { errors };
  return { ok: true, data: { nombre, email, cargo, empresa_web: empresaWeb, motivo: p.motivo, descripcion } };
}

// ============================================================
// POST /api/contact
// ============================================================

const contactLimiter = rateLimit({
  windowMs: 60_000,    // 1 min
  max: 5,              // 5 requests por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá un momento.' }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  // Honeypot — bots completan campos invisibles
  if (req.body && req.body.website) {
    return res.json({ ok: true });  // respuesta falsa de éxito
  }

  const v = validatePayload(req.body);
  if (!v.ok) {
    return res.status(400).json({ error: 'Validación fallida', fields: v.errors });
  }

  const ip = req.ip || req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || null;
  const userAgent = req.get('User-Agent') || null;
  const referrer = (req.body._meta && req.body._meta.referrer) || req.get('Referer') || null;

  let lead;
  try {
    const insert = await query(
      `INSERT INTO leads (nombre, email, cargo, empresa_web, motivo, descripcion, ip, user_agent, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, created_at, nombre, email, cargo, empresa_web, motivo, descripcion`,
      [v.data.nombre, v.data.email, v.data.cargo, v.data.empresa_web, v.data.motivo, v.data.descripcion, ip, userAgent, referrer]
    );
    lead = insert.rows[0];
  } catch (err) {
    console.error('[contact] db insert error:', err);
    return res.status(500).json({ error: 'Error guardando el contacto' });
  }

  // ✨ Respondemos al usuario INMEDIATAMENTE.
  // El email es fire-and-forget — si falla, queda registrado en la columna
  // email_error para retry manual desde el admin. El usuario no tiene que
  // esperar al SMTP.
  res.json({ ok: true, leadId: lead.id });

  // Audit: log de creación (no bloqueante)
  query(
    `INSERT INTO lead_events (lead_id, event_type, new_value, actor) VALUES ($1, 'created', $2, 'system')`,
    [lead.id, lead.motivo]
  ).catch(err => console.error(`[contact] lead #${lead.id} no pude loggear created:`, err.message));

  console.log(`[contact] lead #${lead.id} guardado. Disparando email…`);
  sendContactEmail(lead, {
    created_at: lead.created_at,
    ip, user_agent: userAgent, referrer
  })
    .then(async () => {
      await query('UPDATE leads SET email_sent_at = NOW() WHERE id = $1', [lead.id]);
      await query(
        `INSERT INTO lead_events (lead_id, event_type, actor) VALUES ($1, 'email_sent', 'system')`,
        [lead.id]
      );
      console.log(`[contact] lead #${lead.id} email enviado ✓`);
    })
    .catch(async (err) => {
      const msg = String(err.message || err).slice(0, 500);
      console.error(`[contact] lead #${lead.id} email error:`, msg);
      try {
        await query('UPDATE leads SET email_error = $1 WHERE id = $2', [msg, lead.id]);
        await query(
          `INSERT INTO lead_events (lead_id, event_type, new_value, actor) VALUES ($1, 'email_failed', $2, 'system')`,
          [lead.id, msg]
        );
      } catch (dbErr) {
        console.error(`[contact] lead #${lead.id} no pude registrar email_error:`, dbErr.message);
      }
    });
});

// ============================================================
// Admin · API + estáticos
// ============================================================
app.use('/api/admin', adminRouter);

// El admin es servido como estáticos desde /admin
const ADMIN_DIR = join(__dirname, 'public', 'admin');
app.use('/admin', express.static(ADMIN_DIR, { extensions: ['html'] }));
// Default: si pegan /admin sin nada, redirigimos al login (la página decide a dónde según sesión)
app.get('/admin', (_req, res) => res.redirect('/admin/login'));

// ---------- 404 + error handler ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[server] error no capturado:', err);
  res.status(500).json({ error: 'Error interno' });
});

// ---------- Start ----------
const server = app.listen(PORT, async () => {
  console.log(`[server] escuchando en puerto ${PORT}`);
  // Bootstrap del admin desde env vars si la DB está vacía
  try {
    await bootstrapFromEnv();
  } catch (err) {
    console.error('[server] bootstrap admin falló:', err.message);
  }
});

// Shutdown limpio
const shutdown = (signal) => {
  console.log(`[server] ${signal} recibido. Cerrando…`);
  server.close(() => {
    pool.end().then(() => process.exit(0)).catch(() => process.exit(1));
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
