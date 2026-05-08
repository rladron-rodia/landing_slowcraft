// Endpoints del admin.
// Todas las rutas excepto /login, /forgot, /reset, /logout requieren auth (cookie de sesión válida).

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query, withClient } from '../db.js';
import {
  verifyPassword, signSession, cookieOptions, requireAuth, requireRole, requireEditor, SESSION_COOKIE
} from '../auth.js';
import {
  listUsers, inviteUser, verifyInvitationToken, completeInvitation,
  updateRole as updateUserRole, setActive, deleteUser, resendInvitation, touchLastLogin,
  rolePermissions, VALID_ROLES
} from '../services/users.js';
import { sendInvitationEmail } from '../email.js';
import {
  findByEmail, updatePassword, createResetToken, consumeResetToken,
  RESET_TOKEN_EXPIRY_MINUTES
} from '../services/admin-users.js';
import { sendPasswordResetEmail } from '../email.js';
import { getAllForAdmin, bulkUpdate } from '../services/content.js';
import {
  listCatalog, getOne, createCatalogItem, deleteCatalogItem,
  updateMetadata, addItem, removeItem, cloneCatalogItem
} from '../services/catalog.js';
import {
  getAllForAdmin as getSettingsForAdmin,
  bulkUpdate as bulkUpdateSettings
} from '../services/settings.js';
import {
  listAgents, leadsByPeriod, leadsByMotivo, leadsByStatus, leadsPerAgent, summary as analyticsSummary
} from '../services/analytics.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

// ---------- Rate limit en login para frenar brute-force ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,                    // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá 15 minutos.' }
});

// ============================================================
// POST /api/admin/login
// ============================================================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password requeridos' });
    }
    if (!process.env.JWT_SECRET) {
      console.error('[admin/login] JWT_SECRET no configurada');
      return res.status(500).json({ error: 'Servidor mal configurado: falta JWT_SECRET' });
    }

    const admin = await findByEmail(String(email));
    if (!admin) {
      // Misma respuesta que password mal — no leak de qué emails existen
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Bloquear login si el usuario está desactivado
    if (admin.is_active === false) {
      return res.status(403).json({ error: 'Cuenta desactivada. Contactá a un administrador.' });
    }

    // Bloquear login si el email aún no fue verificado (cuentas invitadas pendientes)
    if (admin.email_verified_at === null) {
      return res.status(403).json({ error: 'Tu cuenta aún no está verificada. Revisá tu email.' });
    }

    const ok = await verifyPassword(String(password), admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const role = admin.role || 'admin';
    const token = signSession({ email: admin.email, role, uid: admin.id });
    res.cookie(SESSION_COOKIE, token, cookieOptions(isProd));
    // Update last_login (no bloqueante)
    touchLastLogin(admin.id).catch(err => console.error('[login] touchLastLogin', err));
    res.json({ ok: true, email: admin.email, role, permissions: rolePermissions(role) });
  } catch (err) {
    console.error('[admin/login] error inesperado:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ============================================================
// POST /api/admin/forgot — envía link de reset al email del admin
// ============================================================
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1h
  max: 5,                     // 5 emails/hora máx
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá 1 hora.' }
});

router.post('/forgot', forgotLimiter, async (req, res) => {
  // Respuesta genérica siempre — no leakear si el email existe
  const generic = { ok: true, message: 'Si el email coincide con un admin, te llegará un link en breve.' };

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.json(generic);
    }
    const admin = await findByEmail(email);
    if (!admin) {
      console.log(`[admin/forgot] email no coincide: ${email}`);
      return res.json(generic);
    }

    const { raw } = await createResetToken(admin.id);

    const baseUrl = process.env.APP_BASE_URL
      || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/admin/reset?token=${raw}`;

    try {
      await sendPasswordResetEmail({
        email: admin.email,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES
      });
      console.log(`[admin/forgot] reset email enviado a ${admin.email}`);
    } catch (err) {
      console.error('[admin/forgot] envío falló:', err.message);
      // Igual respondemos OK para no leakear nada al cliente
    }

    res.json(generic);
  } catch (err) {
    console.error('[admin/forgot] error inesperado:', err);
    res.json(generic);  // sigue siendo respuesta genérica
  }
});

// ============================================================
// POST /api/admin/reset — consume token + setea password nueva
// ============================================================
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes.' }
});

router.post('/reset', resetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'Token y password requeridos' });
    }
    if (typeof password !== 'string' || password.length < 10) {
      return res.status(400).json({ error: 'Password debe tener al menos 10 caracteres' });
    }

    const admin = await consumeResetToken(String(token));
    if (!admin) {
      return res.status(400).json({ error: 'Token inválido o expirado. Pedí uno nuevo.' });
    }

    const newHash = await bcrypt.hash(password, 12);
    await updatePassword(admin.id, newHash);

    console.log(`[admin/reset] password actualizada para ${admin.email}`);
    res.json({ ok: true, message: 'Password actualizada. Ya podés entrar.' });
  } catch (err) {
    console.error('[admin/reset] error inesperado:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ============================================================
// GET /api/admin/reset/check — verifica si un token es válido (para preflight desde la página)
// ============================================================
router.get('/reset/check', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.json({ valid: false });
  try {
    const admin = await consumeResetToken(String(token));
    res.json({ valid: !!admin });
  } catch {
    res.json({ valid: false });
  }
});

// ============================================================
// POST /api/admin/logout
// ============================================================
router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ============================================================
// GET /api/admin/me — verifica sesión activa
// ============================================================
router.get('/me', requireAuth, (req, res) => {
  const role = req.session.role || 'admin';
  res.json({ email: req.session.email, role, permissions: rolePermissions(role) });
});

// ============================================================
// GET /api/admin/stats — counts por status
// ============================================================
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status`
    );
    const out = { new: 0, 'in-progress': 0, contacted: 0, closed: 0, spam: 0, total: 0 };
    for (const r of rows) {
      out[r.status] = r.count;
      out.total += r.count;
    }
    res.json(out);
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'Error obteniendo stats' });
  }
});

