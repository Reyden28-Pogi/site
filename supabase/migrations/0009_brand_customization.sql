-- =========================================================
-- Fuller brand customization: secondary/tertiary colors + font pairing.
--
-- `theme_color` (added in 0001) remains the "primary" brand color. These
-- two additions round out a 3-color palette, plus a heading/body font
-- pairing — both offered as curated presets in /admin/settings (see
-- README section 8 for why fonts are curated-only, not freeform).
-- =========================================================

alter table businesses add column if not exists secondary_color text;
alter table businesses add column if not exists tertiary_color text;
alter table businesses add column if not exists heading_font text default 'Fraunces';
alter table businesses add column if not exists body_font text default 'Inter';
