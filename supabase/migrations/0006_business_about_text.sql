-- =========================================================
-- Add an editable About-page text field.
--
-- The public About page previously showed the same static marketing copy
-- for every tenant ("...is dedicated to making every event effortless...")
-- with no way for a business_admin to change it — the same class of bug as
-- the hardcoded homepage stats. This column lets each business write their
-- own About text via the new Settings admin page.
-- =========================================================

alter table businesses add column if not exists about_text text;