// ============================================================
// GET /api/admin/leads
// Filtros (query): status, motivo, q (texto libre), from, to, page, limit
// ============================================================
router.get('/leads', requireAuth, async (req, res) => {
  try {
    const status = req.query.status;
    const motivo = req.query.motivo;
    const q = req.query.q ? String(req.query.q).trim() : null;
    const from = req.query.from || null;
    const to   = req.query.to   || null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (motivo) { params.push(motivo); where.push(`motivo = $${params.length}`); }
    if (from)   { params.push(from);   where.push(`created_at >= $${params.length}`); }
    if (to)     { params.push(to);     where.push(`created_at <= $${params.length}`); }
    if (q) {
      params.push('%' + q.toLowerCase() + '%');
      const i = params.length;
      where.push(`(LOWER(nombre) LIKE $${i} OR LOWER(email) LIKE $${i} OR LOWER(empresa_web) LIKE $${i} OR LOWER(cargo) LIKE $${i})`);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countParams = [...params];
    const countSql = `SELECT COUNT(*)::int AS total FROM leads ${whereSql}`;
    const { rows: [{ total }] } = await query(countSql, countParams);

    params.push(limit);
    params.push(offset);
    const dataSql = `
      SELECT id, created_at, nombre, email, cargo, empresa_web, motivo, status,
             status_updated_at, email_sent_at, email_error
      FROM leads
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(dataSql, params);

    res.json({ leads: rows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    console.error('[admin/leads]', err);
    res.status(500).json({ error: 'Error obteniendo leads' });
  }
});

// ============================================================
// GET /api/admin/leads/:id — detalle completo + timeline de eventos
// ============================================================
router.get('/leads/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido' });

  try {
    const { rows: leadRows } = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (!leadRows.length) return res.status(404).json({ error: 'Lead no encontrado' });

    const { rows: events } = await query(
      `SELECT id, created_at, event_type, prev_value, new_value, actor
       FROM lead_events WHERE lead_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({ lead: leadRows[0], events });
  } catch (err) {
    console.error('[admin/lead/:id]', err);
    res.status(500).json({ error: 'Error obteniendo lead' });
  }
});

// ============================================================
// PATCH /api/admin/leads/:id — actualizar status y/o notes
// ============================================================
const ALLOWED_STATUS = new Set(['new','in-progress','contacted','closed','spam']);

router.patch('/leads/:id', requireAuth, requireEditor, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido' });

  const { status, notes, assigned_to } = req.body || {};
  if (status !== undefined && !ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }
  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({ error: 'Notes debe ser string' });
  }
  if (assigned_to !== undefined && assigned_to !== null && typeof assigned_to !== 'string') {
    return res.status(400).json({ error: 'assigned_to debe ser string o null' });
  }
  if (status === undefined && notes === undefined && assigned_to === undefined) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');

      const { rows: prevRows } = await client.query('SELECT status, notes, assigned_to FROM leads WHERE id = $1 FOR UPDATE', [id]);
      if (!prevRows.length) throw new Error('not_found');
      const prev = prevRows[0];

      const sets = [];
      const params = [];
      if (status !== undefined && status !== prev.status) {
        params.push(status);
        sets.push(`status = $${params.length}`);
        params.push(new Date());
        sets.push(`status_updated_at = $${params.length}`);
      }
      if (notes !== undefined && notes !== prev.notes) {
        params.push(notes || null);
        sets.push(`notes = $${params.length}`);
      }
      const newAssigned = (assigned_to === '' || assigned_to === null) ? null : assigned_to;
      if (assigned_to !== undefined && newAssigned !== prev.assigned_to) {
        params.push(newAssigned);
        sets.push(`assigned_to = $${params.length}`);
        params.push(newAssigned ? new Date() : null);
        sets.push(`assigned_at = $${params.length}`);
      }
      if (!sets.length) {
        await client.query('COMMIT');
        return { unchanged: true };
      }

      params.push(id);
      const updateSql = `UPDATE leads SET ${sets.join(', ')} WHERE id = $${params.length}
                         RETURNING id, status, notes, assigned_to, assigned_at, status_updated_at`;
      const { rows: updated } = await client.query(updateSql, params);

      // Audit
      const actor = req.session.email;
      if (status !== undefined && status !== prev.status) {
        await client.query(
          `INSERT INTO lead_events (lead_id, event_type, prev_value, new_value, actor)
           VALUES ($1, 'status_changed', $2, $3, $4)`,
          [id, prev.status, status, actor]
        );
      }
      if (notes !== undefined && notes !== prev.notes) {
        await client.query(
          `INSERT INTO lead_events (lead_id, event_type, prev_value, new_value, actor)
           VALUES ($1, 'note_changed', $2, $3, $4)`,
          [id, (prev.notes || '').slice(0, 500), (notes || '').slice(0, 500), actor]
        );
      }
      if (assigned_to !== undefined && newAssigned !== prev.assigned_to) {
        await client.query(
          `INSERT INTO lead_events (lead_id, event_type, prev_value, new_value, actor)
           VALUES ($1, 'assigned', $2, $3, $4)`,
          [id, prev.assigned_to || '(sin asignar)', newAssigned || '(sin asignar)', actor]
        );
      }

      await client.query('COMMIT');
      return { lead: updated[0] };
    });

    if (result.unchanged) return res.json({ ok: true, unchanged: true });
    res.json({ ok: true, lead: result.lead });
  } catch (err) {
    if (err.message === 'not_found') return res.status(404).json({ error: 'Lead no encontrado' });
    console.error('[admin/lead/:id PATCH]', err);
    res.status(500).json({ error: 'Error actualizando lead' });
  }
});

