-- 006_settings.sql
-- Tabla key/value para configuración del sitio: analytics, GTM, etc.

CREATE TABLE IF NOT EXISTS site_settings (
  key            TEXT PRIMARY KEY,
  value          TEXT,
  category       TEXT NOT NULL,                     -- 'analytics', 'seo', etc.
  label          TEXT NOT NULL,                     -- nombre legible para el admin
  description    TEXT,                               -- ayuda contextual
  placeholder    TEXT,
  display_order  INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     TEXT
);

CREATE INDEX IF NOT EXISTS site_settings_category_idx ON site_settings(category, display_order);

INSERT INTO site_settings (key, category, label, description, placeholder, display_order) VALUES
  ('analytics.ga4_id', 'analytics', 'Google Analytics 4 · Measurement ID',
   'ID del stream de datos en GA4. Empieza con G- (ej: G-XXXXXXXXXX). Se carga vía gtag.js.',
   'G-XXXXXXXXXX', 1),
  ('analytics.gtm_id', 'analytics', 'Google Tag Manager · Container ID',
   'ID del contenedor GTM (ej: GTM-XXXXXXX). Si está configurado, se carga el snippet de GTM en lugar de GA4 directo.',
   'GTM-XXXXXXX', 2)
ON CONFLICT (key) DO NOTHING;
