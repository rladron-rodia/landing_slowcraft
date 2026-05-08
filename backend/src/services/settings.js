// CRUD para site_settings (config del sitio: analytics, etc.)

import { query, withClient } from '../db.js';

// Para el admin: agrupado por categoría
export async function getAllForAdmin () {
  const { rows } = await query(
    `SELECT key, value, category, label, description, placeholder, display_order, updated_at, updated_by
     FROM site_settings
     ORDER BY category, display_order, key`
  );
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }
  return grouped;
}

// Para la landing: keys públicos (analytics + contact + social) como mapa key→value
export async function getPublicSettings () {
  const { rows } = await query(
    `SELECT key, value FROM site_settings WHERE category IN ('analytics','contact','social')`
  );
  const out = {};
  for (const r of rows) out[r.key] = r.value || '';
  return out;
}

// Bulk update: [{ key, value }]
export async function bulkUpdate (changes, actor) {
  if (!Array.isArray(changes) || !changes.length) return { updated: 0 };
  const updatedKeys = [];
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      for (const c of changes) {
        if (!c || typeof c.key !== 'string') continue;
        const value = c.value == null ? null : String(c.value);
        const { rowCount } = await client.query(
          `UPDATE site_settings SET value = $1, updated_at = NOW(), updated_by = $2 WHERE key = $3`,
          [value, actor || 'system', c.key]
        );
        if (rowCount > 0) updatedKeys.push(c.key);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
  return { updated: updatedKeys.length, keys: updatedKeys };
}
