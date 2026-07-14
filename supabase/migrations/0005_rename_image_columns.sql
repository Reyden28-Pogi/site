-- =========================================================
-- Rename image columns to match the Supabase Storage migration.
--
-- Previously these stored a Cloudflare Images id (a short opaque token you
-- had to combine with a variant name to build a URL). Now that images live
-- in Supabase Storage, `upload-image` returns a ready-to-use public URL
-- directly, so these columns just store that URL as-is — no separate
-- "build the URL" step needed anywhere in the frontend.
-- =========================================================

alter table packages rename column cloudflare_image_id to image_url;
alter table gallery_images rename column cloudflare_image_id to image_url;
alter table blog_posts rename column cloudflare_cover_image_id to cover_image_url;
