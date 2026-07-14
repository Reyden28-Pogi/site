-- =========================================================
-- Rate limiting infrastructure + closing the direct anon lead-insert path
-- =========================================================

-- ---------------------------------------------------------
-- A tiny table-backed rate limiter usable from any Edge Function via RPC.
-- Atomic: the INSERT ... ON CONFLICT DO UPDATE takes a row lock, so
-- concurrent requests for the same key can't race each other into both
-- being "allowed".
-- ---------------------------------------------------------

create table if not exists rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

-- Not exposed via the REST API to anon/authenticated roles — only ever
-- called from Edge Functions using the service role, via the RPC below.
alter table rate_limits enable row level security;

create or replace function check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when now() - rate_limits.window_start > make_interval(secs => p_window_seconds)
            then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when now() - rate_limits.window_start > make_interval(secs => p_window_seconds)
            then now()
          else rate_limits.window_start
        end
  returning (count <= p_limit) into allowed;

  return coalesce(allowed, true);
end;
$$;

-- ---------------------------------------------------------
-- Leads: all inserts now go through the `submit-lead` Edge Function,
-- which verifies a Cloudflare Turnstile token and rate-limits by IP before
-- writing via the service role. Drop the old anon-insert RLS policy so
-- there's no direct, unthrottled, captcha-free path into this table left.
-- ---------------------------------------------------------

drop policy if exists "public insert leads for active businesses" on leads;
