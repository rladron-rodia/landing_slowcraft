// Operaciones sobre catálogos (programs, servicios, fases).
// Cada item es una "section" en content_blocks + una fila en catalog_sections.

import { query, withClient } from '../db.js';

const TYPE_TO_PLURAL = { program: 'programs', servicio: 'servicios', fase: 'fases' };

// Convención de keys según tipo:
// - program:  prefix='prog'  → .h, .pitch, .who, .m1..mN, .note
// - servicio: prefix='serv'  → .h, .p, .li1..liN
// - fase:     prefix='metodo'→ .h, .p
const KEY_PREFIX = { program: 'prog', servicio: 'serv', fase: 'metodo' };
const ITEM_KEY_PREFIX = { program: 'm', servicio: 'li', fase: null }; // sub-items (modules / list items)
const FIXED_FIELDS = {
  program:  [{ suffix: 'h', label: 'Título' }, { suffix: 'pitch', label: 'Pitch' }, { suffix: 'who', label: 'Para quién' }, { suffix: 'note', label: 'Nota' }],
  servicio: [{ suffix: 'h', label: 'Título' }, { suffix: 'p', label: 'Descripción' }],
  fase:     [{ suffix: 'h', label: 'Título' }, { suffix: 'p', label: 'Descripción' }]
};

// Sección key (ej 'programs.p1') → slot id (ej 'p1')
function slotFromSection (section) {
  return section.split('.').slice(1).join('.');
}
// (type, slot) → key prefix per item, ej ('program', 'p1') → 'prog.p1'
function keyPrefixFor (type, slot) {
  return `${KEY_PREFIX[type]}.${slot}`;
}

// ---------- LIST ----------
export async function listCatalog (catalogType) {
  if (!KEY_PREFIX[catalogType]) throw new Error('catalog_type inválido');
  const { rows } = await query(
    `SELECT section, catalog_type, display_order, tag, is_active, updated_at, updated_by
     FROM catalog_sections
     WHERE catalog_type = $1 AND is_active = true
     ORDER BY display_order, section`,
    [catalogType]
  );
  // Para cada uno traemos también sus content_blocks
  const items = [];
  for (const r of rows) {
    const fields = await fieldsForSection(r.section);
    items.push({
      section: r.section,
      catalog_type: r.catalog_type,
      display_order: r.display_order,
      tag: r.tag,
      updated_at: r.updated_at,
      updated_by: r.updated_by,
      fields
    });
  }
  return items;
}

// Devuelve todos los content_blocks de la section, separados en fixed/items
async function fieldsForSection (section) {
  const { rows } = await query(
    `SELECT i18n_key, field_label, value_es, value_en, value_type, display_order
     FROM content_blocks WHERE section = $1 ORDER BY display_order, i18n_key`,
    [section]
  );
  return rows;
}

