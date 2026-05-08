-- 002_admin.sql
-- Soporte para el admin: timestamp de cambio de status + tabla de eventos por lead
-- (audit log liviano: quién hizo qué, cuándo).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS lead_events (
  id           BIGSERIAL PRIMARY KEY,
  lead_id      BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type   TEXT NOT NULL,        -- 'created' | 'status_changed' | 'note_changed' | 'email_sent' | 'email_failed'
  prev_value   TEXT,
  new_value    TEXT,
  actor        TEXT                  -- 'system' o email del admin
);

CREATE INDEX IF NOT EXISTS lead_events_lead_id_idx    ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS lead_events_created_at_idx ON lead_events(created_at DESC);

-- Backfill: marcar todos los leads existentes como 'created' para tener una historia mínima
INSERT INTO lead_events (lead_id, created_at, event_type, new_value, actor)
SELECT id, created_at, 'created', motivo, 'system'
FROM leads
WHERE NOT EXISTS (
  SELECT 1 FROM lead_events e WHERE e.lead_id = leads.id AND e.event_type = 'created'
);
