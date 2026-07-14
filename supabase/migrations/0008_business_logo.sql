-- =========================================================
-- Add a business logo field.
--
-- Branding matters for each tenant — a logo shown in the site's navbar
-- (and available for use elsewhere) is core brand identity, same
-- reasoning as the existing theme_color field.
-- =========================================================

alter table businesses add column if not exists logo_url text;
