// Aggregaciones para dashboards de analítica.

import { query } from './../db.js';

// Lista de usuarios con rol agente (para el dropdown de asignación)
export async function listAgents () {
  const { rows } = await query(
    `SELECT id, email FROM admin_users
     WHERE is_active = true AND email_verified_at IS NOT NULL
       AND role IN ('agente','commercial','admin','master_admin')
     ORDER BY role, email`
  );
  return rows;
}

// Leads agregados por bucket de tiempo (week|month) con filtro opcional por agente
export async function leadsByPeriod ({ period = 'week', weeks = 12, agent = null }) {
  const trunc = period === 'month' ? 'month' : 'week';
  const interval = period === 'month' ? `${weeks} months` : `${weeks} weeks`;

  const params = [];
  let agentFilter = '';
  if (agent) {
    params.push(agent);
    agentFilter = `AND assigned_to = $${params.length}`;
  }

  const sql = `
    WITH bucket AS (
      SELECT generate_series(
        date_trunc('${trunc}', NOW() - INTERVAL '${interval}'),
        date_trunc('${trunc}', NOW()),
        '1 ${trunc}'::interval
      ) AS period_start
    ),
    counts AS (
      SELECT date_trunc('${trunc}', created_at) AS period_start, COUNT(*)::int AS total
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      ${agentFilter}
      GROUP BY 1
    )
    SELECT b.period_start, COALESCE(c.total, 0) AS total
    FROM bucket b LEFT JOIN counts c USING (period_start)
    ORDER BY b.period_start
  `;
  const { rows } = await query(sql, params);
  return rows.map(r => ({ period: r.period_start, total: Number(r.total) }));
}

// Leads agrupados por motivo
export async function leadsByMotivo ({ agent = null } = {}) {
  const params = [];
  let agentFilter = '';
  if (agent) { params.push(agent); agentFilter = `AND assigned_to = $${params.length}`; }
  const { rows } = await query(
    `SELECT motivo, COUNT(*)::int AS total
     FROM leads
     WHERE 1=1 ${agentFilter}
     GROUP BY motivo
     ORDER BY total DESC`,
    params
  );
  return rows.map(r => ({ motivo: r.motivo, total: Number(r.total) }));
}

// Leads agrupados por status (funnel)
export async function leadsByStatus ({ agent = null } = {}) {
  const params = [];
  let agentFilter = '';
  if (agent) { params.push(agent); agentFilter = `AND assigned_to = $${params.length}`; }
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS total
     FROM leads
     WHERE 1=1 ${agentFilter}
     GROUP BY status`,
    params
  );
  // Asegurar todos los status presentes (incluso con 0)
  const statuses = ['new','in-progress','contacted','closed','spam'];
  const map = Object.fromEntries(rows.map(r => [r.status, Number(r.total)]));
  return statuses.map(s => ({ status: s, total: map[s] || 0 }));
}

// Performance por agente (volumen + conversión a contacted/closed)
export async function leadsPerAgent () {
  const { rows } = await query(
    `SELECT
        COALESCE(assigned_to, '(sin asignar)') AS agent,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IN ('contacted','closed'))::int AS converted
      FROM leads
      GROUP BY 1
      ORDER BY total DESC`
  );
  return rows.map(r => ({
    agent: r.agent,
    total: Number(r.total),
    converted: Number(r.converted),
    rate: r.total > 0 ? Math.round((r.converted / r.total) * 100) : 0
  }));
}

// Stats agregados generales (KPIs)
export async function summary ({ agent = null } = {}) {
  const params = [];
  let agentFilter = '';
  if (agent) { params.push(agent); agentFilter = `AND assigned_to = $${params.length}`; }
  const { rows: [r] } = await query(
    `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last7,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last30,
        COUNT(*) FILTER (WHERE status = 'new')::int AS pending,
        COUNT(*) FILTER (WHERE status IN ('contacted','closed'))::int AS converted,
        COUNT(*) FILTER (WHERE email_error IS NOT NULL)::int AS email_failed
      FROM leads
      WHERE 1=1 ${agentFilter}`,
    params
  );
  const total = Number(r.total);
  return {
    total,
    last7: Number(r.last7),
    last30: Number(r.last30),
    pending: Number(r.pending),
    converted: Number(r.converted),
    conversionRate: total > 0 ? Math.round((Number(r.converted) / total) * 100) : 0,
    emailFailed: Number(r.email_failed)
  };
}
