-- 005_catalogs.sql
-- Soporte para catálogos: programs, servicios, fases (método).
-- Cada item del catálogo es una "section" en content_blocks con metadata propia
-- en catalog_sections (tipo, orden, tag, activo).

-- 1) Refactorizar secciones existentes a jerárquicas
UPDATE content_blocks SET section = 'servicios.head'
  WHERE i18n_key IN ('serv.eyebrow', 'serv.h2', 'serv.intro');
UPDATE content_blocks SET section = 'servicios.s1' WHERE i18n_key LIKE 'serv.s1.%';
UPDATE content_blocks SET section = 'servicios.s2' WHERE i18n_key LIKE 'serv.s2.%';
UPDATE content_blocks SET section = 'servicios.s3' WHERE i18n_key LIKE 'serv.s3.%';

UPDATE content_blocks SET section = 'metodo.head'
  WHERE i18n_key IN ('metodo.eyebrow', 'metodo.h2');
UPDATE content_blocks SET section = 'metodo.f1' WHERE i18n_key LIKE 'metodo.f1.%';
UPDATE content_blocks SET section = 'metodo.f2' WHERE i18n_key LIKE 'metodo.f2.%';
UPDATE content_blocks SET section = 'metodo.f3' WHERE i18n_key LIKE 'metodo.f3.%';

-- 2) Crear catalog_sections (metadata por item)
CREATE TABLE IF NOT EXISTS catalog_sections (
  section        TEXT PRIMARY KEY,
  catalog_type   TEXT NOT NULL CHECK (catalog_type IN ('program', 'servicio', 'fase')),
  display_order  INT NOT NULL DEFAULT 0,
  tag            TEXT,                               -- ej: 'FOUNDATIONS', 'STRATEGY'
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     TEXT
);

CREATE INDEX IF NOT EXISTS catalog_sections_type_idx ON catalog_sections(catalog_type, display_order) WHERE is_active;

-- 3) Seed con los items existentes
INSERT INTO catalog_sections (section, catalog_type, display_order, tag) VALUES
  ('programs.p1', 'program', 1, 'FOUNDATIONS'),
  ('programs.p2', 'program', 2, 'GROWTH'),
  ('programs.p3', 'program', 3, 'GROWTH'),
  ('programs.p4', 'program', 4, 'OPERATIONS'),
  ('servicios.s1', 'servicio', 1, 'STRATEGY'),
  ('servicios.s2', 'servicio', 2, 'DESIGN'),
  ('servicios.s3', 'servicio', 3, 'DEPLOY'),
  ('metodo.f1', 'fase', 1, NULL),
  ('metodo.f2', 'fase', 2, NULL),
  ('metodo.f3', 'fase', 3, NULL)
ON CONFLICT (section) DO NOTHING;
