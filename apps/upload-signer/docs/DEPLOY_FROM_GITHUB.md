# Deploy upload-signer entirely from GitHub

This is the **recommended** path: one push to `main` deploys the Worker and applies **all** secrets from **GitHub Actions secrets** — no local `wrangler login` or manual `wrangler secret put` required for day‑to‑day work.

Manual / dashboard steps (R2 bucket, token permissions) are still one-time; see [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md) for troubleshooting and CORS details.

---

## 1. One-time: Cloudflare API token

1. Cloudflare Dashboard → **My Profile** → **API Tokens** → **Create Token**.
2. Use **“Edit Cloudflare Workers”** or a custom token with at least:
   - **Account** → **Workers Scripts** → **Edit** (includes deploying the Worker and updating secrets)
   - **Account** → **Account Settings** → **Read** (if prompted)
3. Save the token — you will add it as **`CLOUDFLARE_API_TOKEN`** in GitHub.

---

## 2. One-time: Account ID

Cloudflare Dashboard → **Workers & Pages** → **Overview** (or any Worker) → copy **Account ID** from the right sidebar.

Add it as **`CLOUDFLARE_ACCOUNT_ID`** in GitHub (used by Wrangler in CI).

---

## 3. GitHub repository secrets (required)

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

### Wrangler / CI (required)

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token from §1 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from §2 |

### Worker bindings (required — same names as in `src/env.ts`)

These values are pushed to the Worker with `wrangler secret put` on every successful deploy:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account ID used for R2 S3 API (often same as `CLOUDFLARE_ACCOUNT_ID`) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name |
| `SUPABASE_JWT_SECRET` | Supabase **JWT Secret** (Dashboard → **Settings** → **API**) — used to verify admin JWTs |

### Optional

| Secret | Description |
|--------|-------------|
| `UPLOAD_SIGNER_CORS_ORIGINS` | Comma-separated allowed **Origin** values for the browser admin (e.g. `https://admin.pages.dev,https://admin.example.com`). If unset, the Worker allows any origin (OK for early dev; tighten for production). Passed as plain variable `CORS_ORIGINS` at deploy time. |
| `UPLOAD_SIGNER_SUPABASE_URL` | Optional — sets Worker secret `SUPABASE_URL` if your code needs it (`src/env.ts`). |

**Do not** commit these values in the repo.

---

## 4. Workflow

The workflow file is:

**`.github/workflows/deploy-upload-signer.yml`**

It runs when:

- You push to **`main`** and something under **`apps/upload-signer/**`** changes, or
- The workflow file itself changes, or
- You run it manually (**Actions** → **Deploy upload-signer** → **Run workflow**).

Steps:

1. `npm ci` in `apps/upload-signer`
2. **`wrangler deploy`** (creates/updates the Worker). If `UPLOAD_SIGNER_CORS_ORIGINS` is set, deploy includes `--var CORS_ORIGINS=...`
3. **`wrangler secret put`** for each required Worker secret, reading from GitHub secrets

---

## 5. After the first successful run

1. GitHub → **Actions** → open the green run.
2. Cloudflare → **Workers & Pages** → **upload-signer** → note the **`*.workers.dev`** URL (or attach a custom domain — [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)).
3. In **admin** hosting env, set:

   `NEXT_PUBLIC_UPLOAD_SIGNER_URL=https://upload-signer.<your-subdomain>.workers.dev`

   (no trailing slash)

4. Smoke test: `POST /sign-upload` without `Authorization` should return **401** ([DEPLOY_CLOUDFLARE.md §8](./DEPLOY_CLOUDFLARE.md#8-verify)).

---

## 6. Rotating values

| What | Where |
|------|--------|
| API token | New token in Cloudflare → update `CLOUDFLARE_API_TOKEN` in GitHub |
| R2 / Supabase secrets | Update the GitHub secret → push or re-run workflow; sync step overwrites Worker secrets |
| CORS | Update `UPLOAD_SIGNER_CORS_ORIGINS` → push or re-run workflow |

---

## 7. Monorepo path

Always deploy from **`apps/upload-signer`** (contains `wrangler.toml`).

---

## Related

- [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md) — R2 tokens, CORS details, custom domain, troubleshooting  
- [README.md](../README.md) — API and admin env vars  
