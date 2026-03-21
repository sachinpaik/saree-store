# Admin app — environment variables

Configure in **`apps/admin/.env.local`** (or your host’s env UI). Do not commit secrets.

## Supabase

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser client (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Often | Server-side / actions if your code uses it — only on server, never expose to client |

Follow your existing Supabase SSR pattern (`@supabase/ssr` cookies).

### Admin access (`app_metadata.role`)

The admin UI and **upload-signer** both require the Supabase JWT to include **`app_metadata.role === "admin"`** (not only a row in `public.profiles`).

#### Option A — Dashboard (if you see it)

1. **Supabase Dashboard** → **Authentication** → **Users**.
2. Click the **user row** (or **⋯** / **Edit** / **View user** depending on UI version).
3. Look for **App metadata**, **Raw App Meta Data**, or an **Edit** panel with JSON. Set:

   `{ "role": "admin" }`

4. Save, then **sign out** of the admin app and **sign in again** (JWT must be refreshed).

Some dashboard versions hide labels: expand **Advanced**, **Metadata**, or open the **JSON** editor for the user.

#### Option B — SQL Editor (if the UI has no app metadata field)

Run in **SQL Editor** (uses the `auth` schema; your project must allow this — usually works with the default Supabase role):

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'your-admin@email.com';
```

Then **sign out** and **sign in** again in the admin app.

#### Option C — Service role script

Use `supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } })` with the **service role** key (never in the browser).

---

If you only update `public.profiles.role`, the dashboard may still block you until **`raw_app_meta_data` / app_metadata** matches. You can keep both in sync with a DB trigger or the admin API.

## R2 uploads (via worker only)

| Variable | Required | Purpose |
|----------|----------|---------|
| **`NEXT_PUBLIC_UPLOAD_SIGNER_URL`** | **Yes** | Base URL of the **upload-signer** worker (no trailing slash), e.g. `https://upload-signer.your-subdomain.workers.dev` |

The admin browser calls `POST {NEXT_PUBLIC_UPLOAD_SIGNER_URL}/sign-upload` with the Supabase **access token** and JSON body `{ fileName, contentType, productId, mode }`. R2 credentials live only in the worker.

**R2 secrets must not** be in the admin app’s public env.

## Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL if you use it in links |

## Deploy checklist

### Cloudflare Pages (GitHub Actions)

See **[DEPLOY_CLOUDFLARE_PAGES.md](./DEPLOY_CLOUDFLARE_PAGES.md)** — workflow **`.github/workflows/deploy-admin.yml`** builds static admin and publishes `out/` to Pages.

### Manual checklist

1. Deploy **`apps/upload-signer`** (Wrangler) and set worker secrets (`CLOUDFLARE_R2_*`, `SUPABASE_JWT_SECRET`, etc.).
2. Set **`NEXT_PUBLIC_UPLOAD_SIGNER_URL`** in the admin deployment to that worker URL.
3. Ensure CORS on the worker allows your admin origin (`CORS_ORIGINS` in worker or permissive during dev).