// ---------- GET ONE ----------
export async function getOne (section) {
  const { rows } = await query(
    `SELECT * FROM catalog_sections WHERE section = $1`, [section]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return { ...row, fields: await fieldsForSection(section) };
}

// ---------- CREATE ----------
// Crea un nuevo item del catálogo: nuevo catalog_section + content_blocks default vacíos
export async function createCatalogItem (catalogType, { tag, defaults_es = {}, defaults_en = {} }, actor) {
  if (!KEY_PREFIX[catalogType]) throw new Error('catalog_type inválido');
  return await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      // Buscar próximo slot disponible
      const { rows: existing } = await client.query(
        `SELECT section FROM catalog_sections WHERE catalog_type = $1`,
        [catalogType]
      );
      const slotPrefix = catalogType === 'program' ? 'p' : catalogType === 'servicio' ? 's' : 'f';
      const slotsUsed = existing
        .map(r => slotFromSection(r.section))
        .map(s => parseInt(s.replace(slotPrefix, ''), 10))
        .filter(n => !isNaN(n));
      const nextNum = (slotsUsed.length ? Math.max(...slotsUsed) : 0) + 1;
      const slot = slotPrefix + nextNum;
      const sectionPlural = TYPE_TO_PLURAL[catalogType];
      const section = `${sectionPlural}.${slot}`;
      const keyPrefix = keyPrefixFor(catalogType, slot);

      // Calcular display_order (max + 1)
      const { rows: mx } = await client.query(
        `SELECT COALESCE(MAX(display_order),0)+1 AS next FROM catalog_sections WHERE catalog_type=$1`,
        [catalogType]
      );

      // Insertar catalog_section
      await client.query(
        `INSERT INTO catalog_sections (section, catalog_type, display_order, tag, updated_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [section, catalogType, mx[0].next, tag || null, actor || 'system']
      );

      // Insertar content_blocks para los campos fijos
      const fixedFields = FIXED_FIELDS[catalogType];
      let order = 1;
      for (const f of fixedFields) {
        const i18nKey = `${keyPrefix}.${f.suffix}`;
        await client.query(
          `INSERT INTO content_blocks (i18n_key, section, field_label, value_es, value_en, value_type, display_order, updated_by)
           VALUES ($1, $2, $3, $4, $5, 'text', $6, $7)
           ON CONFLICT (i18n_key) DO NOTHING`,
          [i18nKey, section, f.label, defaults_es[f.suffix] || '', defaults_en[f.suffix] || '', order++, actor || 'system']
        );
      }

      await client.query('COMMIT');
      return { section, slot };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
}

// ---------- CLONE ----------
// Clona una sección de catálogo completa (todos los content_blocks copiados a nueva section).
export async function cloneCatalogItem (sourceSection, actor) {
  return await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      // Verificar fuente
      const { rows: srcRows } = await client.query(
        `SELECT * FROM catalog_sections WHERE section = $1`, [sourceSection]
      );
      if (!srcRows.length) throw new Error('Section fuente no existe');
      const src = srcRows[0];

      // Calcular próximo slot del mismo tipo
      const { rows: existing } = await client.query(
        `SELECT section FROM catalog_sections WHERE catalog_type = $1`, [src.catalog_type]
      );
      const slotPrefix = src.catalog_type === 'program' ? 'p' : src.catalog_type === 'servicio' ? 's' : 'f';
      const slotsUsed = existing.map(r => slotFromSection(r.section))
        .map(s => parseInt(s.replace(slotPrefix, ''), 10))
        .filter(n => !isNaN(n));
      const nextNum = (slotsUsed.length ? Math.max(...slotsUsed) : 0) + 1;
      const newSlot = slotPrefix + nextNum;
      const newSection = `${TYPE_TO_PLURAL[src.catalog_type]}.${newSlot}`;
      const newKeyPrefix = keyPrefixFor(src.catalog_type, newSlot);

      // display_order al final
      const { rows: mx } = await client.query(
        `SELECT COALESCE(MAX(display_order),0)+1 AS next FROM catalog_sections WHERE catalog_type=$1`,
        [src.catalog_type]
      );

      // Insertar nueva catalog_section
      await client.query(
        `INSERT INTO catalog_sections (section, catalog_type, display_order, tag, updated_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [newSection, src.catalog_type, mx[0].next, src.tag, actor || 'system']
      );

      // Copiar todos los content_blocks de la sección original con keys reescritas
      const { rows: srcBlocks } = await client.query(
        `SELECT i18n_key, field_label, value_es, value_en, value_type, display_order
         FROM content_blocks WHERE section = $1`,
        [sourceSection]
      );

      const oldKeyPrefix = keyPrefixFor(src.catalog_type, slotFromSection(sourceSection));
      for (const b of srcBlocks) {
        // Reemplazar el prefix viejo por el nuevo en la key
        const newKey = b.i18n_key.replace(oldKeyPrefix, newKeyPrefix);
        // Para el título, agregar "(copia)" al final
        let valueEs = b.value_es;
        let valueEn = b.value_en;
        if (newKey.endsWith('.h')) {
          valueEs = (b.value_es || '') + ' (copia)';
          valueEn = (b.value_en || '') + ' (copy)';
        }
        await client.query(
          `INSERT INTO content_blocks (i18n_key, section, field_label, value_es, value_en, value_type, display_order, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (i18n_key) DO NOTHING`,
          [newKey, newSection, b.field_label, valueEs, valueEn, b.value_type, b.display_order, actor || 'system']
        );
      }

      await client.query('COMMIT');
      return { section: newSection, slot: newSlot };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
}

// ---------- DELETE ----------
export async function deleteCatalogItem (section) {
  return await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      // Borrar content_blocks de esa section
      await client.query(`DELETE FROM content_blocks WHERE section = $1`, [section]);
      // Borrar catalog_section
      const { rowCount } = await client.query(
        `DELETE FROM catalog_sections WHERE section = $1`, [section]
      );
      await client.query('COMMIT');
      return rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  });
}

