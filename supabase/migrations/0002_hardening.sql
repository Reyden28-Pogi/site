-- =========================================================
-- Hardening pass
-- =========================================================

-- ---------------------------------------------------------
-- 1. Stop exposing the full business directory to anon.
--
-- The previous policy ("is_active = true or is_super_admin()") let anyone
-- holding the shared anon key run `select * from businesses` and get every
-- client's name/contact_email/contact_phone/address in one call — not just
-- the one tenant a given site is meant to serve. The public site now
-- resolves its business by slug through the `get-business` Edge Function
-- (service role, returns exactly one row), so anon no longer needs any
-- direct read access to this table at all.
-- ---------------------------------------------------------

drop policy if exists "public read active businesses" on businesses;

create policy "super admin reads businesses"
  on businesses for select
  using (is_super_admin());

-- ---------------------------------------------------------
-- 2. Let a business_admin's own users-row lookup also resolve their
-- business name/theme for admin UI use, without reopening the table to
-- anon. (Business admins already have an implicit business_id via their
-- `users` row; this just lets them read that one business's own record.)
-- ---------------------------------------------------------

create policy "business admin reads own business"
  on businesses for select
  using (id = auth_business_id());

-- ---------------------------------------------------------
-- 3. Tighten lead inserts: verify the target business exists and is
-- active, via a security-definer helper that bypasses RLS internally
-- (so it keeps working now that anon has no direct SELECT on
-- `businesses`). Prevents leads being attached to deactivated tenants or
-- non-existent business_ids slipping through as anything other than a
-- clean FK error.
-- ---------------------------------------------------------

create or replace function business_is_active(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_active from businesses where id = target_business_id),
    false
  );
$$;

drop policy if exists "public insert leads" on leads;

create policy "public insert leads for active businesses"
  on leads for insert
  with check (business_is_active(business_id));
