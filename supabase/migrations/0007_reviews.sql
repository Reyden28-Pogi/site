-- =========================================================
-- Client-submitted reviews (distinct from admin-curated `testimonials`)
--
-- `testimonials` stays as-is: a business_admin curates quotes from other
-- platforms (e.g. a screenshot of a Facebook review) and enters them
-- themselves — legitimate, common practice, and admin fully owns that
-- content (can edit/delete it).
--
-- `reviews` is different on purpose: a real site visitor submits it
-- directly, and a business_admin CANNOT edit or delete it — enforced here
-- at the RLS level, not just hidden in the UI, so calling the API
-- directly doesn't bypass the guarantee. Only super_admin (a neutral third
-- party, not the business being reviewed) can remove one, for genuine
-- abuse/spam — not because the business dislikes an honest low rating.
-- =========================================================

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  client_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

-- Public can read visible reviews for any business (same public-content
-- trade-off already documented for testimonials/packages/gallery/blog).
create policy "public read visible reviews"
  on reviews for select
  using (is_visible = true);

-- A business_admin can see ALL of their own business's reviews (including
-- any a super_admin has hidden), for their own awareness — but this is a
-- SELECT-only policy. There is deliberately no insert/update/delete
-- policy for business_admin anywhere in this file.
create policy "tenant read own reviews"
  on reviews for select
  using (business_id = auth_business_id() or is_super_admin());

-- No public insert policy here either — all submissions go through the
-- `submit-review` Edge Function (captcha + rate-limit checked, same
-- pattern as `submit-lead`), which writes via the service role.

-- Only super_admin can moderate (hide or delete) a review.
create policy "super admin moderates reviews"
  on reviews for update
  using (is_super_admin())
  with check (is_super_admin());

create policy "super admin deletes reviews"
  on reviews for delete
  using (is_super_admin());
