// Operaciones de DB sobre admin_users.

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db.js';

const RESET_TOKEN_EXPIRY_MIN = 30;

export async function findByEmail (email) {
  if (!email) return null;
  const { rows } = await query(
    `SELECT id, email, password_hash, password_reset_token_hash, password_reset_expires_at,
            role, is_active, email_verified_at
     FROM admin_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return rows[0] || null;
}

export async function bootstrapFromEnv () {
  const email = process.env.ADMIN_EMAIL;
  const hash  = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash) {
    console.warn('[admin-users] ADMIN_EMAIL o ADMIN_PASSWORD_HASH ausentes — bootstrap saltado');
    return;
  }
  const existing = await findByEmail(email);
  if (existing) {
    console.log('[admin-users] bootstrap saltado — ya existe admin', existing.email);
    return;
  }
  await query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)`,
    [email, hash]
  );
  console.log(`[admin-users] admin sembrado desde env vars: ${email}`);
}

export async function updatePassword (id, newHash) {
  await query(
    `UPDATE admin_users
     SET password_hash = $1,
         password_changed_at = NOW(),
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL
     WHERE id = $2`,
    [newHash, id]
  );
}

// Genera un token random de 32 bytes (raw hex), guarda su bcrypt hash en DB.
// Devuelve el raw token para incluir en el link del email.
export async function createResetToken (id) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(raw, 10);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MIN * 60_000);
  await query(
    `UPDATE admin_users
     SET password_reset_token_hash = $1, password_reset_expires_at = $2
     WHERE id = $3`,
    [hash, expiresAt, id]
  );
  return { raw, expiresAt };
}

// Verifica un raw token contra el hash guardado + chequea expiración.
// Devuelve el admin si OK, null si no.
export async function consumeResetToken (rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  // Buscar admins con token activo y no expirado
  const { rows } = await query(
    `SELECT id, email, password_reset_token_hash
     FROM admin_users
     WHERE password_reset_token_hash IS NOT NULL
       AND password_reset_expires_at > NOW()`
  );
  for (const row of rows) {
    const ok = await bcrypt.compare(rawToken, row.password_reset_token_hash);
    if (ok) return row;
  }
  return null;
}

export const RESET_TOKEN_EXPIRY_MINUTES = RESET_TOKEN_EXPIRY_MIN;
