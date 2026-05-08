// Runner de migraciones SQL.
// Aplica los archivos de ./migrations/*.sql en orden alfabético, una sola vez cada uno.
// Tracking en la tabla _migrations.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureMigrationsTable () {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function appliedSet () {
  const { rows } = await pool.query('SELECT id FROM _migrations');
  return new Set(rows.map(r => r.id));
}

async function run () {
  console.log('[migrate] iniciando…');
  await ensureMigrationsTable();
  const applied = await appliedSet();

  const files = (await readdir(MIGRATIONS_DIR))
    .filter(f => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip  ${file} (ya aplicada)`);
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrate] apply ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FAIL ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(`[migrate] hecho. ${count} migración(es) aplicada(s).`);
  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('[migrate] error fatal:', err);
  process.exit(1);
});
