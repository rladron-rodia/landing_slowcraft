-- 012_agents.sql
-- Agrega rol 'agente' al admin_users + columna assigned_to en leads (referencia al email del agente).
-- Index para queries de pipeline por agente.

-- Permitir 'agente' en el check constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('master_admin','admin','viewer','content','commercial','agente'));

-- Asignación de leads a agentes (email del admin_user, no FK estricta para no romper si se borra el agente)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_created_at_brin ON leads USING BRIN(created_at);
