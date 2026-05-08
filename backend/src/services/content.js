// Operaciones de DB sobre content_blocks.

import { query, withClient } from '../db.js';

// Devuelve TODO el contenido en formato { es: {...}, en: {...} } — para la landing pública
export async function getPublicContent () {
  const { rows } = await query(
    'SELECT i18n_key, value_es, value_en FROM content_blocks ORDER BY i18n_key'
  );
  const out = { es: {}, en: {} };
  for (const r of rows) {
    out.es[r.i18n_key] = r.value_es;
    out.en[r.i18n_key] = r.value_en;
  }
  return out;
}

// Devuelve filas completas agrupadas por sección — para el admin
export async function getAllForAdmin () {
  const { rows } = await query(
    `SELECT i18n_key, section, field_label, value_es, value_en, value_type, display_order, updated_at, updated_by
     FROM content_blocks
     ORDER BY section, display_order, i18n_key`
  );
  // Agrupar por sección
  const sections = {};
  for (const r of rows) {
    if (!sections[r.section]) sections[r.section] = [];
    sections[r.section].push(r);
  }
  return sections;
}

// Bulk update — recibe array de {i18n_key, value_es, value_en}
// Solo actualiza filas existentes; ignora keys que no existen.
export async function bulkUpdate (changes, actor) {
  if (!Array.isArray(changes) || changes.length === 0) return { updated: 0 };
  const updatedKeys = [];
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      for (const c of changes) {
        if (!c || typeof c.i18n_key !== 'string') continue;
        const sets = [];
        const params = [];
        if (typeof c.value_es === 'string') {
          params.push(c.value_es);
          sets.push(`value_es = $${params.length}`);
        }
        if (typeof c.value_en === 'string') {
          params.push(c.value_en);
          sets.push(`value_en = $${params.length}`);
        }
        if (!sets.length) continue;
        params.push(actor || 'system');
        sets.push(`updated_by = $${params.length}`);
        sets.push(`updated_at = NOW()`);
        params.push(c.i18n_key);
        const { rowCount } = await client.query(
          `UPDATE content_blocks SET ${sets.join(', ')} WHERE i18n_key = $${params.length}`,
          params
        );
        if (rowCount > 0) updatedKeys.push(c.i18n_key);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
  return { updated: updatedKeys.length, keys: updatedKeys };
}
