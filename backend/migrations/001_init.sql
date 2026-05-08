-- 001_init.sql
-- Schema base: tabla _migrations + tabla leads

CREATE TABLE IF NOT EXISTS _migrations (
  id          TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Campos del formulario
  nombre          TEXT NOT NULL,
  email           TEXT NOT NULL,
  cargo           TEXT NOT NULL,
  empresa_web     TEXT NOT NULL,
  motivo          TEXT NOT NULL CHECK (motivo IN ('proyectos','informes','bolsa-de-trabajo')),
  descripcion     TEXT NOT NULL,
  -- Workflow del lead
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in-progress','contacted','closed','spam')),
  notes           TEXT,
  -- Metadata de la request
  ip              TEXT,
  user_agent      TEXT,
  referrer        TEXT,
  -- Tracking del envío de email
  email_sent_at   TIMESTAMPTZ,
  email_error     TEXT
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx     ON leads(status);
CREATE INDEX IF NOT EXISTS leads_motivo_idx     ON leads(motivo);
