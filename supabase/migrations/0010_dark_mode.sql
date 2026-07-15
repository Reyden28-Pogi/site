-- =========================================================
-- Per-business dark mode toggle.
--
-- Applied by scoping a `.dark` class to the public site's own root
-- wrapper (see PublicLayout.jsx), not to <html> globally — this keeps
-- admin panels completely unaffected regardless of any tenant's choice,
-- and avoids any SPA-navigation cleanup issues from a global class toggle.
-- =========================================================

alter table businesses add column if not exists dark_mode boolean not null default false;
