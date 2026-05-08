-- 011_users_roles.sql
-- Sistema de usuarios + roles + invitación con verificación por email.
--
-- Roles:
--   master_admin · ve todo, gestiona usuarios y asigna roles (rladron@gmail.com por default)
--   admin        · todas las pestañas pero no gestiona usuarios
--   viewer       · todas las pestañas en modo solo-lectura
--   content      · solo pestaña Contenido (general + programs + servicios + método)
--   commercial   · solo pestañas Leads + Formulario
--
-- Flujo de alta:
--   master_admin invita por email → se crea row con verification_token + email_verified_at NULL
--   user recibe email con link → click → /admin/verify?token=xxx → set password → email_verified_at = NOW()
--   ahora puede hacer login normal

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('master_admin','admin','viewer','content','commercial')),
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users(role) WHERE is_active;

-- Bootstrap: marcar como master_admin al primer admin (que es rladron@gmail.com)
UPDATE admin_users
   SET role = 'master_admin',
       email_verified_at = COALESCE(email_verified_at, NOW())
 WHERE id = (SELECT id FROM admin_users ORDER BY created_at LIMIT 1);

-- Si por algún motivo no hay rows, no rompemos. La bootstrap del server siembra al admin desde env.
