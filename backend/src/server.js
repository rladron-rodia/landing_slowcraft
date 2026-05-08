// Slowcraft API · Express + Postgres + Resend SMTP
// Fase 1: endpoint público de contacto.
// Próximas fases (TODO):
//   - /api/admin/login + sesión
//   - /api/admin/leads (CRUD)
//   - /api/content (público) + /api/admin/content (CRUD para CMS de textos/CTAs)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { pool, query } from './db.js';
import { sendContactEmail } from './email.js';

const app = express();
const PORT = Number(process.env.PORT || 8080);

// ---------- Trust proxy (Render usa proxy delante) ----------
app.set('trust proxy', 1);

// ---------- Hardening ----------
app.use(helmet({
  contentSecurityPolicy: false  // la API no sirve HTML público todavía
}));
app.use(express.json({ limit: '32kb' }));

// ---------- CORS ----------
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin (origin, cb) {
    // requests sin Origin (curl, server-to-server) → permitir
    if (!origin) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origen no permitido: ' + origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false
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

  // Disparar email — si falla, igual respondemos OK (el lead ya está guardado).
  // Marcamos email_error en la DB para retry manual desde el admin.
  try {
    await sendContactEmail(lead, {
      created_at: lead.created_at,
      ip, user_agent: userAgent, referrer
    });
    await query('UPDATE leads SET email_sent_at = NOW() WHERE id = $1', [lead.id]);
  } catch (err) {
    console.error('[contact] email error:', err);
    await query('UPDATE leads SET email_error = $1 WHERE id = $2', [String(err.message || err).slice(0, 500), lead.id]);
    // No le decimos al usuario que el email falló — su lead se guardó OK.
  }

  res.json({ ok: true, leadId: lead.id });
});

// ---------- 404 + error handler ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[server] error no capturado:', err);
  res.status(500).json({ error: 'Error interno' });
});

// ---------- Start ----------
const server = app.listen(PORT, () => {
  console.log(`[server] escuchando en puerto ${PORT}`);
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
