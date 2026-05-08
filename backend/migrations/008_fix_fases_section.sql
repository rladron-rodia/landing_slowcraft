-- 008_fix_fases_section.sql
-- Bug fix: el código previo creaba secciones 'fases.fN' para fases nuevas/clonadas,
-- pero por convención los métodos viven en 'metodo.fN'. Esto inconsistencia rompía
-- la UI del catálogo de Métodos (clones huérfanos no se asociaban con sus content_blocks).
-- Esta migración renombra cualquier sección 'fases.*' → 'metodo.*' en ambas tablas.
-- Idempotente: si no hay rows con 'fases.*', no hace nada.

UPDATE content_blocks
   SET section = REPLACE(section, 'fases.', 'metodo.')
 WHERE section LIKE 'fases.%';

UPDATE catalog_sections
   SET section = REPLACE(section, 'fases.', 'metodo.'),
       updated_at = NOW(),
       updated_by = 'migration-008'
 WHERE section LIKE 'fases.%';
