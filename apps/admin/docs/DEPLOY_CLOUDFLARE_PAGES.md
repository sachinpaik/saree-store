# Deploy admin to Cloudflare Pages (GitHub Actions)

The admin app uses **`output: "export"`** (static `out/`). CI builds Next.js, then uploads **`apps/admin/out`** to **Cloudflare Pages** via [cloudflare/pages-action](https://github.com/cloudflare/pages-action).

---

## 1. One-time: create a Pages project

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** tab.
2. Choose **Direct Upload** (we deploy from GitHub Actions, not Cloudflare’s Git integration).
3. Set **project name** to match what you use in GitHub (default in workflow: **`saree-admin`**), or pick any name and set **`CLOUDFLARE_PAGES_PROJECT_NAME`** in GitHub (see below).

You only need the empty project; the workflow uploads builds.

---

## 2. API token (Pages + account)

Use a Cloudflare **API token** that can deploy to Pages:

- **Account** → **Cloudflare Pages** → **Edit**
- **Account** → **Account Settings** → **Read** (if required)

Or extend the token you use for **upload-signer** with **Cloudflare Pages → Edit** so one token can deploy both.

Store as GitHub secret: **`CLOUDFLARE_API_TOKEN`**.

Also add **`CLOUDFLARE_ACCOUNT_ID`** (Workers & Pages → overview → **Account ID**).

---

## 3. GitHub secrets (build-time env)

`NEXT_PUBLIC_*` values are **baked in at build time**. Set them under **Repository → Settings → Secrets and variables → Actions**.

### Required

| Secret | Purpose |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_UPLOAD_SIGNER_URL` | Base URL of **upload-signer** Worker (no trailing slash) |

### Optional

| Secret | Purpose |
|--------|--------|
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL` | Public R2/custom domain base for image URLs (if you use it) |
| `NEXT_PUBLIC_SITE_URL` | Canonical admin URL (if your app uses it) |

See also [ENVIRONMENT.md](./ENVIRONMENT.md).

---

## 4. GitHub variable (project name)

**Settings → Secrets and variables → Actions → Variables** (not a secret):

| Variable | Purpose |
|----------|--------|
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Must match the **Cloudflare Pages** project name. If unset, the workflow defaults to **`saree-admin`**. |

---

## 5. Workflow file

**`.github/workflows/deploy-admin.yml`**

Runs on push to **`main`** when **`apps/admin/**` changes (or manual **Run workflow**).

Steps: `npm ci` → `npm run build` in `apps/admin` → **Publish** `apps/admin/out` to Pages.

---

## 6. Upload-signer CORS

After the admin has a Pages URL (e.g. `https://saree-admin.pages.dev` or a custom domain), add that **origin** to the Worker:

- GitHub secret **`UPLOAD_SIGNER_CORS_ORIGINS`** on the upload-signer workflow, **or**
- Worker variable **`CORS_ORIGINS`** in the Cloudflare dashboard,

so the browser can call `POST /sign-upload` from the deployed admin.

---

## 7. Custom domain (optional)

Cloudflare Pages → your project → **Custom domains** → add domain and complete DNS.

Update **`NEXT_PUBLIC_SITE_URL`** (if used) and **CORS** on upload-signer to include the new origin.

---

## Troubleshooting

| Issue | Check |
|--------|--------|
| Pages deploy 403 / failed | API token includes **Cloudflare Pages → Edit** |
| Build fails “missing NEXT_PUBLIC_*” | All three required secrets set in GitHub |
| Upload fails in deployed admin | `NEXT_PUBLIC_UPLOAD_SIGNER_URL` correct; Worker **CORS** includes admin origin |
| Wrong project | `CLOUDFLARE_PAGES_PROJECT_NAME` matches Cloudflare project name |

---

## Related

- [ENVIRONMENT.md](./ENVIRONMENT.md) — local `.env.local` and Supabase admin role  
- [../../upload-signer/docs/DEPLOY_FROM_GITHUB.md](../../upload-signer/docs/DEPLOY_FROM_GITHUB.md) — upload-signer from GitHub  

