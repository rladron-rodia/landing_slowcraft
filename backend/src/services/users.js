// CRUD de admin_users + invitación con verificación por email.

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db.js';

export const VALID_ROLES = new Set(['master_admin','admin','viewer','content','commercial']);
const INVITATION_EXPIRY_HOURS = 48;

// Permisos por rol — qué tabs puede ver y si puede editar
export const ROLE_PERMISSIONS = {
  master_admin: { tabs: ['leads','contenido','formulario','configuracion','analitica','usuarios'], canEdit: true, canManageUsers: true },
  admin:        { tabs: ['leads','contenido','formulario','configuracion','analitica'],            canEdit: true, canManageUsers: false },
  viewer:       { tabs: ['leads','contenido','formulario','configuracion','analitica'],            canEdit: false, canManageUsers: false },
  content:      { tabs: ['contenido'],                                                              canEdit: true, canManageUsers: false },
  commercial:   { tabs: ['leads','formulario'],                                                     canEdit: true, canManageUsers: false }
};

export function rolePermissions (role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

// ---------- LIST ----------
export async function listUsers () {
  const { rows } = await query(
    `SELECT id, email, role, email_verified_at, is_active, created_at, created_by, last_login_at
     FROM admin_users
     ORDER BY role, email`
  );
  return rows;
}

export async function findById (id) {
  const { rows } = await query(`SELECT * FROM admin_users WHERE id = $1`, [id]);
  return rows[0] || null;
}

// ---------- CREATE (invite) ----------
// Invita un nuevo user: crea row con verification token, retorna el raw token para enviar por email.
export async function inviteUser ({ email, role, createdBy }) {
  if (!email || typeof email !== 'string') throw new Error('email requerido');
  if (!VALID_ROLES.has(role)) throw new Error('role inválido');
  // No se puede crear master_admin desde el UI — solo el bootstrap inicial
  if (role === 'master_admin') throw new Error('master_admin no se puede crear desde el UI');

  // Si ya existe, error claro
  const { rows: existing } = await query(
    `SELECT id, email_verified_at FROM admin_users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  if (existing.length) throw new Error('Ya existe un usuario con ese email');

  // Token random + bcrypt hash en DB (mismo patrón que reset password)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  // Password hash placeholder — se setea al verificar
  const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const { rows } = await query(
    `INSERT INTO admin_users
       (email, password_hash, role, verification_token_hash, verification_expires_at, created_by, is_active, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, NULL)
     RETURNING id, email, role, created_at`,
    [email, placeholderHash, role, tokenHash, expiresAt, createdBy]
  );

  return { user: rows[0], rawToken, expiresAt };
}

// ---------- VERIFY TOKEN + SET PASSWORD ----------
export async function verifyInvitationToken (rawToken) {
  if (!rawToken) return null;
  const { rows } = await query(
    `SELECT id, email, role, verification_token_hash, email_verified_at
     FROM admin_users
     WHERE verification_token_hash IS NOT NULL
       AND verification_expires_at > NOW()
       AND email_verified_at IS NULL`
  );
  for (const row of rows) {
    const ok = await bcrypt.compare(rawToken, row.verification_token_hash);
    if (ok) return row;
  }
  return null;
}

export async function completeInvitation ({ userId, password }) {
  if (!password || password.length < 10) throw new Error('Password debe tener al menos 10 caracteres');
  const newHash = await bcrypt.hash(password, 12);
  await query(
    `UPDATE admin_users
        SET password_hash = $1,
            email_verified_at = NOW(),
            verification_token_hash = NULL,
            verification_expires_at = NULL,
            password_changed_at = NOW()
      WHERE id = $2`,
    [newHash, userId]
  );
}

// ---------- UPDATE ROLE ----------
export async function updateRole (userId, newRole, actorEmail) {
  if (!VALID_ROLES.has(newRole)) throw new Error('role inválido');
  if (newRole === 'master_admin') throw new Error('No se puede asignar master_admin desde el UI');
  // No permitir bajarse a sí mismo si sos master_admin (evitar lockout)
  const { rows } = await query(`SELECT role, email FROM admin_users WHERE id = $1`, [userId]);
  if (!rows.length) throw new Error('Usuario no encontrado');
  if (rows[0].role === 'master_admin') throw new Error('No se puede modificar el rol del master_admin');

  await query(`UPDATE admin_users SET role = $1, updated_by = $2 WHERE id = $3`,
    [newRole, actorEmail, userId]);
}

// ---------- ACTIVATE / DEACTIVATE ----------
export async function setActive (userId, isActive, actorEmail) {
  const { rows } = await query(`SELECT role FROM admin_users WHERE id = $1`, [userId]);
  if (!rows.length) throw new Error('Usuario no encontrado');
  if (rows[0].role === 'master_admin' && !isActive) throw new Error('No se puede desactivar al master_admin');
  await query(`UPDATE admin_users SET is_active = $1, updated_by = $2 WHERE id = $3`,
    [isActive, actorEmail, userId]);
}

// ---------- DELETE ----------
export async function deleteUser (userId) {
  const { rows } = await query(`SELECT role FROM admin_users WHERE id = $1`, [userId]);
  if (!rows.length) throw new Error('Usuario no encontrado');
  if (rows[0].role === 'master_admin') throw new Error('No se puede eliminar al master_admin');
  await query(`DELETE FROM admin_users WHERE id = $1`, [userId]);
}

// ---------- RESEND INVITATION ----------
export async function resendInvitation (userId) {
  const { rows } = await query(`SELECT email, email_verified_at FROM admin_users WHERE id = $1`, [userId]);
  if (!rows.length) throw new Error('Usuario no encontrado');
  if (rows[0].email_verified_at) throw new Error('El usuario ya está verificado');

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  await query(
    `UPDATE admin_users
        SET verification_token_hash = $1, verification_expires_at = $2
      WHERE id = $3`,
    [tokenHash, expiresAt, userId]
  );
  return { email: rows[0].email, rawToken, expiresAt };
}

// ---------- TOUCH LAST LOGIN ----------
export async function touchLastLogin (userId) {
  await query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`, [userId]);
}

export const INVITATION_EXPIRY_HOURS_VALUE = INVITATION_EXPIRY_HOURS;
