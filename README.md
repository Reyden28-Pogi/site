# Multi-Tenant Business Site Platform

A reusable, animated business website template with a two-tier admin system
(Super Admin for tenant management, Business Admin for day-to-day content).
One codebase, deployed once per client, each pointed at its own tenant via
an environment variable — no per-client code changes required.

**Stack:** React (Vite) · Tailwind CSS · Framer Motion · React Router ·
Supabase (Postgres + Auth + Storage, single shared project) · Cloudflare
Turnstile (captcha) · Vercel.

Images (packages, gallery, blog covers) are stored in **Supabase Storage**,
not a separate image host — one less external account to manage, and it
stays on the free tier for a small/early-stage site (see section 4).

---

## 1. How multi-tenancy works

- One Supabase project holds every business's data. Every content table has
  a `business_id` column, and Row Level Security (RLS) enforces that a
  `business_admin` can only touch rows belonging to their own business,
  while `super_admin` can touch everything.
- The **public site** is the same codebase deployed once per client, each
  as its own Vercel project. `VITE_BUSINESS_SLUG` tells that deployment
  which business's content to load. The site resolves that slug through the
  `get-business` Edge Function, and everything downstream (packages,
  gallery, blog, testimonials) is filtered by that business's `id`.
- Per-business branding covers `theme_color` (the app derives light/dark
  shades from it and injects them as CSS variables at runtime, so a new
  client's site needs zero CSS changes) and `logo_url` (shown in the
  navbar). Business_admins pick a color from curated palette swatches in
  `/admin/settings` (or a custom hex value) rather than needing to know
  color theory, and upload their logo the same way as any other image.
- The **Super Admin panel** (`/super-admin`) is tenant management only: list
  businesses, see basic stats, create a business + invite its first admin,
  deactivate/reactivate. It intentionally cannot edit a business's content —
  that's the Business Admin's job, scoped by RLS.
- The **Business Admin panel** (`/admin`) is where a client manages their
  own packages, gallery, blog, testimonials, and leads — including
  uploading images, which land in their own folder in Supabase Storage.

---

## 2. Prerequisites

- A [Supabase](https://supabase.com) project (free tier is fine to start —
  see section 4 for what that covers).
