-- =========================================================
-- Multi-tenant business site platform — initial schema
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Tables
-- ---------------------------------------------------------

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_email text,
  contact_phone text,
  address text,
  theme_color text not null default '#B5502F',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Mirrors auth.users with an app-level role + tenant assignment.
-- One row per authenticated admin (super_admin or business_admin).
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users (id) on delete cascade,
  business_id uuid references businesses (id) on delete cascade, -- null for super_admin
  role text not null check (role in ('super_admin', 'business_admin')),
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2),
  cloudflare_image_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  cloudflare_image_id text not null,
  caption text,
  uploaded_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  cloudflare_cover_image_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  client_name text not null,
  quote text not null,
  rating smallint check (rating between 1 and 5),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  event_type text,
  event_date date,
  guest_count integer,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Helper functions (used inside RLS policies)
-- ---------------------------------------------------------

-- Returns the app-level role of the currently authenticated user, or null.
create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_id = auth.uid();
$$;

-- Returns the business_id assigned to the currently authenticated user, or null.
create or replace function auth_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from users where auth_id = auth.uid();
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'super_admin', false);
$$;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------

alter table businesses enable row level security;
alter table users enable row level security;
alter table packages enable row level security;
alter table gallery_images enable row level security;
alter table blog_posts enable row level security;
alter table testimonials enable row level security;
alter table leads enable row level security;

-- businesses: public can read active businesses (needed for the public site to
-- resolve a slug -> business record with the anon key). Only super_admin writes.
create policy "public read active businesses"
  on businesses for select
  using (is_active = true or is_super_admin());

create policy "super admin manages businesses"
  on businesses for insert
  with check (is_super_admin());

create policy "super admin updates businesses"
  on businesses for update
  using (is_super_admin());

create policy "super admin deletes businesses"
  on businesses for delete
  using (is_super_admin());

-- users: super_admin sees/manages everyone; a user can read their own row.
create policy "super admin full access to users"
  on users for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "self read own user row"
  on users for select
  using (auth_id = auth.uid());

-- Generic tenant-scoped policy shape, repeated per table:
--   SELECT (public site + admins): public can read "public-safe" rows
--     (is_active/is_published/is_visible = true) for any business,
--     business_admin can read all of their own business's rows,
--     super_admin can read everything.
--   INSERT/UPDATE/DELETE: only business_admin (own business_id) or super_admin.

-- packages
create policy "public read active packages"
  on packages for select
  using (is_active = true);

create policy "tenant read own packages"
  on packages for select
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant write own packages"
  on packages for insert
  with check (business_id = auth_business_id() or is_super_admin());

create policy "tenant update own packages"
  on packages for update
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant delete own packages"
  on packages for delete
  using (business_id = auth_business_id() or is_super_admin());

-- gallery_images
create policy "public read gallery images"
  on gallery_images for select
  using (true);

create policy "tenant write own gallery"
  on gallery_images for insert
  with check (business_id = auth_business_id() or is_super_admin());

create policy "tenant update own gallery"
  on gallery_images for update
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant delete own gallery"
  on gallery_images for delete
  using (business_id = auth_business_id() or is_super_admin());

-- blog_posts
create policy "public read published posts"
  on blog_posts for select
  using (is_published = true);

create policy "tenant read own posts"
  on blog_posts for select
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant write own posts"
  on blog_posts for insert
  with check (business_id = auth_business_id() or is_super_admin());

create policy "tenant update own posts"
  on blog_posts for update
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant delete own posts"
  on blog_posts for delete
  using (business_id = auth_business_id() or is_super_admin());

-- testimonials
create policy "public read visible testimonials"
  on testimonials for select
  using (is_visible = true);

create policy "tenant read own testimonials"
  on testimonials for select
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant write own testimonials"
  on testimonials for insert
  with check (business_id = auth_business_id() or is_super_admin());

create policy "tenant update own testimonials"
  on testimonials for update
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant delete own testimonials"
  on testimonials for delete
  using (business_id = auth_business_id() or is_super_admin());

-- leads: no public read (this is private lead data). Public can INSERT
-- (submitting the contact form) but only for the business_id in the payload;
-- reading/updating is restricted to that business's admins + super_admin.
create policy "public insert leads"
  on leads for insert
  with check (true);

create policy "tenant read own leads"
  on leads for select
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant update own leads"
  on leads for update
  using (business_id = auth_business_id() or is_super_admin());

create policy "tenant delete own leads"
  on leads for delete
  using (business_id = auth_business_id() or is_super_admin());

-- ---------------------------------------------------------
-- Seed: one placeholder business so the app has something to boot against.
-- Replace/remove before real client onboarding.
-- ---------------------------------------------------------
insert into businesses (name, slug, contact_email, theme_color)
values ('Demo Business', 'demo', 'hello@example.com', '#B5502F')
on conflict (slug) do nothing;
