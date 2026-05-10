-- Migration: Add maintenance bypass code to maintenance_mode settings
-- This updates the maintenance_mode JSON in business_settings to include a bypass_code field.
-- When maintenance is enabled, only users who navigate to /admin/{bypass_code} can access the admin panel.

UPDATE business_settings
SET value = value || '{"bypass_code": "admin2024secure"}'::jsonb,
    updated_at = NOW()
WHERE key = 'maintenance_mode'
  AND NOT (value ? 'bypass_code');
