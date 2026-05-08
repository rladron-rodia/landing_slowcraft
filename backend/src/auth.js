// Autenticación admin: bcrypt para password + JWT en cookie httpOnly.
// Single admin definido por ADMIN_EMAIL + ADMIN_PASSWORD_HASH (env vars).
// JWT_SECRET es el secreto de firma.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = '7d';
export const SESSION_COOKIE = 'slowcraft_session';

// ---------- Setup checks ----------
function requireEnv (name) {
  if (!process.env[name]) {
    console.warn(`[auth] ⚠️  ${name} no configurada — el admin no funcionará`);
  }
}
requireEnv('ADMIN_EMAIL');
requireEnv('ADMIN_PASSWORD_HASH');
requireEnv('JWT_SECRET');

// ---------- Password ----------
export async function verifyPassword (plain, hash) {
  if (!hash) return false;
  return await bcrypt.compare(plain, hash);
}

// ---------- JWT ----------
export function signSession (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySession (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ---------- Cookie helpers ----------
export const cookieOptions = (isProd) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});

// ---------- Middleware ----------
export function requireAuth (req, res, next) {
  const token = req.cookies && req.cookies[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: 'Sesión inválida o expirada' });
  req.session = session;
  next();
}
