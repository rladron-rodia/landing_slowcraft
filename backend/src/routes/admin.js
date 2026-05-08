// Endpoints del admin.
// Todas las rutas excepto /login y /logout requieren auth (cookie de sesión válida).

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query, withClient } from '../db.js';
import {
  verifyPassword, signSession, cookieOptions, requireAuth, SESSION_COOKIE
} from '../auth.js';

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
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password requeridos' });
  }

  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminHash  = process.env.ADMIN_PASSWORD_HASH || '';

  // Comparación de email case-insensitive y password vía bcrypt
  if (String(email).toLowerCase() !== adminEmail.toLowerCase()) {
    // Misma respuesta que password mal — no le decimos a un atacante si el email existe
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const ok = await verifyPassword(String(password), adminHash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = signSession({ email: adminEmail, role: 'admin' });
  res.cookie(SESSION_COOKIE, token, cookieOptions(isProd));
  res.json({ ok: true, email: adminEmail });
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
  res.json({ email: req.session.email, role: req.session.role });
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

router.patch('/leads/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido' });

  const { status, notes } = req.body || {};
  if (status !== undefined && !ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }
  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({ error: 'Notes debe ser string' });
  }
  if (status === undefined && notes === undefined) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');

      const { rows: prevRows } = await client.query('SELECT status, notes FROM leads WHERE id = $1 FOR UPDATE', [id]);
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
      if (!sets.length) {
        await client.query('COMMIT');
        return { unchanged: true };
      }

      params.push(id);
      const updateSql = `UPDATE leads SET ${sets.join(', ')} WHERE id = $${params.length}
                         RETURNING id, status, notes, status_updated_at`;
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

export default router;