- A [Cloudflare](https://dash.cloudflare.com) account for **Turnstile**
  (captcha) only — this is free, no card required.
- A [Vercel](https://vercel.com) account for deployment.
- Node.js 18+ locally, and the [Supabase CLI](https://supabase.com/docs/guides/cli)
  for running migrations and deploying Edge Functions.

---

## 3. Supabase setup

### 3.1 Create the project and run the schema

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push   # runs everything in supabase/migrations/, in order
```

This creates all tables (`businesses`, `users`, `packages`, `gallery_images`,
`blog_posts`, `testimonials`, `leads`), the RLS policies described above,
the `media` Storage bucket, and seeds one placeholder `demo` business so
the app has something to boot against — delete or edit that row once
you're onboarding real clients.

What each migration file does, in order (`supabase db push` runs all of
them automatically — you don't run these one at a time):
- `0001_init.sql` — core schema + RLS
- `0002_hardening.sql` — locks the `businesses` table to super_admin-only
  reads, tightens the lead-insert check
- `0003_rate_limiting.sql` — shared rate-limit table/function, removes the
  direct anon insert path on `leads`
- `0004_supabase_storage.sql` — creates the `media` Storage bucket and its
  RLS policies (a business_admin can only write into their own
  business_id folder)
- `0005_rename_image_columns.sql` — renames the image columns to
  `image_url` / `cover_image_url` now that they store ready-to-use
  Supabase Storage URLs instead of Cloudflare image ids
- `0006_business_about_text.sql` — adds an editable `about_text` column so
  the public About page shows real, per-business copy instead of static
  template text (see the Settings page in section 3.3 / 7)
- `0007_reviews.sql` — adds a `reviews` table for client-submitted ratings,
  distinct from admin-curated `testimonials`: a business_admin can view
  but never write or delete a review (only super_admin can, for genuine
  abuse/spam moderation) — see section 9
- `0008_business_logo.sql` — adds a `logo_url` column so each tenant can
  set a logo, shown in their site's navbar
- `0009_brand_customization.sql` — adds `secondary_color`, `tertiary_color`,
  `heading_font`, `body_font` for fuller brand customization — see section 8

See section 11 for the reasoning behind the hardening/rate-limiting ones.

### 3.2 Create your own super admin account

1. In the Supabase Dashboard, go to **Authentication → Users** and invite
   yourself (or sign up through Supabase Auth however you prefer).
2. In the **Table Editor**, insert a row into `users` with:
   - `auth_id` = your new auth user's UUID
   - `business_id` = `null`
   - `role` = `super_admin`
   - `email` = your email

You can now sign in at `/super-admin/login` on any deployment of this app.

### 3.3 Deploy the Edge Functions

```bash
supabase functions deploy get-business --no-verify-jwt
supabase functions deploy upload-image
supabase functions deploy create-business
supabase functions deploy update-business-profile
supabase functions deploy submit-lead --no-verify-jwt
supabase functions deploy submit-review --no-verify-jwt
supabase functions deploy send-lead-notification --no-verify-jwt
```

Set their secrets:

```bash
supabase secrets set \
  TURNSTILE_SECRET_KEY=your-turnstile-secret-key \
  RESEND_API_KEY=your-resend-api-key \
  NOTIFICATION_FROM_EMAIL=notifications@yourdomain.com \
  LEAD_WEBHOOK_SECRET=$(openssl rand -hex 32) \
  PUBLIC_ADMIN_URL=https://your-control-domain.com
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically by Supabase into every Edge Function — you don't
set those yourself. `upload-image` needs no extra secrets at all; it uses
the caller's own login session to write into Storage, so Storage RLS
applies exactly as it would for any other client call.

`PUBLIC_ADMIN_URL` is where `create-business` sends new business_admin
invite emails — they land on `${PUBLIC_ADMIN_URL}/admin/accept-invite`,
which is where the invited admin actually sets their password (Supabase's
invite link alone only establishes a session; this app's
`/admin/accept-invite` page is what prompts for the password). For local
development, set it to `http://localhost:5173`. **Also** add the matching
URL to Supabase's allowlist: **Authentication → URL Configuration → Redirect
URLs**, add `http://localhost:5173/**` (or your real domain's equivalent
in production) — Supabase silently falls back to its default Site URL if
the redirect isn't on this allowlist, which looks like the invite link
"doing nothing."

For a real multi-client rollout, note that a business is created (and its
invite sent) via `/super-admin` *before* that client's own Vercel project
and domain necessarily exist yet — so `PUBLIC_ADMIN_URL` here is really
"wherever your invite-acceptance flow lives," which in practice may need
to be a stable domain you control rather than each client's eventual
domain. Plan that ordering deliberately rather than assuming it's
automatic.

`get-business` is what the public site calls to resolve `VITE_BUSINESS_SLUG`
into a business record — it's the only way the frontend reads from the
`businesses` table. The table itself has no anon-readable policy, so the
shared anon key can't be used to list or scrape every client's contact
info; `get-business` only ever returns one row for a slug you already know.

`update-business-profile` is how a business_admin edits their own
`about_text`, `address`, `contact_phone`, and `theme_color` — from the
`/admin/settings` page. `name`, `slug`, `contact_email`, and `is_active`
stay super-admin-only (changing your own `slug`, for instance, would break
that tenant's own deployed `VITE_BUSINESS_SLUG`), so this function is a
narrow allowlist rather than opening general write access to the table.

### 3.4 Wire up the lead-notification webhook

`send-lead-notification` runs with `--no-verify-jwt` (Postgres webhooks
don't send a user JWT), which means Supabase's platform-level auth check is
off for it — the function verifies the caller itself via a shared secret,
so this step is not optional.

In the Supabase Dashboard: **Database → Webhooks → Create a new webhook**
- Table: `leads`
- Events: `INSERT`
- Type: HTTP Request → point it at your deployed `send-lead-notification`
  function URL.
- **HTTP Headers**: add `x-webhook-secret` with the exact value you set for
  `LEAD_WEBHOOK_SECRET` above. Requests without a matching header get a
  generic 401.

Now every new quote request emails the business's `contact_email`.

### 3.5 Set up Cloudflare Turnstile (contact form captcha)

1. In the Cloudflare dashboard, go to **Turnstile** and add a site — one
   widget works across every client domain, or create separate ones per
   domain if you prefer isolated analytics.
2. Copy the **Site Key** into `VITE_TURNSTILE_SITE_KEY` in the frontend
   `.env` for every client deployment (it's public/non-secret, safe in the
   browser bundle).
3. Copy the **Secret Key** into the `submit-lead` function's secret
   (`TURNSTILE_SECRET_KEY`, set above) — never into the frontend.

The Contact page submits through `submit-lead` rather than inserting into
`leads` directly: that function verifies the Turnstile token, rate limits
by IP (5 submissions per 10 minutes), confirms the business is active, and
only then writes the row using the service role. The `leads` table's RLS
has no anon-insert policy left, so this is the only way in.

`submit-review` (client-submitted star ratings on the homepage) follows the
identical pattern — same Turnstile secret, its own rate limit (3 per 30
minutes per IP) — see section 9 for why reviews are a separate table
from `testimonials` with a deliberately stricter, no-delete-for-business_admin
write model.

---

## 4. Image storage (Supabase Storage) and what it costs

Images upload through the `upload-image` Edge Function into a `media`
bucket in your Supabase project — created automatically by
`0004_supabase_storage.sql`. Nothing else to set up; there's no separate
image-host account, API token, or account hash to configure.

**Cost, concretely:** the Supabase free tier includes 1 GB of file storage
and no credit card requirement. At typical compressed web-image sizes
(100–300KB), that's roughly 3,000–5,000 photos — comfortably more than a
single small business site needs (packages + gallery + blog covers
typically add up to well under a couple hundred images). If a client's
site eventually needs more than 1GB total across the whole platform (all
tenants share the one project), Supabase Pro starts at $25/month and
raises that to 100GB.

**Trade-off vs. a dedicated image CDN (documented, not hidden):** Supabase
Storage doesn't do on-the-fly resizing/variants the way Cloudflare Images
does. This app just serves the original uploaded file at whatever size it
was uploaded — there's no separate "thumbnail" vs. "full size" version
generated automatically. For a small business site this is a fine
trade-off (browsers scale images down fine via CSS, and `loading="lazy"`
is already used throughout), but if a client uploads very large source
photos (multi-MB DSLR originals) without resizing them first, page weight
will be higher than a variant-based CDN would give you. `upload-image`
caps uploads at 10MB per file as a backstop, but doesn't compress or
resize anything. If this becomes a real problem for a client with heavy
photo needs, revisiting a dedicated image CDN for that one tenant is a
reasonable future upgrade — it does not require changing every other
tenant's setup, since each business's actual image count/size is
independent of the others.

---

## 5. Local development

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BUSINESS_SLUG=demo,
# and VITE_TURNSTILE_SITE_KEY
npm run dev
```

Visit `/` for the public site (for the `demo` business), `/admin/login` for
the business admin panel, and `/super-admin/login` for tenant management.

---

## 6. Deploying a new client

1. Sign in to `/super-admin`, go to **Add business**, and fill in the
   business's name, slug, contact info, theme color, and the email of
   their first business admin. This creates the `businesses` row and
   emails an invite (they'll set a password and land on `/admin`).
2. In Vercel, create a new project from this same repository.
3. Set that project's environment variables:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — same for every client
     (shared Supabase project)
   - `VITE_BUSINESS_SLUG` — the slug you just created
   - `VITE_TURNSTILE_SITE_KEY` — same for every client (unless you made
     per-domain Turnstile widgets)
4. Deploy. That's the client's public site.
5. Connect their custom domain: buy/point it via **Cloudflare Registrar →
   DNS**, add a `CNAME` (or `A`/`ALIAS`) record to Vercel's target, then add
   the domain in the Vercel project's **Settings → Domains**.
6. The client logs into `/admin` on their own domain and populates
   packages, gallery, blog posts, and testimonials — nothing is
   hardcoded, so the site is empty/placeholder until they do.

### The Super Admin / control deployment

Deploy this same repo once more as your internal "control" project, with
`VITE_BUSINESS_SLUG` left **blank**. Its public site route will show a
"site not configured" message (expected — that deployment isn't meant to
serve a tenant's public site), but `/super-admin` on that deployment is
where you manage all tenants.

---

## 7. Project structure

```
src/
  lib/                    Supabase client, image upload helper, business context
  hooks/useAuth.js        Supabase Auth + role/business lookup
  components/public/      Navbar, Footer, Hero, PackageCard, GalleryGrid, TestimonialCarousel, StatsCounter, TurnstileWidget
  components/admin/       ProtectedRoute, Sidebar, ImageUploader
  routes/public/          Home, About, Packages, Gallery, Blog, BlogPost, Contact
  routes/admin/           AdminLogin, AcceptInvite, AdminLayout, Dashboard, PackagesAdmin, GalleryAdmin, BlogAdmin, TestimonialsAdmin, LeadsAdmin, ReviewsAdmin, SettingsAdmin
  routes/super-admin/     SuperAdminLogin, SuperAdminLayout, BusinessesList, CreateBusiness
supabase/
  migrations/0001_init.sql             Schema + RLS
  migrations/0002_hardening.sql        Locks businesses table down, tightens lead inserts
  migrations/0003_rate_limiting.sql    Shared rate-limit table/function, removes anon lead-insert
  migrations/0004_supabase_storage.sql `media` Storage bucket + per-business-folder RLS
  migrations/0005_rename_image_columns.sql  cloudflare_image_id -> image_url, etc.
  migrations/0006_business_about_text.sql   Editable about_text column
  migrations/0007_reviews.sql          Client-submitted reviews table (no-delete-for-business_admin)
  migrations/0008_business_logo.sql    Editable logo_url column
  migrations/0009_brand_customization.sql  secondary/tertiary colors + font pairing
  functions/_shared/rateLimit.ts       Rate-limit + client-IP helper shared across functions below
  functions/get-business                Public, single-row business lookup by slug (service role, rate-limited)
  functions/upload-image               Validated upload into the caller's own Storage folder (type/size checked)
  functions/create-business            Super-admin-only: creates tenant + invites admin (with rollback)
  functions/update-business-profile    Business-admin-only: narrow allowlist edit of their own business's editable fields
  functions/submit-lead                 Captcha + rate-limit checked lead submission (service role)
  functions/submit-review                Captcha + rate-limit checked review submission (service role)
  functions/send-lead-notification     Emails business on new lead (via DB webhook, secret-checked)
```

---

## 8. Brand customization: colors + fonts

Each business picks three coordinated colors (primary/secondary/tertiary)
and a heading/body font pairing from `/admin/settings`, applied site-wide
via CSS custom properties set at runtime in `businessContext.jsx` — no
per-client code or CSS changes needed, same mechanism as the original
single `theme_color`.

**Colors:** offered as curated three-color trios (a click sets all three
at once, guaranteed to look coordinated) with individual override pickers
underneath for full control. The three colors follow distinct **roles**,
the same convention real design systems (e.g. Material Design 3) use —
not just "three colors sprinkled around":

- **Primary** — the workhorse: CTA buttons, links, prices, active nav
  states, the brush-underline accent.
- **Secondary** — structure and rhythm, always at low opacity/tint, never
  a large solid fill: alternating section-background tints down the
  homepage (Stats → Testimonials → Reviews → final CTA alternate between
  a `secondary/5` tint and plain background), the "View all →" outline
  button, and a hover border accent on package cards.
- **Tertiary** — small accent details only, never large areas: star
  ratings on testimonials/reviews, the small dot in the Hero subheadline,
  and a thin accent strip at the top of each package card.

That role split is deliberate, not just organizational: a user-chosen
color (even from a curated trio) is much safer as a small accent or a 5%
tint than as a large solid fill — a color that reads fine as a subtle tint
can look bad as a big button or background. Secondary/tertiary are kept to
low-exposure roles for that reason, while primary (which every curated
trio designs around as the "main" color) gets the high-exposure spots.

**Admin panels intentionally don't theme by tenant at all** — `/admin` and
`/super-admin` always render with the default Fraunces/Inter pairing and
no brand colors applied, regardless of which business's data they're
managing. This is deliberate: they're internal tooling, not a tenant's
public-facing brand surface, and staying neutral keeps them consistent
and professional across every client rather than shifting color scheme
based on whichever business the admin happens to be logged into.

**Fonts:** offered as curated pairings only (e.g. "Editorial Serif" =
Playfair Display + Source Sans 3), not a freeform Google Fonts search.
Two reasons: a mistyped or unusual font name would silently fail to load
and fall back to a system font, and pairing two fonts that clash is an
easy mistake for someone without a design background to make. The
`update-business-profile` Edge Function also validates any incoming
`heading_font`/`body_font` against a hardcoded allowlist matching the
curated pairs — not because a font name is a security risk by itself, but
because it gets interpolated directly into a Google Fonts URL and a CSS
custom property, and an allowlist is simpler and safer than trying to
sanitize an arbitrary string for both of those contexts at once.

`index.html` always loads the default pairing (Fraunces + Inter) up
front — this covers the admin panels, which intentionally always use the
default pairing regardless of any tenant's choice, since there's no
per-business context there. If a business picks a different pairing,
`businessContext.jsx` injects one additional Google Fonts stylesheet just
for those two families on the public site.

---

## 9. Testimonials vs. Reviews — two different trust models, on purpose

The platform has two separate ways client feedback shows up on a site, and
they're intentionally not the same thing:

- **`testimonials`** — a business_admin curates these themselves, typically
  copying a quote from somewhere else (a Facebook or Google review
  screenshot, an email, whatever). This is normal, common practice for
  small business sites, and the admin fully owns this content: they can
  add, edit, or delete it freely.
- **`reviews`** — submitted directly by a real site visitor through a
  captcha-and-rate-limit-protected form on the homepage (`submit-review`,
  same pattern as `submit-lead`). A business_admin can **view** these in
  `/admin/reviews` but the RLS policies in `0007_reviews.sql` give them no
  insert, update, or delete access at all — enforced at the database
  level, not just hidden from the UI. Only `super_admin` can remove one,
  intended for genuine spam/abuse moderation, not for a business owner to
  quietly delete an honest low rating. This mirrors how Google/Yelp
  reviews work: the business can respond, but can't unilaterally erase
  reviews they don't like.

**What's deliberately not built yet:** there's no moderation UI for
super_admin to review/hide flagged content — that's currently a manual
Table Editor / SQL job. There's also no business_admin "reply to a review"
feature. Both are reasonable follow-ups if this sees real use, but weren't
in scope for the initial build.

---

## 10. Fixed: hardcoded content found during review

The whole point of this platform is that no business-specific content is
baked into the code — everything comes from the database so the same
codebase serves every client. Two places didn't actually live up to that
and got fixed:

- The homepage's animated stats (`120+ Events delivered`, `98% Happy
  clients`, etc.) were literal hardcoded numbers, identical for every
  tenant regardless of their real activity. They now show real counts
  computed from that business's own data (packages offered, gallery
  photos, testimonials, completed leads), and the whole section hides
  itself if a brand-new business has no data yet rather than show a wall
  of zeroes.
- The About page's body text was static template copy, the same for every
  tenant, with no way to change it. It's now backed by a real
  `about_text` column, editable from the new `/admin/settings` page (see
  section 3.3 for its Edge Function).
- Found during user testing: the homepage's package cards had
  `onSelect={() => {}}` — clicking one did nothing at all. Fixed to
  navigate to `/packages`.
- Found during user testing: the navbar showed only a bare logo with no
  business name next to it, and the Hero background image was washed out
  by a flat semi-transparent overlay (image at 0.6 opacity plus a uniform
  dark tint). Fixed: navbar now shows the business name (colored with
  their primary brand color) alongside the logo; the Hero image renders
  near-full clarity, with darkening concentrated at the bottom strip
  behind the text instead of across the whole photo.

Still present, lower priority: the homepage Hero headline ("Memorable
events, handled with care by...") and the Contact page's CTA copy
("Tell us about your event...") are still fixed template wording — not
fake data, just tone that leans toward event-based businesses even though
the platform is meant for non-event businesses too (cleaning services,
etc.). Worth making editable the same way as `about_text` if that
mismatch matters for a given client.

---

## 11. Security notes

**Fixed in `0002`–`0005` migrations / the Edge Functions:**
- The `businesses` table has no anon-readable policy. Previously, any
  holder of the (shared, public) anon key could `select *` and get every
  client's name, contact email, phone, and address in one call. The public
  site now resolves `VITE_BUSINESS_SLUG` through the `get-business` Edge
  Function (service role, one row per known slug), so there's no listing
  to scrape.
- `get-business` is rate-limited (60 requests/minute/IP) via a
  Postgres-backed atomic counter (`check_rate_limit`, in
  `0003_rate_limiting.sql`), so slug enumeration is slowed to a crawl
  rather than free.
- The contact form no longer inserts into `leads` directly with the anon
  key — that path had no captcha and no rate limit, so anyone could spam a
  business's lead inbox as fast as they could fire requests. It now goes
  through `submit-lead`, which verifies a Cloudflare Turnstile token, rate
  limits to 5 submissions per 10 minutes per IP, confirms the business is
  active, and only then writes via the service role. The old anon-insert
  RLS policy on `leads` is dropped, so `submit-lead` is the only way in.
- `send-lead-notification` requires a shared secret header
  (`LEAD_WEBHOOK_SECRET`) because it has to run with `--no-verify-jwt`.
  Without that check it would be a public endpoint anyone could POST to —
  an open relay for emailing arbitrary content through our Resend account,
  and a side channel for enumerating valid business_ids.
- `upload-image` rejects non-image content types and files over 10MB, and
  uploads through the caller's own JWT (not the service role) into Supabase
  Storage — so Storage RLS (folder-scoped to the caller's own business_id)
  applies as an independent enforcement layer, not just an application-level
  check. A business_admin physically cannot write into another tenant's
  folder even if this function's own role check were ever bypassed.
- `create-business` now rolls back the invited auth user (not just the
  business row) if the final step linking them together fails, so a
  partial failure doesn't leave a dangling invited account behind.
- Blog content is sanitized with DOMPurify before being rendered via
  `dangerouslySetInnerHTML`. Authors are trusted business_admins, but if an
  admin account is ever phished or reused elsewhere, this keeps a stored-XSS
  payload from executing against every visitor of that tenant's site.

**Known, accepted trade-off (not fixed, and here's why):**
- `packages`, `gallery_images`, `testimonials`, and `blog_posts` still use
  `is_active`/`is_published`/`is_visible` policies with no per-tenant
  scoping, meaning the shared anon key can technically read that content
  across *all* businesses in bulk, not just the one a given site is
  displaying. This is the same content those tables already show to any
  anonymous visitor on the public site, so it isn't a privacy/PII leak the
  way the businesses-table issue was — at most it's a low-severity
  competitive-intelligence concern (a scraper could dump every client's
  package list and pricing in one query instead of browsing site by site).
  Closing it properly means moving the entire public read path behind
  service-role Edge Functions (like `get-business`), which is a real
  engineering lift; do that if a client's content is sensitive enough to
  warrant it, but it wasn't done here by default.
- Supabase Storage objects in the `media` bucket are never deleted when
  their corresponding `packages`/`gallery_images`/`blog_posts` row is
  deleted — the app only deletes the database row. Orphaned files
  accumulate in Storage over time (counting toward the 1GB free-tier cap).
  This mirrors a gap that existed with Cloudflare Images too; fixing it
  means having the delete handlers also call
  `supabase.storage.from('media').remove([path])`, which is a reasonable
  follow-up but wasn't in scope here.

**Other things worth knowing — this is a reduction in known risk, not a
guarantee of "no issues":**
- None of this has been exercised end-to-end against a live Supabase
  project by an independent tester. It's been reviewed for logic and built
  successfully with `npm run build`, but RLS policies and Edge Functions can
  still surprise you in practice — test each admin role's access and try to
  break `submit-lead`, `get-business`, and `upload-image` (e.g. try
  uploading into another business's folder) from outside the app before
  trusting it with real client data.
- The demo/seed business and its placeholder data should be removed before
  onboarding real clients.
- Rotate the Turnstile secret and Supabase service role key if either is
  ever exposed; both should only ever live in Edge Function secrets, never
  in `VITE_*` variables.
- Edge Function CORS is wide open (`Access-Control-Allow-Origin: *`).
  That's intentional here — auth is via bearer token, not cookies, and
  every client site runs on a different domain, so there's no fixed origin
  list to allow instead. If you want to lock it down anyway, maintain an
  allowlist of client domains per function.
- The `rate_limits` table grows one row per unique key (IP+function) and
  is never pruned. At real scale you'd want a periodic job (e.g. a
  `pg_cron` schedule) to delete rows older than a day or two.
- Dependency versions in `package.json` are pinned to what was current at
  build time — run `npm audit` periodically and update them; no dependency
  set stays free of known CVEs forever.

---

## 12. Roadmap ideas (not built — deliberately deferred)

- **Self-serve signup.** Right now onboarding a client is invite-only: a
  super_admin creates the business and invites its first admin from
  `/super-admin`. A self-serve model (a public "start your site" landing
  page where anyone signs up — including via Google — and their signup
  creates their own business automatically) is a real product direction
  worth exploring, but it's a meaningfully bigger change than a UI tweak:
  it needs a new public marketing entry point separate from any tenant's
  own site, a decision on whether new businesses need approval before
  going live, Google OAuth configured in Supabase Auth, a plan for
  paid/free tiers if this becomes a monetized product, and a new
  "sign up creates + claims your own business" Edge Function (distinct
  from `create-business`, which is super-admin-only by design). Deferred
  until there's a real live deployment to build this against.
