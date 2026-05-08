-- 003_admin_users.sql
-- Mover el admin a DB para soportar reset de password.
-- Bootstrap inicial: el server siembra desde ADMIN_EMAIL + ADMIN_PASSWORD_HASH si la tabla está vacía.

CREATE TABLE IF NOT EXISTS admin_users (
  id                          BIGSERIAL PRIMARY KEY,
  email                       TEXT NOT NULL,
  password_hash               TEXT NOT NULL,
  password_reset_token_hash   TEXT,
  password_reset_expires_at   TIMESTAMPTZ,
  password_changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email único case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_uidx ON admin_users(LOWER(email));
CREATE INDEX IF NOT EXISTS admin_users_reset_token_idx ON admin_users(password_reset_token_hash) WHERE password_reset_token_hash IS NOT NULL;