// ============================================================
// CONTENT — Admin (requiere auth)
// GET  /api/admin/content       → todo el contenido agrupado por sección
// PATCH /api/admin/content/bulk → bulk update [{i18n_key, value_es, value_en}]
// ============================================================

router.get('/content', requireAuth, async (_req, res) => {
  try {
    const sections = await getAllForAdmin();
    res.json({ sections });
  } catch (err) {
    console.error('[admin/content GET]', err);
    res.status(500).json({ error: 'Error obteniendo contenido' });
  }
});

router.patch('/content/bulk', requireAuth, requireEditor, async (req, res) => {
  try {
    const changes = (req.body && req.body.changes) || [];
    if (!Array.isArray(changes)) return res.status(400).json({ error: 'changes debe ser array' });
    const result = await bulkUpdate(changes, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[admin/content PATCH]', err);
    res.status(500).json({ error: 'Error actualizando contenido' });
  }
});

// ============================================================
// CATALOG CRUD (programs, servicios, fases)
// ============================================================
const VALID_TYPES = new Set(['program', 'servicio', 'fase']);

router.get('/catalog/:type', requireAuth, async (req, res) => {
  try {
    const type = req.params.type;
    if (!VALID_TYPES.has(type)) return res.status(400).json({ error: 'tipo inválido' });
    const items = await listCatalog(type);
    res.json({ items });
  } catch (err) {
    console.error('[catalog list]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalog/:type', requireAuth, requireEditor, async (req, res) => {
  try {
    const type = req.params.type;
    if (!VALID_TYPES.has(type)) return res.status(400).json({ error: 'tipo inválido' });
    const result = await createCatalogItem(type, req.body || {}, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[catalog create]', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/catalog/section/:section', requireAuth, requireEditor, async (req, res) => {
  try {
    const section = req.params.section;
    const ok = await deleteCatalogItem(section);
    if (!ok) return res.status(404).json({ error: 'Section no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[catalog delete]', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/catalog/section/:section', requireAuth, requireEditor, async (req, res) => {
  try {
    const section = req.params.section;
    const result = await updateMetadata(section, req.body || {}, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[catalog meta update]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalog/section/:section/items', requireAuth, requireEditor, async (req, res) => {
  try {
    const section = req.params.section;
    const result = await addItem(section, req.body || {}, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[catalog add item]', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/catalog/items/:i18nKey', requireAuth, requireEditor, async (req, res) => {
  try {
    const ok = await removeItem(req.params.i18nKey);
    if (!ok) return res.status(404).json({ error: 'Item no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[catalog remove item]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalog/section/:section/clone', requireAuth, requireEditor, async (req, res) => {
  try {
    const result = await cloneCatalogItem(req.params.section, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[catalog clone]', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SETTINGS (analytics, GTM, etc.)
// ============================================================
router.get('/settings', requireAuth, async (_req, res) => {
  try {
    const grouped = await getSettingsForAdmin();
    res.json({ categories: grouped });
  } catch (err) {
    console.error('[settings GET]', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings/bulk', requireAuth, requireRole(['master_admin','admin']), async (req, res) => {
  try {
    const changes = (req.body && req.body.changes) || [];
    if (!Array.isArray(changes)) return res.status(400).json({ error: 'changes debe ser array' });
    const result = await bulkUpdateSettings(changes, req.session.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[settings PATCH]', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ANALYTICS — dashboards de leads
// ============================================================
router.get('/analytics/agents', requireAuth, async (_req, res) => {
  try { res.json({ agents: await listAgents() }); }
  catch (err) { console.error('[analytics/agents]', err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics/summary', requireAuth, async (req, res) => {
  try { res.json(await analyticsSummary({ agent: req.query.agent || null })); }
  catch (err) { console.error('[analytics/summary]', err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics/leads-by-period', requireAuth, async (req, res) => {
  try {
    const period = req.query.period === 'month' ? 'month' : 'week';
    const weeks = Math.min(52, Math.max(4, parseInt(req.query.weeks || '12', 10)));
    res.json({ period, data: await leadsByPeriod({ period, weeks, agent: req.query.agent || null }) });
  } catch (err) { console.error('[analytics/period]', err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics/leads-by-motivo', requireAuth, async (req, res) => {
  try { res.json({ data: await leadsByMotivo({ agent: req.query.agent || null }) }); }
  catch (err) { console.error('[analytics/motivo]', err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics/leads-by-status', requireAuth, async (req, res) => {
  try { res.json({ data: await leadsByStatus({ agent: req.query.agent || null }) }); }
  catch (err) { console.error('[analytics/status]', err); res.status(500).json({ error: err.message }); }
});

router.get('/analytics/leads-per-agent', requireAuth, async (_req, res) => {
  try { res.json({ data: await leadsPerAgent() }); }
  catch (err) { console.error('[analytics/per-agent]', err); res.status(500).json({ error: err.message }); }
});

// ============================================================
// USERS MANAGEMENT (master_admin only)
// ============================================================
router.get('/users', requireAuth, requireRole(['master_admin']), async (_req, res) => {
  try {
    res.json({ users: await listUsers() });
  } catch (err) {
    console.error('[users list]', err); res.status(500).json({ error: err.message });
  }
});

router.post('/users', requireAuth, requireRole(['master_admin']), async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) return res.status(400).json({ error: 'email y role requeridos' });
    const { user, rawToken } = await inviteUser({
      email: String(email).trim().toLowerCase(),
      role,
      createdBy: req.session.email
    });

    // Construir verifyUrl absoluto (siempre, aunque el email falle)
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/admin/verify?token=${rawToken}`;

    // Intentar envío vía Resend
    let emailStatus = { sent: false, error: null };
    try {
      await sendInvitationEmail({
        email: user.email, role: user.role, verifyUrl,
        expiresInHours: 48, invitedBy: req.session.email
      });
      emailStatus.sent = true;
      console.log(`[users/invite] email enviado a ${user.email}`);
    } catch (mailErr) {
      const msg = String(mailErr.message || mailErr);
      emailStatus.error = msg.slice(0, 300);
      console.error(`[users/invite] email a ${user.email} FALLÓ:`, msg);
    }

    // Devolvemos el verifyUrl siempre — si el email falló, el master_admin lo copia y manda manual
    res.json({ ok: true, user, verifyUrl, emailStatus });
  } catch (err) {
    console.error('[users invite]', err);
    res.status(400).json({ error: err.message });
  }
});

router.patch('/users/:id/role', requireAuth, requireRole(['master_admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body || {};
    await updateUserRole(id, role, req.session.email);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/users/:id/active', requireAuth, requireRole(['master_admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_active } = req.body || {};
    await setActive(id, !!is_active, req.session.email);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/users/:id', requireAuth, requireRole(['master_admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteUser(id);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/users/:id/resend-invitation', requireAuth, requireRole(['master_admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { email, rawToken } = await resendInvitation(id);
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl.replace(/\/$/, '')}/admin/verify?token=${rawToken}`;
    let emailStatus = { sent: false, error: null };
    try {
      await sendInvitationEmail({
        email, role: 'admin', verifyUrl, expiresInHours: 48, invitedBy: req.session.email
      });
      emailStatus.sent = true;
      console.log(`[users/resend] email enviado a ${email}`);
    } catch (mailErr) {
      emailStatus.error = String(mailErr.message || mailErr).slice(0, 300);
      console.error(`[users/resend] email a ${email} FALLÓ:`, emailStatus.error);
    }
    res.json({ ok: true, verifyUrl, emailStatus });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================================
// VERIFY INVITATION (público — el invitado abre el link del email)
// GET  /api/admin/verify/check?token=xxx → { valid: true }
// POST /api/admin/verify { token, password } → setea password + activa cuenta
// ============================================================
router.get('/verify/check', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.json({ valid: false });
  try {
    const user = await verifyInvitationToken(String(token));
    if (!user) return res.json({ valid: false });
    res.json({ valid: true, email: user.email, role: user.role });
  } catch { res.json({ valid: false }); }
});

router.post('/verify', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token y password requeridos' });
    if (password.length < 10) return res.status(400).json({ error: 'Password debe tener al menos 10 caracteres' });
    const user = await verifyInvitationToken(String(token));
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado. Pedile al admin que reenvíe la invitación.' });
    await completeInvitation({ userId: user.id, password: String(password) });
    res.json({ ok: true, email: user.email });
  } catch (err) {
    console.error('[verify]', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
