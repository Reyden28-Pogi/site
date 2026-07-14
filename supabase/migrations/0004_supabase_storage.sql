-- =========================================================
-- Supabase Storage: `media` bucket (replaces Cloudflare Images)
-- =========================================================

-- Public bucket: anyone can read/download objects via their public URL
-- (needed for the public marketing site to display packages/gallery/blog
-- images without authentication). Writes are still gated by RLS below.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Path convention enforced by these policies: "<business_id>/<uuid>.<ext>"
-- storage.foldername(name) splits the object path into an array; the
-- first element is the business_id folder segment.

create policy "business admins upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth_business_id()::text
  );

create policy "business admins update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth_business_id()::text
  );

create policy "business admins delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth_business_id()::text
  );

create policy "super admin full access to media bucket"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media' and is_super_admin())
  with check (bucket_id = 'media' and is_super_admin());
