import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL no configurada');
  process.exit(1);
}

// Render Postgres requiere SSL pero el cert es self-signed
const isProd = process.env.NODE_ENV === 'production';
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on('error', (err) => {
  console.error('[db] error inesperado en pool:', err);
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
