-- 007_analytics_seed.sql
-- Pre-popula los IDs de GA4 y GTM (cuentas ya conectadas).
-- Solo setea si aún no hay valor — no pisa ediciones del admin.

UPDATE site_settings
   SET value = 'GTM-WM6WHTW3', updated_at = NOW(), updated_by = 'migration-007'
 WHERE key = 'analytics.gtm_id'
   AND (value IS NULL OR value = '');

UPDATE site_settings
   SET value = 'G-TJEN2EXGSN', updated_at = NOW(), updated_by = 'migration-007'
 WHERE key = 'analytics.ga4_id'
   AND (value IS NULL OR value = '');