// ---------- UPDATE METADATA (tag, display_order) ----------
export async function updateMetadata (section, { tag, display_order }, actor) {
  const sets = [];
  const params = [];
  if (tag !== undefined) { params.push(tag); sets.push(`tag = $${params.length}`); }
  if (display_order !== undefined) { params.push(display_order); sets.push(`display_order = $${params.length}`); }
  if (!sets.length) return { unchanged: true };
  params.push(actor || 'system');
  sets.push(`updated_by = $${params.length}`);
  sets.push(`updated_at = NOW()`);
  params.push(section);
  const { rowCount } = await query(
    `UPDATE catalog_sections SET ${sets.join(', ')} WHERE section = $${params.length}`,
    params
  );
  return { updated: rowCount };
}

// ---------- ADD ITEM (sub-item: módulo de program o ítem de servicio) ----------
export async function addItem (section, { value_es = '', value_en = '' }, actor) {
  // Determinar tipo y next item key
  const { rows } = await query(
    `SELECT catalog_type FROM catalog_sections WHERE section = $1`, [section]
  );
  if (!rows.length) throw new Error('section no encontrada');
  const ctype = rows[0].catalog_type;
  const itemPrefix = ITEM_KEY_PREFIX[ctype];
  if (!itemPrefix) throw new Error('Este catálogo no soporta items');

  const slot = slotFromSection(section);
  const baseKey = keyPrefixFor(ctype, slot); // ej 'prog.p1' o 'serv.s1'

  // Buscar próximo número
  const { rows: existing } = await query(
    `SELECT i18n_key, display_order FROM content_blocks
     WHERE section = $1 AND i18n_key LIKE $2`,
    [section, `${baseKey}.${itemPrefix}%`]
  );
  const nums = existing
    .map(r => r.i18n_key.replace(`${baseKey}.${itemPrefix}`, ''))
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n));
  const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;

  // display_order: max + 1 dentro de la sección
  const { rows: mx } = await query(
    `SELECT COALESCE(MAX(display_order),0)+1 AS next FROM content_blocks WHERE section=$1`,
    [section]
  );

  const i18nKey = `${baseKey}.${itemPrefix}${nextNum}`;
  const label = ctype === 'program' ? `Módulo ${nextNum}` : `Ítem ${nextNum}`;
  await query(
    `INSERT INTO content_blocks (i18n_key, section, field_label, value_es, value_en, value_type, display_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, 'text', $6, $7)`,
    [i18nKey, section, label, value_es, value_en, mx[0].next, actor || 'system']
  );
  return { i18n_key: i18nKey };
}

// ---------- REMOVE ITEM ----------
export async function removeItem (i18nKey) {
  const { rowCount } = await query(
    `DELETE FROM content_blocks WHERE i18n_key = $1`, [i18nKey]
  );
  return rowCount > 0;
}

// ---------- BUILD STRUCTURE FOR PUBLIC API ----------
// Devuelve estructura para que la landing renderice dinámicamente
export async function getPublicCatalogs () {
  const { rows: sections } = await query(
    `SELECT section, catalog_type, tag, display_order
     FROM catalog_sections WHERE is_active = true
     ORDER BY catalog_type, display_order`
  );
  const out = { programs: [], servicios: [], fases: [] };
  for (const sec of sections) {
    const slot = slotFromSection(sec.section);
    const baseKey = keyPrefixFor(sec.catalog_type, slot);
    const itemPrefix = ITEM_KEY_PREFIX[sec.catalog_type];

    const { rows: fieldRows } = await query(
      `SELECT i18n_key, display_order FROM content_blocks
       WHERE section = $1 ORDER BY display_order`,
      [sec.section]
    );

    const item = { section: sec.section, tag: sec.tag, display_order: sec.display_order };

    if (sec.catalog_type === 'program') {
      item.title_key = `${baseKey}.h`;
      item.pitch_key = `${baseKey}.pitch`;
      item.who_key   = `${baseKey}.who`;
      item.note_key  = `${baseKey}.note`;
      item.module_keys = fieldRows
        .map(r => r.i18n_key)
        .filter(k => new RegExp(`^${baseKey.replace(/\./g, '\\.')}\\.${itemPrefix}\\d+$`).test(k));
    } else if (sec.catalog_type === 'servicio') {
      item.title_key = `${baseKey}.h`;
      item.description_key = `${baseKey}.p`;
      item.item_keys = fieldRows
        .map(r => r.i18n_key)
        .filter(k => new RegExp(`^${baseKey.replace(/\./g, '\\.')}\\.${itemPrefix}\\d+$`).test(k));
    } else if (sec.catalog_type === 'fase') {
      item.title_key = `${baseKey}.h`;
      item.description_key = `${baseKey}.p`;
    }

    const plural = TYPE_TO_PLURAL[sec.catalog_type];
    out[plural].push(item);
  }
  return out;
}
